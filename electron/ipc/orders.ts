/**
 * Order IPC Handlers – Branch-Scoped & Protected
 *
 * All queries enforce branchId from session context.
 * Auto-commission on DELIVERED, reversal on cancel.
 */

import type { IpcMain } from 'electron'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'
import {
  calculateCommission,
  buildCommissionLedgerEntry,
} from '../../src/services/finance'

let orderSequence = 151

function generateOrderNo(branchCode?: string): string {
  orderSequence++
  const year = new Date().getFullYear()
  const prefix = branchCode ? `${branchCode}-` : 'ORD-'
  return `${prefix}${year}-${String(orderSequence).padStart(4, '0')}`
}

function generateEntryNo(): string {
  const ts = Date.now().toString(36).toUpperCase()
  return `LED-${ts}`
}

export function registerOrderHandlers(ipcMain: IpcMain) {
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

  ipcMain.handle('orders:create', protectedProcedure('manage_orders', async (ctx, data: {
    accountId: string; currency: string; vatRate: string
    agencyStaffId?: string; agencyCommissionRate?: string; staffCommissionRate?: string
    exchangeRate: string; notes?: string
    items: { productName: string; productGroup?: string; sku?: string; quantity: string; unit: string; unitPrice: string; purchasePrice?: string }[]
  }) => {
    try {
      // Verify account belongs to this branch
      const account = await ctx.prisma.account.findFirst({
        where: { id: data.accountId, branchId: ctx.activeBranchId },
      })
      if (!account) return { success: false, error: 'Cari bu şubeye ait değil.' }

      let totalAmount = 0
      const itemsData = data.items.map((item) => {
        const qty = parseFloat(item.quantity)
        const price = parseFloat(item.unitPrice)
        const lineTotal = qty * price
        totalAmount += lineTotal
        return {
          productName: item.productName, productGroup: item.productGroup,
          sku: item.sku, quantity: item.quantity, unit: item.unit,
          unitPrice: item.unitPrice, totalPrice: lineTotal.toFixed(2),
          purchasePrice: item.purchasePrice ?? '0',
        }
      })

      const vatRate = parseFloat(data.vatRate)
      const vatAmount = totalAmount * (vatRate / 100)
      const grandTotal = totalAmount + vatAmount

      const order = await ctx.prisma.order.create({
        data: {
          orderNo: generateOrderNo(),
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

      await ctx.prisma.orderItem.createMany({
        data: itemsData.map((item) => ({ ...item, orderId: order.id })),
      })

      // Ledger: INVOICE entry
      await ctx.prisma.ledgerEntry.create({
        data: {
          entryNo: generateEntryNo(), accountId: data.accountId,
          branchId: ctx.activeBranchId, type: 'INVOICE',
          debit: grandTotal.toFixed(2), credit: '0',
          currency: data.currency, exchangeRate: data.exchangeRate,
          costCenter: 'SALES',
          description: `Satış faturası – ${order.orderNo}`,
          referenceId: order.id, referenceType: 'ORDER',
        },
      })

      await writeAuditLog({
        entityType: 'Order', entityId: order.id, action: 'CREATE',
        newData: { order, items: itemsData },
        userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Yeni sipariş: ${order.orderNo}`,
      })

      return { success: true, data: order }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('orders:updateStatus', protectedProcedure('manage_orders', async (ctx, args: {
    id: string; status: string
  }) => {
    try {
      const order = await ctx.prisma.order.findFirst({
        where: { id: args.id, branchId: ctx.activeBranchId },
        include: {
          account: true,
          agencyStaff: { include: { agency: { include: { account: true } } } },
        },
      })

      if (!order) return { success: false, error: 'Sipariş bulunamadı' }
      if (order.isCancelled) return { success: false, error: 'İptal edilmiş sipariş güncellenemez' }

      const previousStatus = order.status
      const updated = await ctx.prisma.order.update({
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

        await ctx.prisma.commissionRecord.create({
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

        await ctx.prisma.ledgerEntry.create({
          data: {
            entryNo: generateEntryNo(),
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
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('orders:cancel', protectedProcedure('manage_orders', async (ctx, args: {
    id: string; reason: string
  }) => {
    try {
      const order = await ctx.prisma.order.findFirst({
        where: { id: args.id, branchId: ctx.activeBranchId },
      })
      if (!order) return { success: false, error: 'Sipariş bulunamadı' }
      if (order.isCancelled) return { success: false, error: 'Zaten iptal edilmiş' }

      await ctx.prisma.order.update({
        where: { id: args.id },
        data: { isCancelled: true, status: 'CANCELLED' },
      })

      // Reversal ledger entry
      await ctx.prisma.ledgerEntry.create({
        data: {
          entryNo: generateEntryNo(), accountId: order.accountId,
          branchId: ctx.activeBranchId, type: 'REVERSAL',
          debit: '0', credit: String(order.grandTotal),
          currency: order.currency, exchangeRate: String(order.orderExchangeRate),
          costCenter: 'SALES_REVERSAL',
          description: `Sipariş iptali (Ters Fiş) – ${order.orderNo}: ${args.reason}`,
          referenceId: args.id, referenceType: 'ORDER',
        },
      })

      await writeAuditLog({
        entityType: 'Order', entityId: args.id, action: 'CANCEL',
        previousData: order, userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Sipariş iptal: ${order.orderNo} – ${args.reason}`,
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
