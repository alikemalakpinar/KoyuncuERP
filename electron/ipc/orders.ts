/**
 * Order IPC Handlers – Branch-Scoped & Protected
 *
 * - Atomic DB-backed DocumentSequence for order numbers
 * - All financial math via Decimal.js
 * - $transaction for ACID compliance
 * - Stock reservation on create, unreservation on cancel
 * - NO ledger entry at order stage (invoices handle that)
 * - Auto-commission on DELIVERED
 */

import type { IpcMain } from 'electron'
import Decimal from 'decimal.js'
import { z } from 'zod'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'
import { nextDocumentNo } from '../services/sequence'
import {
  calculateCommission,
  buildCommissionLedgerEntry,
} from '../../src/services/finance'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// ─── Validation Schemas ─────────────────────────────────────
const orderItemSchema = z.object({
  productName: z.string().min(1, 'Ürün adı gerekli'),
  productGroup: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.string().refine(v => new Decimal(v).gt(0), 'Miktar pozitif olmalı'),
  unit: z.string().min(1),
  unitPrice: z.string().refine(v => new Decimal(v).gte(0), 'Fiyat negatif olamaz'),
  purchasePrice: z.string().optional(),
})

const createOrderSchema = z.object({
  accountId: z.string().min(1, 'Cari seçilmedi'),
  sellerId: z.string().optional(), // Satış temsilcisi (giriş yapan kullanıcı)
  currency: z.string().min(1),
  vatRate: z.string().refine(v => new Decimal(v).gte(0), 'KDV negatif olamaz'),
  agencyStaffId: z.string().optional(),
  agencyCommissionRate: z.string().optional(),
  staffCommissionRate: z.string().optional(),
  exchangeRate: z.string().refine(v => new Decimal(v).gt(0), 'Kur pozitif olmalı'),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'En az 1 kalem gerekli'),
})

const updateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'PARTIALLY_SHIPPED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
})

const cancelOrderSchema = z.object({
  id: z.string().min(1),
  reason: z.string().min(1, 'İptal sebebi gerekli'),
})

// ─── Handlers ───────────────────────────────────────────────
export function registerOrderHandlers(ipcMain: IpcMain) {
  // LIST
  ipcMain.handle('orders:list', protectedProcedure('read', async (ctx, filters?: {
    status?: string; accountId?: string; isCancelled?: boolean
  }) => {
    try {
      const where: any = {
        branchId: ctx.activeBranchId,
        isCancelled: filters?.isCancelled ?? false,
      }
      if (filters?.status) where.status = filters.status
      if (filters?.accountId) where.accountId = filters.accountId

      return await ctx.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          account: {
            select: {
              id: true, code: true, name: true,
              referredByAgency: { include: { account: { select: { id: true, name: true } } } },
            },
          },
          items: true,
          seller: { select: { id: true, fullName: true, email: true } }, // Satış temsilcisi
          agencyStaff: { select: { id: true, name: true, agency: { select: { id: true, account: { select: { name: true } } } } } },
        },
      })
    } catch (error) {
      console.error('[IPC] orders:list error:', error)
      return []
    }
  }))

  // GET
  ipcMain.handle('orders:get', protectedProcedure('read', async (ctx, args: { id: string }) => {
    try {
      return await ctx.prisma.order.findFirst({
        where: { id: args.id, branchId: ctx.activeBranchId },
        include: {
          account: true,
          items: true,
          shipments: { where: { isCancelled: false } },
          landedCosts: { where: { isCancelled: false } },
          commissionRecords: { where: { isCancelled: false } },
          agencyStaff: { include: { agency: { include: { account: true } } } },
          payments: true,
          invoices: true,
        },
      })
    } catch (error) {
      console.error('[IPC] orders:get error:', error)
      return null
    }
  }))

  // CREATE — wrapped in $transaction, Decimal.js math, stock validation & reservation, NO ledger
  ipcMain.handle('orders:create', protectedProcedure('manage_orders', async (ctx, rawData: any) => {
    // Zod validation
    const parsed = createOrderSchema.safeParse(rawData)
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join(', ')
      return { success: false, error: `Geçersiz giriş: ${msg}` }
    }
    const data = parsed.data

    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        // Verify account belongs to this branch
        const account = await tx.account.findFirst({
          where: { id: data.accountId, branchId: ctx.activeBranchId },
        })
        if (!account) return { success: false, error: 'Cari bu şubeye ait değil.' }

        // Use logged-in user as seller if not provided
        const sellerId = data.sellerId || ctx.user.id

        // ═══════════════════════════════════════════════════════════
        // STOCK VALIDATION - Check available stock for each item
        // ═══════════════════════════════════════════════════════════
        const stockErrors: string[] = []
        for (const item of data.items) {
          if (!item.sku) continue

          // Find variant by SKU
          const variant = await tx.productVariant.findFirst({
            where: { sku: item.sku },
          })
          if (!variant) continue

          // Get inventory in branch's warehouse
          const inventory = await tx.inventoryItem.findFirst({
            where: {
              variantId: variant.id,
              warehouse: {
                code: { startsWith: 'WH-' }, // Main warehouse
              },
            },
          })

          if (inventory) {
            const available = new Decimal(String(inventory.quantity))
              .minus(new Decimal(String(inventory.reservedQty || 0)))
            const requested = new Decimal(item.quantity)

            if (requested.gt(available)) {
              stockErrors.push(`${item.productName}: Talep ${requested.toFixed(0)}, Mevcut ${available.toFixed(0)} ${item.unit}`)
            }
          }
        }

        // If stock validation fails, return error (but don't block order creation)
        // In production, you might want to block: if (stockErrors.length > 0) return { success: false, error: ... }
        // For now, we'll just log a warning and continue
        if (stockErrors.length > 0) {
          console.warn('[Stock Warning]', stockErrors.join('; '))
        }

        let totalAmount = new Decimal(0)
        const itemsData = data.items.map((item) => {
          const qty = new Decimal(item.quantity)
          const price = new Decimal(item.unitPrice)
          const lineTotal = qty.mul(price)
          totalAmount = totalAmount.plus(lineTotal)
          return {
            productName: item.productName, productGroup: item.productGroup,
            sku: item.sku, quantity: item.quantity, unit: item.unit,
            unitPrice: item.unitPrice, totalPrice: lineTotal.toFixed(2),
            purchasePrice: item.purchasePrice ?? '0',
          }
        })

        const vatRate = new Decimal(data.vatRate)
        const vatAmount = totalAmount.mul(vatRate).div(100)
        const grandTotal = totalAmount.plus(vatAmount)

        const orderNo = await nextDocumentNo(tx, ctx.activeBranchId, 'ORDER')

        const order = await tx.order.create({
          data: {
            orderNo,
            accountId: data.accountId,
            sellerId, // Satış temsilcisi
            branchId: ctx.activeBranchId,
            currency: data.currency,
            totalAmount: totalAmount.toFixed(2),
            vatRate: data.vatRate, vatAmount: vatAmount.toFixed(2),
            grandTotal: grandTotal.toFixed(2),
            agencyStaffId: data.agencyStaffId,
            agencyCommissionRate: data.agencyCommissionRate ?? '0',
            staffCommissionRate: data.staffCommissionRate ?? '0',
            orderExchangeRate: data.exchangeRate,
            notes: data.notes,
          },
        })

        await tx.orderItem.createMany({
          data: itemsData.map((item) => ({ ...item, orderId: order.id })),
        })

        // Stock reservation for each item with a SKU
        for (const item of data.items) {
          if (!item.sku) continue

          const variant = await tx.productVariant.findFirst({
            where: { sku: item.sku },
          })
          if (!variant) continue

          const inventory = await tx.inventoryItem.findFirst({
            where: { variantId: variant.id },
          })

          if (inventory) {
            const newReserved = new Decimal(String(inventory.reservedQty ?? 0))
              .plus(new Decimal(item.quantity))
            await tx.inventoryItem.update({
              where: { id: inventory.id },
              data: { reservedQty: newReserved.toNumber() },
            })
          }
        }

        await writeAuditLog({
          entityType: 'Order', entityId: order.id, action: 'CREATE',
          newData: { orderNo, accountId: data.accountId, sellerId, grandTotal: grandTotal.toFixed(2) },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Yeni sipariş: ${order.orderNo} – ${grandTotal.toFixed(2)} ${data.currency}`,
        })

        return { success: true, data: order }
      })
    } catch (error: any) {
      console.error('[IPC] orders:create error:', error)
      return { success: false, error: error.message }
    }
  }))

  // UPDATE STATUS — with auto-commission on DELIVERED
  ipcMain.handle('orders:updateStatus', protectedProcedure('manage_orders', async (ctx, rawArgs: any) => {
    const parsed = updateStatusSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return { success: false, error: `Geçersiz giriş: ${parsed.error.errors.map(e => e.message).join(', ')}` }
    }
    const args = parsed.data

    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        const order = await tx.order.findFirst({
          where: { id: args.id, branchId: ctx.activeBranchId },
          include: {
            account: true,
            agencyStaff: { include: { agency: { include: { account: true } } } },
          },
        })

        if (!order) return { success: false, error: 'Sipariş bulunamadı' }
        if (order.isCancelled) return { success: false, error: 'İptal edilmiş sipariş güncellenemez' }

        const previousStatus = order.status
        const updated = await tx.order.update({
          where: { id: args.id },
          data: { status: args.status as any },
        })

        // Auto-commission on DELIVERED
        if (args.status === 'DELIVERED' && order.agencyStaff) {
          const result = calculateCommission({
            orderId: args.id,
            orderTotal: String(order.grandTotal),
            agencyCommissionRate: String(order.agencyCommissionRate),
            staffCommissionRate: String(order.staffCommissionRate),
            agencyId: order.agencyStaff.agency.id,
            agencyStaffId: order.agencyStaff.id,
          })

          await tx.commissionRecord.create({
            data: {
              orderId: args.id,
              agencyId: order.agencyStaff.agency.id,
              branchId: ctx.activeBranchId,
              agencyStaffId: order.agencyStaff.id,
              commissionRate: String(order.agencyCommissionRate),
              baseAmount: String(order.grandTotal),
              commissionAmount: result.totalCommission,
            },
          })

          const agencyAccountId = order.agencyStaff.agency.accountId
          const ledgerData = buildCommissionLedgerEntry(
            args.id, order.orderNo, agencyAccountId,
            result.totalCommission, String(order.currency),
            String(order.orderExchangeRate),
          )

          const entryNo = await nextDocumentNo(tx, ctx.activeBranchId, 'COMMISSION')
          await tx.ledgerEntry.create({
            data: { entryNo, branchId: ctx.activeBranchId, ...ledgerData },
          })
        }

        await writeAuditLog({
          entityType: 'Order', entityId: args.id, action: 'STATUS_CHANGE',
          previousData: { status: previousStatus }, newData: { status: args.status },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Sipariş durumu: ${previousStatus} → ${args.status} (${order.orderNo})`,
        })

        return { success: true, data: updated }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // CANCEL — stock unreservation, invoice cancellation, commission reversal
  ipcMain.handle('orders:cancel', protectedProcedure('manage_orders', async (ctx, rawArgs: any) => {
    const parsed = cancelOrderSchema.safeParse(rawArgs)
    if (!parsed.success) {
      return { success: false, error: `Geçersiz giriş: ${parsed.error.errors.map(e => e.message).join(', ')}` }
    }
    const args = parsed.data

    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        const order = await tx.order.findFirst({
          where: { id: args.id, branchId: ctx.activeBranchId },
          include: { items: true },
        })
        if (!order) return { success: false, error: 'Sipariş bulunamadı' }
        if (order.isCancelled) return { success: false, error: 'Zaten iptal edilmiş' }

        // 1. Cancel order
        await tx.order.update({
          where: { id: args.id },
          data: { isCancelled: true, status: 'CANCELLED' },
        })

        // 2. Unreserve stock
        for (const item of order.items) {
          if (!item.sku) continue
          const stock = await tx.stock.findFirst({
            where: { variant: { sku: item.sku }, warehouse: { branch: { id: ctx.activeBranchId } } },
          })
          if (stock) {
            const newReserved = Math.max(0, stock.reservedQuantity - Math.round(new Decimal(String(item.quantity)).toNumber()))
            await tx.stock.update({
              where: { id: stock.id },
              data: { reservedQuantity: newReserved },
            })
          }
        }

        // 3. Cancel related invoices and their ledger entries
        const invoices = await tx.invoice.findMany({
          where: { orderId: args.id, isCancelled: false },
        })
        for (const inv of invoices) {
          await tx.invoice.update({ where: { id: inv.id }, data: { isCancelled: true, status: 'CANCELLED' } })

          const reversalEntryNo = await nextDocumentNo(tx, ctx.activeBranchId, 'LEDGER')
          await tx.ledgerEntry.create({
            data: {
              entryNo: reversalEntryNo, accountId: order.accountId,
              branchId: ctx.activeBranchId, type: 'REVERSAL',
              debit: '0', credit: String(inv.grandTotal),
              currency: inv.currency, exchangeRate: String(order.orderExchangeRate),
              costCenter: 'SALES_REVERSAL',
              description: `Fatura iptali (Ters Fiş) – ${inv.invoiceNo}: ${args.reason}`,
              referenceId: inv.id, referenceType: 'INVOICE',
            },
          })
        }

        // 4. Cancel commissions
        await tx.commissionRecord.updateMany({
          where: { orderId: args.id, isCancelled: false },
          data: { isCancelled: true },
        })

        // 5. Update account balance (reverse invoice amounts)
        if (invoices.length > 0) {
          const totalInvoiced = invoices.reduce(
            (sum: Decimal, inv: any) => sum.plus(new Decimal(String(inv.grandTotal))),
            new Decimal(0),
          )
          await tx.account.update({
            where: { id: order.accountId },
            data: { currentBalance: { decrement: totalInvoiced.toNumber() } },
          })
        }

        await writeAuditLog({
          entityType: 'Order', entityId: args.id, action: 'CANCEL',
          previousData: { orderNo: order.orderNo, status: order.status },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Sipariş iptal: ${order.orderNo} – ${args.reason}`,
        })

        return { success: true }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
