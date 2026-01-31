/**
 * Cash Register IPC Handlers – Branch-Scoped & Protected
 *
 * open/close register, record transactions, Z report
 */

import type { IpcMain } from 'electron'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'

export function registerCashHandlers(ipcMain: IpcMain) {
  ipcMain.handle('cash:registers', protectedProcedure('read', async (ctx) => {
    return ctx.prisma.cashRegister.findMany({
      where: { branchId: ctx.activeBranchId, isActive: true },
      orderBy: { name: 'asc' },
    })
  }))

  ipcMain.handle('cash:open', protectedProcedure('manage_cash_register', async (ctx, args: {
    registerId: string; openingBalance: string
  }) => {
    try {
      const reg = await ctx.prisma.cashRegister.findFirst({
        where: { id: args.registerId, branchId: ctx.activeBranchId },
      })
      if (!reg) return { success: false, error: 'Kasa bulunamadı' }
      if (reg.isOpen) return { success: false, error: 'Kasa zaten açık' }

      const updated = await ctx.prisma.cashRegister.update({
        where: { id: args.registerId },
        data: {
          isOpen: true, openingBalance: args.openingBalance,
          currentBalance: args.openingBalance, lastOpenedAt: new Date(),
        },
      })

      await writeAuditLog({
        entityType: 'CashRegister', entityId: args.registerId, action: 'UPDATE',
        newData: { action: 'OPEN', openingBalance: args.openingBalance },
        userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Kasa açıldı: ${reg.name} (${args.openingBalance})`,
      })
      return { success: true, data: updated }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('cash:close', protectedProcedure('manage_cash_register', async (ctx, args: {
    registerId: string; actualCash: string
  }) => {
    try {
      const reg = await ctx.prisma.cashRegister.findFirst({
        where: { id: args.registerId, branchId: ctx.activeBranchId },
      })
      if (!reg) return { success: false, error: 'Kasa bulunamadı' }
      if (!reg.isOpen) return { success: false, error: 'Kasa zaten kapalı' }

      const expected = parseFloat(String(reg.currentBalance))
      const actual = parseFloat(args.actualCash)
      const variance = actual - expected

      const updated = await ctx.prisma.cashRegister.update({
        where: { id: args.registerId },
        data: { isOpen: false, lastClosedAt: new Date() },
      })

      // Get day's transactions for Z report
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      const txns = await ctx.prisma.cashTransaction.findMany({
        where: { cashRegisterId: args.registerId, branchId: ctx.activeBranchId, createdAt: { gte: dayStart } },
      })

      const inflows = txns.filter((t: any) => t.type === 'IN').reduce((s: number, t: any) => s + parseFloat(String(t.amount)), 0)
      const outflows = txns.filter((t: any) => t.type === 'OUT').reduce((s: number, t: any) => s + parseFloat(String(t.amount)), 0)

      await writeAuditLog({
        entityType: 'CashRegister', entityId: args.registerId, action: 'UPDATE',
        newData: { action: 'CLOSE', actualCash: args.actualCash, expectedCash: expected.toFixed(2), variance: variance.toFixed(2) },
        userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Kasa kapandı: ${reg.name} (Beklenen: ${expected.toFixed(2)}, Gerçek: ${args.actualCash}, Fark: ${variance.toFixed(2)})`,
      })

      return {
        success: true,
        data: {
          register: updated,
          zReport: {
            openingBalance: parseFloat(String(reg.openingBalance)).toFixed(2),
            inflows: inflows.toFixed(2),
            outflows: outflows.toFixed(2),
            expectedCash: expected.toFixed(2),
            actualCash: args.actualCash,
            variance: variance.toFixed(2),
            transactionCount: txns.length,
          },
        },
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('cash:transact', protectedProcedure('manage_cash_register', async (ctx, data: {
    registerId: string; type: 'IN' | 'OUT'; amount: string; reason: string
    refType?: string; refId?: string
  }) => {
    try {
      const reg = await ctx.prisma.cashRegister.findFirst({
        where: { id: data.registerId, branchId: ctx.activeBranchId },
      })
      if (!reg) return { success: false, error: 'Kasa bulunamadı' }
      if (!reg.isOpen) return { success: false, error: 'Kasa kapalı, işlem yapılamaz' }

      const amount = parseFloat(data.amount)
      const newBalance = data.type === 'IN'
        ? parseFloat(String(reg.currentBalance)) + amount
        : parseFloat(String(reg.currentBalance)) - amount

      const txn = await ctx.prisma.cashTransaction.create({
        data: {
          cashRegisterId: data.registerId, branchId: ctx.activeBranchId,
          type: data.type, amount: data.amount, reason: data.reason,
          refType: data.refType, refId: data.refId,
          createdByUserId: ctx.user.id, // from session, NOT client
        },
      })

      await ctx.prisma.cashRegister.update({
        where: { id: data.registerId },
        data: { currentBalance: newBalance.toFixed(2) },
      })

      return { success: true, data: txn }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('cash:transactions', protectedProcedure('read', async (ctx, args: {
    registerId: string; date?: string
  }) => {
    const where: any = { cashRegisterId: args.registerId, branchId: ctx.activeBranchId }
    if (args.date) {
      const d = new Date(args.date)
      const next = new Date(d); next.setDate(next.getDate() + 1)
      where.createdAt = { gte: d, lt: next }
    }
    return ctx.prisma.cashTransaction.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { createdByUser: { select: { fullName: true } } },
    })
  }))

  // Payment recording (split payments for orders)
  ipcMain.handle('payments:create', protectedProcedure('manage_orders', async (ctx, data: {
    orderId: string; method: string; amount: string; currency?: string; note?: string
  }) => {
    try {
      // Verify order belongs to branch
      const order = await ctx.prisma.order.findFirst({
        where: { id: data.orderId, branchId: ctx.activeBranchId },
      })
      if (!order) return { success: false, error: 'Sipariş bulunamadı' }

      const payment = await ctx.prisma.payment.create({
        data: {
          orderId: data.orderId, branchId: ctx.activeBranchId,
          method: data.method as any, amount: data.amount,
          currency: data.currency ?? order.currency, note: data.note,
        },
      })
      return { success: true, data: payment }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
