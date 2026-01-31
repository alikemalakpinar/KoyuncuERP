/**
 * Ledger & Payment IPC Handlers – Branch-Scoped & Protected
 */

import type { IpcMain } from 'electron'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'
import { calculateFxGainLoss, buildFxLedgerEntry } from '../../src/services/finance'

function generateEntryNo(): string {
  const ts = Date.now().toString(36).toUpperCase()
  return `LED-${ts}`
}

export function registerLedgerHandlers(ipcMain: IpcMain) {
  ipcMain.handle('ledger:list', protectedProcedure('read', async (ctx, filters?: {
    accountId?: string; type?: string; costCenter?: string; limit?: number
  }) => {
    try {
      const where: any = { isCancelled: false, branchId: ctx.activeBranchId }
      if (filters?.accountId) where.accountId = filters.accountId
      if (filters?.type) where.type = filters.type
      if (filters?.costCenter) where.costCenter = filters.costCenter

      return await ctx.prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit ?? 100,
        include: { account: { select: { id: true, code: true, name: true } } },
      })
    } catch (error) {
      console.error('[IPC] ledger:list error:', error)
      return []
    }
  }))

  ipcMain.handle('ledger:collection', protectedProcedure('manage_ledger', async (ctx, data: {
    accountId: string; amount: string; currency: string; exchangeRate: string
    description: string; referenceId?: string
  }) => {
    try {
      // Verify account belongs to branch
      const acc = await ctx.prisma.account.findFirst({
        where: { id: data.accountId, branchId: ctx.activeBranchId },
      })
      if (!acc) return { success: false, error: 'Cari bu şubeye ait değil.' }

      const entry = await ctx.prisma.ledgerEntry.create({
        data: {
          entryNo: generateEntryNo(), accountId: data.accountId,
          branchId: ctx.activeBranchId, type: 'COLLECTION',
          debit: '0', credit: data.amount,
          currency: data.currency, exchangeRate: data.exchangeRate,
          costCenter: 'COLLECTION', description: data.description,
          referenceId: data.referenceId, referenceType: data.referenceId ? 'ORDER' : null,
        },
      })

      // FX gain/loss
      if (data.referenceId) {
        const order = await ctx.prisma.order.findFirst({
          where: { id: data.referenceId, branchId: ctx.activeBranchId },
        })
        if (order && String(order.orderExchangeRate) !== data.exchangeRate) {
          const fxResult = calculateFxGainLoss({
            originalAmount: data.amount,
            originalRate: String(order.orderExchangeRate),
            currentRate: data.exchangeRate,
            currency: data.currency,
          })
          if (fxResult.gainOrLoss !== '0.00') {
            const fxLedger = buildFxLedgerEntry(
              data.accountId, fxResult.gainOrLoss, fxResult.isGain,
              data.currency, data.exchangeRate, entry.id,
            )
            await ctx.prisma.ledgerEntry.create({
              data: { entryNo: generateEntryNo(), branchId: ctx.activeBranchId, ...fxLedger },
            })
          }
        }
      }

      await writeAuditLog({
        entityType: 'LedgerEntry', entityId: entry.id, action: 'CREATE',
        newData: entry, userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Tahsilat: ${data.amount} ${data.currency}`,
      })
      return { success: true, data: entry }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('ledger:payment', protectedProcedure('manage_ledger', async (ctx, data: {
    accountId: string; amount: string; currency: string; exchangeRate: string
    description: string; referenceId?: string
  }) => {
    try {
      const acc = await ctx.prisma.account.findFirst({
        where: { id: data.accountId, branchId: ctx.activeBranchId },
      })
      if (!acc) return { success: false, error: 'Cari bu şubeye ait değil.' }

      const entry = await ctx.prisma.ledgerEntry.create({
        data: {
          entryNo: generateEntryNo(), accountId: data.accountId,
          branchId: ctx.activeBranchId, type: 'PAYMENT',
          debit: data.amount, credit: '0',
          currency: data.currency, exchangeRate: data.exchangeRate,
          costCenter: 'PAYMENT', description: data.description,
          referenceId: data.referenceId, referenceType: data.referenceId ? 'ORDER' : null,
        },
      })

      await writeAuditLog({
        entityType: 'LedgerEntry', entityId: entry.id, action: 'CREATE',
        newData: entry, userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Ödeme: ${data.amount} ${data.currency}`,
      })
      return { success: true, data: entry }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('ledger:reversal', protectedProcedure('manage_ledger', async (ctx, args: {
    originalEntryId: string; reason: string
  }) => {
    try {
      const original = await ctx.prisma.ledgerEntry.findFirst({
        where: { id: args.originalEntryId, branchId: ctx.activeBranchId },
      })
      if (!original) return { success: false, error: 'Kayıt bulunamadı' }
      if (original.isCancelled) return { success: false, error: 'Zaten iptal edilmiş' }

      const reversal = await ctx.prisma.ledgerEntry.create({
        data: {
          entryNo: generateEntryNo(), accountId: original.accountId,
          branchId: ctx.activeBranchId, type: 'REVERSAL',
          debit: String(original.credit), credit: String(original.debit),
          currency: original.currency, exchangeRate: String(original.exchangeRate),
          costCenter: `${original.costCenter}_REVERSAL`,
          description: `Ters Fiş – ${args.reason} (Orijinal: ${original.entryNo})`,
          referenceId: args.originalEntryId, referenceType: 'LEDGER_REVERSAL',
        },
      })

      await writeAuditLog({
        entityType: 'LedgerEntry', entityId: reversal.id, action: 'REVERSAL',
        previousData: original, newData: reversal,
        userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Ters fiş: ${original.entryNo} → ${reversal.entryNo}`,
      })
      return { success: true, data: reversal }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
