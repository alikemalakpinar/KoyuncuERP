/**
 * Sales Return (İade) IPC Handlers – Branch-Scoped & Protected
 * All math via Decimal.js, all writes in $transaction.
 * Zod validation on all inputs.
 *
 * Flow: Create Return → Approve → Complete (stock in + credit customer + reverse commission)
 */

import type { IpcMain } from 'electron'
import Decimal from 'decimal.js'
import { z } from 'zod'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'
import { nextDocumentNo } from '../services/sequence'
import { InventoryService } from '../services/inventory'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// ─── Validation ─────────────────────────────────────────────
const createReturnSchema = z.object({
  orderId: z.string().min(1, 'Sipariş seçilmedi'),
  reason: z.string().min(1, 'İade nedeni gerekli'),
  items: z.array(z.object({
    variantId: z.string().min(1),
    quantity: z.string().refine(v => { try { return new Decimal(v).gt(0) } catch { return false } }, 'Miktar pozitif olmalı'),
    unitPrice: z.string().refine(v => { try { return new Decimal(v).gte(0) } catch { return false } }, 'Fiyat negatif olamaz'),
  })).min(1, 'En az bir kalem ekleyin'),
})

// ─── Handlers ───────────────────────────────────────────────
export function registerReturnHandlers(ipcMain: IpcMain) {
  // LIST RETURNS
  ipcMain.handle('returns:list', protectedProcedure('read', async (ctx, filters?: {
    status?: string; dateFrom?: string; dateTo?: string
  }) => {
    try {
      const where: any = { branchId: ctx.activeBranchId, isCancelled: false }
      if (filters?.status) where.status = filters.status
      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {}
        if (filters?.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
        if (filters?.dateTo) where.createdAt.lte = new Date(filters.dateTo)
      }

      return await ctx.prisma.salesReturn.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNo: true } },
          account: { select: { name: true } },
          items: { include: { variant: { select: { sku: true, size: true, color: true } } } },
        },
      })
    } catch (error) {
      console.error('[IPC] returns:list error:', error)
      return []
    }
  }))

  // GET SINGLE RETURN
  ipcMain.handle('returns:get', protectedProcedure('read', async (ctx, args: { id: string }) => {
    try {
      return await ctx.prisma.salesReturn.findFirst({
        where: { id: args.id, branchId: ctx.activeBranchId },
        include: {
          order: { select: { orderNo: true, currency: true } },
          account: { select: { name: true, code: true } },
          items: { include: { variant: { select: { sku: true, size: true, color: true, productId: true } } } },
        },
      })
    } catch (error) {
      console.error('[IPC] returns:get error:', error)
      return null
    }
  }))

  // CREATE RETURN — $transaction + Decimal.js
  ipcMain.handle('returns:create', protectedProcedure('manage_orders', async (ctx, rawData: any) => {
    const parsed = createReturnSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, error: `Geçersiz giriş: ${parsed.error.errors.map(e => e.message).join(', ')}` }
    }
    const data = parsed.data

    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        // Verify order
        const order = await tx.order.findFirst({
          where: { id: data.orderId, branchId: ctx.activeBranchId },
          select: { id: true, accountId: true, currency: true, orderNo: true, isCancelled: true },
        })
        if (!order) return { success: false, error: 'Sipariş bulunamadı.' }
        if (order.isCancelled) return { success: false, error: 'İptal edilmiş siparişe iade yapılamaz.' }

        const returnNo = await nextDocumentNo(tx, ctx.activeBranchId, 'RETURN')

        // Calculate total
        let totalAmount = new Decimal(0)
        const returnItems = data.items.map(item => {
          const qty = new Decimal(item.quantity)
          const price = new Decimal(item.unitPrice)
          const lineTotal = qty.mul(price)
          totalAmount = totalAmount.plus(lineTotal)
          return {
            variantId: item.variantId,
            quantity: qty.toFixed(2),
            unitPrice: price.toFixed(2),
            totalPrice: lineTotal.toFixed(2),
          }
        })

        const salesReturn = await tx.salesReturn.create({
          data: {
            returnNo,
            orderId: data.orderId,
            branchId: ctx.activeBranchId,
            accountId: order.accountId,
            reason: data.reason,
            totalAmount: totalAmount.toFixed(2),
            currency: order.currency,
            createdBy: ctx.user.id,
            items: { create: returnItems },
          },
          include: { items: true },
        })

        await writeAuditLog({
          entityType: 'SalesReturn', entityId: salesReturn.id, action: 'CREATE',
          newData: { returnNo, orderId: data.orderId, totalAmount: totalAmount.toFixed(2) },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `İade oluşturuldu: ${returnNo} (Sipariş: ${order.orderNo})`,
        })

        return { success: true, data: salesReturn }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // APPROVE RETURN
  ipcMain.handle('returns:approve', protectedProcedure('manage_orders', async (ctx, args: { id: string }) => {
    try {
      const ret = await ctx.prisma.salesReturn.findFirst({
        where: { id: args.id, branchId: ctx.activeBranchId },
      })
      if (!ret) return { success: false, error: 'İade bulunamadı.' }
      if (ret.status !== 'PENDING') return { success: false, error: 'Sadece bekleyen iadeler onaylanabilir.' }

      await ctx.prisma.salesReturn.update({
        where: { id: args.id },
        data: { status: 'APPROVED' },
      })

      await writeAuditLog({
        entityType: 'SalesReturn', entityId: args.id, action: 'STATUS_CHANGE',
        newData: { status: 'APPROVED' },
        userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `İade onaylandı: ${ret.returnNo}`,
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // COMPLETE RETURN — stock in + credit customer + reverse commission
  ipcMain.handle('returns:complete', protectedProcedure('manage_orders', async (ctx, args: {
    id: string; warehouseId: string
  }) => {
    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        const ret = await tx.salesReturn.findFirst({
          where: { id: args.id, branchId: ctx.activeBranchId },
          include: {
            items: { include: { variant: { select: { productId: true } } } },
            order: { select: { orderNo: true, agencyStaffId: true, agencyCommissionRate: true } },
          },
        })
        if (!ret) return { success: false, error: 'İade bulunamadı.' }
        if (ret.status !== 'APPROVED') return { success: false, error: 'Sadece onaylanmış iadeler tamamlanabilir.' }

        const inventorySvc = new InventoryService(tx)
        const totalAmount = new Decimal(String(ret.totalAmount))

        // 1. Stock In for each return item
        for (const item of ret.items) {
          await inventorySvc.stockIn({
            variantId: item.variantId,
            warehouseId: args.warehouseId,
            branchId: ctx.activeBranchId,
            quantity: String(item.quantity),
            unitCost: String(item.unitPrice),
            referenceId: ret.id,
            referenceType: 'SALES_RETURN',
            notes: `İade girişi: ${ret.returnNo}`,
          })
        }

        // 2. Credit customer (decrease account balance)
        await tx.account.update({
          where: { id: ret.accountId },
          data: { currentBalance: { decrement: totalAmount.toNumber() } },
        })

        // 3. Create reversal ledger entry
        const entryNo = await nextDocumentNo(tx, ctx.activeBranchId, 'LEDGER')
        await tx.ledgerEntry.create({
          data: {
            entryNo,
            accountId: ret.accountId,
            branchId: ctx.activeBranchId,
            type: 'ADJUSTMENT',
            debit: '0',
            credit: totalAmount.toFixed(2),
            currency: ret.currency,
            exchangeRate: '1',
            costCenter: 'RETURN',
            description: `İade alacak kaydı: ${ret.returnNo} (Sipariş: ${ret.order.orderNo})`,
            referenceId: ret.id,
            referenceType: 'SALES_RETURN',
          },
        })

        // 4. Reverse commission if applicable
        if (ret.order.agencyStaffId && new Decimal(String(ret.order.agencyCommissionRate)).gt(0)) {
          const commRate = new Decimal(String(ret.order.agencyCommissionRate))
          const commAmount = totalAmount.mul(commRate).div(100)

          const activeCommissions = await tx.commissionRecord.findMany({
            where: { orderId: ret.orderId, branchId: ctx.activeBranchId, isCancelled: false },
          })

          for (const comm of activeCommissions) {
            await tx.commissionRecord.update({
              where: { id: comm.id },
              data: { isCancelled: true },
            })
          }

          await writeAuditLog({
            entityType: 'CommissionRecord', entityId: ret.id, action: 'REVERSAL',
            newData: { returnNo: ret.returnNo, reversedAmount: commAmount.toFixed(2) },
            userId: ctx.user.id, branchId: ctx.activeBranchId,
            description: `İade komisyon iptali: ${commAmount.toFixed(2)} ${ret.currency}`,
          })
        }

        // 5. Update return status
        await tx.salesReturn.update({
          where: { id: args.id },
          data: { status: 'COMPLETED' },
        })

        await writeAuditLog({
          entityType: 'SalesReturn', entityId: args.id, action: 'STATUS_CHANGE',
          newData: { status: 'COMPLETED', totalAmount: totalAmount.toFixed(2) },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `İade tamamlandı: ${ret.returnNo} — ${totalAmount.toFixed(2)} ${ret.currency}`,
        })

        return { success: true }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // CANCEL RETURN
  ipcMain.handle('returns:cancel', protectedProcedure('manage_orders', async (ctx, args: { id: string; reason?: string }) => {
    try {
      const ret = await ctx.prisma.salesReturn.findFirst({
        where: { id: args.id, branchId: ctx.activeBranchId },
      })
      if (!ret) return { success: false, error: 'İade bulunamadı.' }
      if (ret.status === 'COMPLETED') return { success: false, error: 'Tamamlanmış iade iptal edilemez.' }
      if (ret.isCancelled) return { success: false, error: 'İade zaten iptal edilmiş.' }

      await ctx.prisma.salesReturn.update({
        where: { id: args.id },
        data: { isCancelled: true, status: 'CANCELLED' },
      })

      await writeAuditLog({
        entityType: 'SalesReturn', entityId: args.id, action: 'CANCEL',
        newData: { reason: args.reason },
        userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `İade iptal edildi: ${ret.returnNo}${args.reason ? ` (${args.reason})` : ''}`,
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
