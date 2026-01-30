/**
 * Ledger & Payment IPC Handlers – Main Process
 *
 * Ledger-First: Every financial movement produces a ledger entry.
 * FX gain/loss is calculated automatically when collection currency
 * differs from original order currency/rate.
 */

import type { IpcMain } from 'electron'
import { getDb } from '../db'
import { writeAuditLog } from './audit'
import { calculateFxGainLoss, buildFxLedgerEntry } from '../../src/services/finance'

function generateEntryNo(): string {
  const ts = Date.now().toString(36).toUpperCase()
  return `LED-${ts}`
}

export function registerLedgerHandlers(ipcMain: IpcMain) {
  // ── List ledger entries ────────────────────────────────
  ipcMain.handle('ledger:list', async (_event, filters?: {
    accountId?: string
    type?: string
    costCenter?: string
    limit?: number
  }) => {
    try {
      const db = getDb()
      const where: any = { isCancelled: false }
      if (filters?.accountId) where.accountId = filters.accountId
      if (filters?.type) where.type = filters.type
      if (filters?.costCenter) where.costCenter = filters.costCenter

      return await db.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit ?? 100,
        include: {
          account: { select: { id: true, code: true, name: true } },
        },
      })
    } catch (error) {
      console.error('[IPC] ledger:list error:', error)
      return []
    }
  })

  // ── Record a collection (tahsilat) ─────────────────────
  ipcMain.handle('ledger:collection', async (_event, data: {
    accountId: string
    amount: string
    currency: string
    exchangeRate: string
    description: string
    referenceId?: string
  }) => {
    try {
      const db = getDb()

      const entry = await db.ledgerEntry.create({
        data: {
          entryNo: generateEntryNo(),
          accountId: data.accountId,
          type: 'COLLECTION',
          debit: '0',
          credit: data.amount,
          currency: data.currency,
          exchangeRate: data.exchangeRate,
          costCenter: 'COLLECTION',
          description: data.description,
          referenceId: data.referenceId,
          referenceType: data.referenceId ? 'ORDER' : null,
        },
      })

      // Check for FX gain/loss if there's a linked order
      if (data.referenceId) {
        const order = await db.order.findUnique({ where: { id: data.referenceId } })
        if (order && String(order.orderExchangeRate) !== data.exchangeRate) {
          const fxResult = calculateFxGainLoss({
            originalAmount: data.amount,
            originalRate: String(order.orderExchangeRate),
            currentRate: data.exchangeRate,
            currency: data.currency,
          })

          if (fxResult.gainOrLoss !== '0.00') {
            const fxLedger = buildFxLedgerEntry(
              data.accountId,
              fxResult.gainOrLoss,
              fxResult.isGain,
              data.currency,
              data.exchangeRate,
              entry.id,
            )

            await db.ledgerEntry.create({
              data: {
                entryNo: generateEntryNo(),
                ...fxLedger,
              },
            })
          }
        }
      }

      await writeAuditLog({
        entityType: 'LedgerEntry',
        entityId: entry.id,
        action: 'CREATE',
        newData: entry,
        description: `Tahsilat kaydı: ${data.amount} ${data.currency} – ${data.description}`,
      })

      return { success: true, data: entry }
    } catch (error: any) {
      console.error('[IPC] ledger:collection error:', error)
      return { success: false, error: error.message }
    }
  })

  // ── Record a payment (ödeme) ───────────────────────────
  ipcMain.handle('ledger:payment', async (_event, data: {
    accountId: string
    amount: string
    currency: string
    exchangeRate: string
    description: string
    referenceId?: string
  }) => {
    try {
      const db = getDb()

      const entry = await db.ledgerEntry.create({
        data: {
          entryNo: generateEntryNo(),
          accountId: data.accountId,
          type: 'PAYMENT',
          debit: data.amount,
          credit: '0',
          currency: data.currency,
          exchangeRate: data.exchangeRate,
          costCenter: 'PAYMENT',
          description: data.description,
          referenceId: data.referenceId,
          referenceType: data.referenceId ? 'ORDER' : null,
        },
      })

      await writeAuditLog({
        entityType: 'LedgerEntry',
        entityId: entry.id,
        action: 'CREATE',
        newData: entry,
        description: `Ödeme kaydı: ${data.amount} ${data.currency} – ${data.description}`,
      })

      return { success: true, data: entry }
    } catch (error: any) {
      console.error('[IPC] ledger:payment error:', error)
      return { success: false, error: error.message }
    }
  })

  // ── Create reversal entry (ters fiş) ───────────────────
  ipcMain.handle('ledger:reversal', async (_event, originalEntryId: string, reason: string) => {
    try {
      const db = getDb()
      const original = await db.ledgerEntry.findUnique({
        where: { id: originalEntryId },
      })

      if (!original) return { success: false, error: 'Kayıt bulunamadı' }
      if (original.isCancelled) return { success: false, error: 'Zaten iptal edilmiş' }

      // Reverse: swap debit/credit
      const reversal = await db.ledgerEntry.create({
        data: {
          entryNo: generateEntryNo(),
          accountId: original.accountId,
          type: 'REVERSAL',
          debit: String(original.credit),
          credit: String(original.debit),
          currency: original.currency,
          exchangeRate: String(original.exchangeRate),
          costCenter: `${original.costCenter}_REVERSAL`,
          description: `Ters Fiş – ${reason} (Orijinal: ${original.entryNo})`,
          referenceId: originalEntryId,
          referenceType: 'LEDGER_REVERSAL',
        },
      })

      await writeAuditLog({
        entityType: 'LedgerEntry',
        entityId: reversal.id,
        action: 'REVERSAL',
        previousData: original,
        newData: reversal,
        description: `Ters fiş oluşturuldu: ${original.entryNo} → ${reversal.entryNo}`,
      })

      return { success: true, data: reversal }
    } catch (error: any) {
      console.error('[IPC] ledger:reversal error:', error)
      return { success: false, error: error.message }
    }
  })
}
