/**
 * Ledger & Payment IPC Handlers – Branch-Scoped & Protected
 * All math via Decimal.js, Zod validation, $transaction for writes.
 */

import type { IpcMain } from 'electron'
import Decimal from 'decimal.js'
import { z } from 'zod'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'
import { nextDocumentNo } from '../services/sequence'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// ─── Validation ─────────────────────────────────────────────
const collectionSchema = z.object({
  accountId: z.string().min(1, 'Cari seçilmedi'),
  amount: z.string().refine(v => { try { return new Decimal(v).gt(0) } catch { return false } }, 'Tutar pozitif olmalı'),
  currency: z.string().min(1),
  exchangeRate: z.string().refine(v => { try { return new Decimal(v).gt(0) } catch { return false } }, 'Kur pozitif olmalı'),
  method: z.string().optional(),
  description: z.string().optional(),
})

const paymentSchema = z.object({
  accountId: z.string().min(1, 'Cari seçilmedi'),
  amount: z.string().refine(v => { try { return new Decimal(v).gt(0) } catch { return false } }, 'Tutar pozitif olmalı'),
  currency: z.string().min(1),
  exchangeRate: z.string().refine(v => { try { return new Decimal(v).gt(0) } catch { return false } }, 'Kur pozitif olmalı'),
  method: z.string().optional(),
  description: z.string().optional(),
})

const manualEntrySchema = z.object({
  accountId: z.string().min(1, 'Cari seçilmedi'),
  type: z.enum(['ADJUSTMENT', 'FX_GAIN_LOSS']),
  debit: z.string().refine(v => { try { return new Decimal(v).gte(0) } catch { return false } }, 'Borç negatif olamaz'),
  credit: z.string().refine(v => { try { return new Decimal(v).gte(0) } catch { return false } }, 'Alacak negatif olamaz'),
  currency: z.string().min(1),
  exchangeRate: z.string().default('1'),
  description: z.string().min(1, 'Açıklama gerekli'),
})

// ─── Handlers ───────────────────────────────────────────────
export function registerLedgerHandlers(ipcMain: IpcMain) {
  // LIST ENTRIES
  ipcMain.handle('ledger:list', protectedProcedure('read', async (ctx, filters?: {
    accountId?: string; type?: string; dateFrom?: string; dateTo?: string
  }) => {
    try {
      const where: any = { branchId: ctx.activeBranchId, isCancelled: false }
      if (filters?.accountId) where.accountId = filters.accountId
      if (filters?.type) where.type = filters.type
      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {}
        if (filters?.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
        if (filters?.dateTo) where.createdAt.lte = new Date(filters.dateTo)
      }

      return await ctx.prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { account: { select: { id: true, code: true, name: true } } },
      })
    } catch (error) {
      console.error('[IPC] ledger:list error:', error)
      return []
    }
  }))

  // ACCOUNT STATEMENT (with opening balance)
  ipcMain.handle('ledger:statement', protectedProcedure('read', async (ctx, args: {
    accountId: string; dateFrom?: string; dateTo?: string
  }) => {
    try {
      const account = await ctx.prisma.account.findFirst({
        where: { id: args.accountId, branchId: ctx.activeBranchId },
        select: { id: true, code: true, name: true, currentBalance: true },
      })
      if (!account) return { error: 'Cari bulunamadı' }

      // Calculate opening balance (sum of all entries BEFORE dateFrom)
      let openingBalance = new Decimal(0)
      if (args.dateFrom) {
        const priorEntries = await ctx.prisma.ledgerEntry.findMany({
          where: {
            accountId: args.accountId, branchId: ctx.activeBranchId,
            isCancelled: false, createdAt: { lt: new Date(args.dateFrom) },
          },
          select: { debit: true, credit: true },
        })
        for (const e of priorEntries) {
          openingBalance = openingBalance
            .plus(new Decimal(String(e.debit)))
            .minus(new Decimal(String(e.credit)))
        }
      }

      // Get entries in range
      const dateWhere: any = {}
      if (args.dateFrom) dateWhere.gte = new Date(args.dateFrom)
      if (args.dateTo) dateWhere.lte = new Date(args.dateTo)

      const entries = await ctx.prisma.ledgerEntry.findMany({
        where: {
          accountId: args.accountId, branchId: ctx.activeBranchId,
          isCancelled: false,
          ...(Object.keys(dateWhere).length > 0 ? { createdAt: dateWhere } : {}),
        },
        orderBy: { createdAt: 'asc' },
      })

      // Build running balance
      let runningBalance = openingBalance
      const statement = entries.map((e: any) => {
        const debit = new Decimal(String(e.debit))
        const credit = new Decimal(String(e.credit))
        runningBalance = runningBalance.plus(debit).minus(credit)
        return {
          ...e,
          debit: debit.toFixed(2),
          credit: credit.toFixed(2),
          balance: runningBalance.toFixed(2),
        }
      })

      return {
        account,
        openingBalance: openingBalance.toFixed(2),
        closingBalance: runningBalance.toFixed(2),
        totalDebit: entries.reduce((sum: Decimal, e: any) => sum.plus(new Decimal(String(e.debit))), new Decimal(0)).toFixed(2),
        totalCredit: entries.reduce((sum: Decimal, e: any) => sum.plus(new Decimal(String(e.credit))), new Decimal(0)).toFixed(2),
        entries: statement,
      }
    } catch (error) {
      console.error('[IPC] ledger:statement error:', error)
      return { error: 'Ekstre oluşturulamadı' }
    }
  }))

  // COLLECTION (Tahsilat) — $transaction + Decimal.js
  ipcMain.handle('ledger:collection', protectedProcedure('manage_ledger', async (ctx, rawData: any) => {
    const parsed = collectionSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, error: `Geçersiz giriş: ${parsed.error.errors.map(e => e.message).join(', ')}` }
    }
    const data = parsed.data

    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        const account = await tx.account.findFirst({
          where: { id: data.accountId, branchId: ctx.activeBranchId },
        })
        if (!account) return { success: false, error: 'Cari bulunamadı.' }

        const amount = new Decimal(data.amount)
        const entryNo = await nextDocumentNo(tx, ctx.activeBranchId, 'PAYMENT')

        await tx.ledgerEntry.create({
          data: {
            entryNo, accountId: data.accountId,
            branchId: ctx.activeBranchId, type: 'COLLECTION',
            debit: '0', credit: amount.toFixed(2),
            currency: data.currency,
            exchangeRate: data.exchangeRate,
            costCenter: 'COLLECTION',
            description: data.description || `Tahsilat: ${account.name}`,
          },
        })

        // Decrease account balance (customer paid)
        await tx.account.update({
          where: { id: data.accountId },
          data: { currentBalance: { decrement: amount.toNumber() } },
        })

        await writeAuditLog({
          entityType: 'LedgerEntry', entityId: entryNo, action: 'CREATE',
          newData: { type: 'COLLECTION', amount: amount.toFixed(2), accountId: data.accountId },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Tahsilat: ${amount.toFixed(2)} ${data.currency} — ${account.name}`,
        })

        return { success: true }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // PAYMENT (Ödeme/Tediye) — $transaction + Decimal.js
  ipcMain.handle('ledger:payment', protectedProcedure('manage_ledger', async (ctx, rawData: any) => {
    const parsed = paymentSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, error: `Geçersiz giriş: ${parsed.error.errors.map(e => e.message).join(', ')}` }
    }
    const data = parsed.data

    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        const account = await tx.account.findFirst({
          where: { id: data.accountId, branchId: ctx.activeBranchId },
        })
        if (!account) return { success: false, error: 'Cari bulunamadı.' }

        const amount = new Decimal(data.amount)
        const entryNo = await nextDocumentNo(tx, ctx.activeBranchId, 'PAYMENT')

        await tx.ledgerEntry.create({
          data: {
            entryNo, accountId: data.accountId,
            branchId: ctx.activeBranchId, type: 'PAYMENT',
            debit: amount.toFixed(2), credit: '0',
            currency: data.currency,
            exchangeRate: data.exchangeRate,
            costCenter: 'PAYMENT',
            description: data.description || `Ödeme: ${account.name}`,
          },
        })

        // Increase account balance (we paid supplier, they owe less / we owe more)
        await tx.account.update({
          where: { id: data.accountId },
          data: { currentBalance: { increment: amount.toNumber() } },
        })

        await writeAuditLog({
          entityType: 'LedgerEntry', entityId: entryNo, action: 'CREATE',
          newData: { type: 'PAYMENT', amount: amount.toFixed(2), accountId: data.accountId },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Ödeme: ${amount.toFixed(2)} ${data.currency} — ${account.name}`,
        })

        return { success: true }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // MANUAL ENTRY (Düzeltme Fişi) — $transaction
  ipcMain.handle('ledger:manual', protectedProcedure('post_manual_ledger', async (ctx, rawData: any) => {
    const parsed = manualEntrySchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, error: `Geçersiz giriş: ${parsed.error.errors.map(e => e.message).join(', ')}` }
    }
    const data = parsed.data

    const debit = new Decimal(data.debit)
    const credit = new Decimal(data.credit)
    if (debit.isZero() && credit.isZero()) {
      return { success: false, error: 'Borç veya alacak tutarı giriniz.' }
    }

    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        const entryNo = await nextDocumentNo(tx, ctx.activeBranchId, 'LEDGER')

        await tx.ledgerEntry.create({
          data: {
            entryNo, accountId: data.accountId,
            branchId: ctx.activeBranchId, type: data.type,
            debit: debit.toFixed(2), credit: credit.toFixed(2),
            currency: data.currency, exchangeRate: data.exchangeRate,
            costCenter: 'MANUAL',
            description: data.description,
          },
        })

        // Update balance: debit increases, credit decreases
        const balanceChange = debit.minus(credit)
        if (!balanceChange.isZero()) {
          if (balanceChange.gt(0)) {
            await tx.account.update({
              where: { id: data.accountId },
              data: { currentBalance: { increment: balanceChange.toNumber() } },
            })
          } else {
            await tx.account.update({
              where: { id: data.accountId },
              data: { currentBalance: { decrement: balanceChange.abs().toNumber() } },
            })
          }
        }

        await writeAuditLog({
          entityType: 'LedgerEntry', entityId: entryNo, action: 'CREATE',
          newData: { type: data.type, debit: debit.toFixed(2), credit: credit.toFixed(2) },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Manuel kayıt: ${data.description}`,
        })

        return { success: true }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
