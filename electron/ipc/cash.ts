/**
 * Cash Register IPC Handlers – Branch-Scoped & Protected
 * All math via Decimal.js, all writes in $transaction.
 * Zod validation on all inputs.
 */

import type { IpcMain } from 'electron'
import Decimal from 'decimal.js'
import { z } from 'zod'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// ─── Validation ─────────────────────────────────────────────
const createTransactionSchema = z.object({
  cashRegisterId: z.string().min(1, 'Kasa seçilmedi'),
  type: z.enum(['IN', 'OUT']),
  amount: z.string().refine(v => { try { return new Decimal(v).gt(0) } catch { return false } }, 'Tutar pozitif olmalı'),
  reason: z.string().min(1, 'Açıklama gerekli'),
})

const closeRegisterSchema = z.object({
  registerId: z.string().min(1),
  actualCash: z.string().refine(v => { try { return new Decimal(v).gte(0) } catch { return false } }, 'Sayım tutarı negatif olamaz'),
  notes: z.string().optional(),
})

// ─── Handlers ───────────────────────────────────────────────
export function registerCashHandlers(ipcMain: IpcMain) {
  // LIST REGISTERS
  ipcMain.handle('cash:registers', protectedProcedure('read', async (ctx) => {
    try {
      return await ctx.prisma.cashRegister.findMany({
        where: { branchId: ctx.activeBranchId },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      console.error('[IPC] cash:registers error:', error)
      return []
    }
  }))

  // LIST TRANSACTIONS
  ipcMain.handle('cash:transactions', protectedProcedure('read', async (ctx, filters?: {
    cashRegisterId?: string; dateFrom?: string; dateTo?: string
  }) => {
    try {
      const where: any = { branchId: ctx.activeBranchId }
      if (filters?.cashRegisterId) where.cashRegisterId = filters.cashRegisterId
      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {}
        if (filters?.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
        if (filters?.dateTo) where.createdAt.lte = new Date(filters.dateTo)
      }

      return await ctx.prisma.cashTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { cashRegister: { select: { name: true } } },
      })
    } catch (error) {
      console.error('[IPC] cash:transactions error:', error)
      return []
    }
  }))

  // CREATE TRANSACTION — $transaction + Decimal.js
  ipcMain.handle('cash:transact', protectedProcedure('manage_cash_register', async (ctx, rawData: any) => {
    const parsed = createTransactionSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, error: `Geçersiz giriş: ${parsed.error.errors.map(e => e.message).join(', ')}` }
    }
    const data = parsed.data

    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        const register = await tx.cashRegister.findFirst({
          where: { id: data.cashRegisterId, branchId: ctx.activeBranchId },
        })
        if (!register) return { success: false, error: 'Kasa bulunamadı.' }
        if (!register.isOpen) return { success: false, error: 'Kasa kapalı. İşlem yapabilmek için kasayı açın.' }

        const amount = new Decimal(data.amount)
        const currentBalance = new Decimal(String(register.currentBalance))

        if (data.type === 'OUT' && amount.gt(currentBalance)) {
          return { success: false, error: `Yetersiz bakiye. Kasa: ${currentBalance.toFixed(2)}, Çıkış: ${amount.toFixed(2)}` }
        }

        const newBalance = data.type === 'IN'
          ? currentBalance.plus(amount)
          : currentBalance.minus(amount)

        await tx.cashRegister.update({
          where: { id: data.cashRegisterId },
          data: { currentBalance: newBalance.toFixed(2) },
        })

        const txn = await tx.cashTransaction.create({
          data: {
            cashRegisterId: data.cashRegisterId,
            branchId: ctx.activeBranchId,
            type: data.type,
            amount: amount.toFixed(2),
            reason: data.reason,
            createdByUserId: ctx.user.id,
          },
        })

        await writeAuditLog({
          entityType: 'CashTransaction', entityId: txn.id, action: 'CREATE',
          newData: { type: data.type, amount: amount.toFixed(2), cashRegisterId: data.cashRegisterId },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Kasa ${data.type === 'IN' ? 'giriş' : 'çıkış'}: ${amount.toFixed(2)} ${register.name}`,
        })

        return { success: true, data: txn }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // CLOSE REGISTER (Z-Report) — $transaction + Decimal.js
  ipcMain.handle('cash:close', protectedProcedure('manage_cash_register', async (ctx, rawData: any) => {
    const parsed = closeRegisterSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, error: `Geçersiz giriş: ${parsed.error.errors.map(e => e.message).join(', ')}` }
    }
    const data = parsed.data

    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        const register = await tx.cashRegister.findFirst({
          where: { id: data.registerId, branchId: ctx.activeBranchId },
        })
        if (!register) return { success: false, error: 'Kasa bulunamadı.' }
        if (!register.isOpen) return { success: false, error: 'Kasa zaten kapalı.' }

        const expected = new Decimal(String(register.currentBalance))
        const actual = new Decimal(data.actualCash)
        const variance = actual.minus(expected)

        await tx.cashRegister.update({
          where: { id: data.registerId },
          data: { isOpen: false, currentBalance: actual.toFixed(2), lastClosedAt: new Date() },
        })

        if (!variance.isZero()) {
          await tx.cashTransaction.create({
            data: {
              cashRegisterId: data.registerId,
              branchId: ctx.activeBranchId,
              type: variance.gt(0) ? 'IN' : 'OUT',
              amount: variance.abs().toFixed(2),
              reason: `Z-Rapor sayım farkı: Beklenen ${expected.toFixed(2)}, Sayılan ${actual.toFixed(2)}`,
              createdByUserId: ctx.user.id,
            },
          })
        }

        await writeAuditLog({
          entityType: 'CashRegister', entityId: data.registerId, action: 'CLOSE',
          newData: { expected: expected.toFixed(2), actual: actual.toFixed(2), variance: variance.toFixed(2) },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Kasa kapatıldı: ${register.name} (Fark: ${variance.toFixed(2)})`,
        })

        return { success: true, data: { expected: expected.toFixed(2), actual: actual.toFixed(2), variance: variance.toFixed(2) } }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // OPEN REGISTER
  ipcMain.handle('cash:open', protectedProcedure('manage_cash_register', async (ctx, args: { registerId: string }) => {
    try {
      const register = await ctx.prisma.cashRegister.findFirst({
        where: { id: args.registerId, branchId: ctx.activeBranchId },
      })
      if (!register) return { success: false, error: 'Kasa bulunamadı.' }
      if (register.isOpen) return { success: false, error: 'Kasa zaten açık.' }

      await ctx.prisma.cashRegister.update({
        where: { id: args.registerId },
        data: { isOpen: true, openingBalance: register.currentBalance, lastOpenedAt: new Date() },
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
