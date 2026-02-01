/**
 * Order IPC Handlers – Branch-Scoped & Protected
 *
 * - Atomic DB-backed sequence for order numbers
 * - All financial math via Decimal.js
 * - $transaction for ACID compliance
 * - Stock reservation on create, unreservation on cancel
 * - NO ledger entry at order stage (invoices handle that)
 * - Auto-commission on DELIVERED
 */

import type { IpcMain } from 'electron'
import Decimal from 'decimal.js'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'
import {
  calculateCommission,
  buildCommissionLedgerEntry,
} from '../../src/services/finance'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// ─── Atomic Sequence ────────────────────────────────────────
async function nextSequenceValue(tx: any, key: string): Promise<number> {
  const result = await tx.$queryRaw`
    INSERT INTO sequences (id, key, value)
    VALUES (gen_random_uuid(), ${key}, 1)
    ON CONFLICT (key)
    DO UPDATE SET value = sequences.value + 1
    RETURNING value
  ` as { value: number }[]
  return result[0].value
}

async function generateOrderNo(tx: any, branchCode?: string): Promise<string> {
  const year = new Date().getFullYear()
  const seq = await nextSequenceValue(tx, `order-${year}`)
  const prefix = branchCode ? `${branchCode}-` : 'ORD-'
  return `${prefix}${year}-${String(seq).padStart(4, '0')}`
}

async function generateEntryNo(tx: any, prefix = 'LED'): Promise<string> {
  const year = new Date().getFullYear()
  const seq = await nextSequenceValue(tx, `${prefix.toLowerCase()}-${year}`)
  return `${prefix}-${year}-${String(seq).padStart(5, '0')}`
}

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
          account: { select: { id: true, code: true, name: true } },
          items: true,
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
        },
      })
    } catch (error) {
      console.error('[IPC] orders:get error:', error)
      return null
    }
  }))

  // CREATE — wrapped in $transaction, Decimal.js math, stock reservation, NO ledger
  ipcMain.handle('orders:create', protectedProcedure('manage_orders', async (ctx, data: {
    accountId: string; currency: string; vatRate: string
    agencyStaffId?: string; agencyCommissionRate?: string; staffCommissionRate?: string
    exchangeRate: string; notes?: string
    items: { productName: string; productGroup?: string; sku?: string; quantity: string; unit: string; unitPrice: string; purchasePrice?: string }[]
  }) => {
    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        // Verify account belongs to this branch
        const account = await tx.account.findFirst({
          where: { id: data.accountId, branchId: ctx.activeBranchId },
        })
        if (!account) return { success: false, error: 'Cari bu şubeye ait değil.' }

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

        const orderNo = await generateOrderNo(tx)

        const order = await tx.order.create({
          data: {
            orderNo,
            accountId: data.accountId,
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
          const stock = await tx.stock.findFirst({
            where: { sku: item.sku, branchId: ctx.activeBranchId },
          })
          if (stock) {
            const newReserved = new Decimal(String(stock.reservedQuantity ?? 0))
              .plus(new Decimal(item.quantity))
            await tx.stock.update({
              where: { id: stock.id },
              data: { reservedQuantity: newReserved.toFixed(2) },
            })
            await tx.stockMovement.create({
              data: {
                stockId: stock.id, branchId: ctx.activeBranchId,
                type: 'RESERVE', quantity: item.quantity,
                referenceId: order.id, referenceType: 'ORDER',
                description: `Sipariş rezerve: ${orderNo}`,
              },
            })
          }
        }

        await writeAuditLog({
          entityType: 'Order', entityId: order.id, action: 'CREATE',
          newData: { order, items: itemsData },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Yeni sipariş: ${order.orderNo}`,
        })

        return { success: true, data: order }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // UPDATE STATUS — with auto-commission on DELIVERED
  ipcMain.handle('orders:updateStatus', protectedProcedure('manage_orders', async (ctx, args: {
    id: string; status: string
  }) => {
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

          const entryNo = await generateEntryNo(tx, 'COM')
          await tx.ledgerEntry.create({
            data: {
              entryNo,
              branchId: ctx.activeBranchId,
              ...ledgerData,
            },
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
  ipcMain.handle('orders:cancel', protectedProcedure('manage_orders', async (ctx, args: {
    id: string; reason: string
  }) => {
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
            where: { sku: item.sku, branchId: ctx.activeBranchId },
          })
          if (stock) {
            const newReserved = Decimal.max(
              new Decimal(0),
              new Decimal(String(stock.reservedQuantity ?? 0)).minus(new Decimal(String(item.quantity))),
            )
            await tx.stock.update({
              where: { id: stock.id },
              data: { reservedQuantity: newReserved.toFixed(2) },
            })
            await tx.stockMovement.create({
              data: {
                stockId: stock.id, branchId: ctx.activeBranchId,
                type: 'UNRESERVE', quantity: String(item.quantity),
                referenceId: args.id, referenceType: 'ORDER',
                description: `Sipariş iptal – rezerve kaldırma: ${order.orderNo}`,
              },
            })
          }
        }

        // 3. Cancel related invoices and their ledger entries
        const invoices = await tx.invoice.findMany({
          where: { orderId: args.id, isCancelled: false },
        })
        for (const inv of invoices) {
          await tx.invoice.update({ where: { id: inv.id }, data: { isCancelled: true, status: 'CANCELLED' } })

          const reversalEntryNo = await generateEntryNo(tx, 'REV')
          await tx.ledgerEntry.create({
            data: {
              entryNo: reversalEntryNo, accountId: order.accountId,
              branchId: ctx.activeBranchId, type: 'REVERSAL',
              debit: '0', credit: String(inv.grandTotal),
              currency: inv.currency, exchangeRate: String(inv.exchangeRate ?? order.orderExchangeRate),
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

        await writeAuditLog({
          entityType: 'Order', entityId: args.id, action: 'CANCEL',
          previousData: order, userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Sipariş iptal: ${order.orderNo} – ${args.reason}`,
        })

        return { success: true }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
