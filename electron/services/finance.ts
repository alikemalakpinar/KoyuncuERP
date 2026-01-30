/**
 * Finance Service – Period Locking & FX Revaluation
 *
 * Handles:
 * - Period closing (lock date enforcement)
 * - Aging report generation
 * - FX revaluation for open foreign-currency invoices
 */

import type { DbClient } from '../db'

// ── Types ──────────────────────────────────────────────────

export interface AgingBucket {
  accountId: string
  accountName: string
  accountCode: string
  notDue: string
  days1to30: string
  days31to60: string
  days61to90: string
  days90plus: string
  total: string
}

export interface FxRevaluationItem {
  invoiceId: string
  invoiceNo: string
  accountName: string
  currency: string
  originalAmount: string
  bookingRate: string
  currentRate: string
  originalValueLocal: string
  currentValueLocal: string
  unrealizedGainLoss: string
  isGain: boolean
}

export interface FxRevaluationSummary {
  items: FxRevaluationItem[]
  totalGain: string
  totalLoss: string
  netGainLoss: string
}

// ── Service ────────────────────────────────────────────────

export class FinanceService {
  constructor(private db: DbClient) {}

  // ── Period Locking ───────────────────────────────────────

  /**
   * Lock a financial period. After locking, no ledger/inventory
   * transactions can be created or modified for dates <= closingDate.
   */
  async lockPeriod(closingDate: Date, lockedBy: string, notes?: string) {
    // Validate: can't lock a date in the future
    if (closingDate > new Date()) {
      return { success: false, error: 'Gelecek tarih kilitlenemez' }
    }

    // Check if already locked for a later date
    const existing = await this.db.periodLock.findMany({
      orderBy: { closingDate: 'desc' },
      take: 1,
    })

    if (existing.length > 0) {
      const lastLock = existing[0]
      if (new Date(lastLock.closingDate) >= closingDate) {
        return {
          success: false,
          error: `Zaten ${new Date(lastLock.closingDate).toLocaleDateString('tr-TR')} tarihine kadar kilitli`,
        }
      }
    }

    const lock = await this.db.periodLock.create({
      data: {
        closingDate,
        lockedBy,
        notes,
      },
    })

    return { success: true, data: lock }
  }

  /**
   * Get the current lock date (latest).
   */
  async getLatestLock() {
    const locks = await this.db.periodLock.findMany({
      orderBy: { closingDate: 'desc' },
      take: 1,
    })
    return locks[0] || null
  }

  /**
   * Check if a date is within a locked period.
   */
  async isDateLocked(date: Date): Promise<boolean> {
    const latest = await this.getLatestLock()
    if (!latest) return false
    return date <= new Date(latest.closingDate)
  }

  // ── Aging Report ─────────────────────────────────────────

  /**
   * Generate receivables aging report.
   * Groups outstanding balances by account into time buckets.
   */
  async generateAgingReport(): Promise<AgingBucket[]> {
    const now = new Date()

    // Get all accounts with positive balance (receivables)
    const accounts = await this.db.account.findMany({
      where: {
        isActive: true,
        currentBalance: { gt: 0 },
      },
      select: { id: true, code: true, name: true, currentBalance: true },
    })

    // Get all unpaid invoices
    const invoices = await this.db.invoice.findMany({
      where: {
        isCancelled: false,
        status: { in: ['FINALIZED', 'SENT'] },
      },
      select: {
        id: true,
        order: { select: { accountId: true } },
        grandTotal: true,
        dueDate: true,
        createdAt: true,
      },
    })

    // Build aging buckets per account
    const buckets: Record<string, AgingBucket> = {}

    for (const acc of accounts) {
      buckets[acc.id] = {
        accountId: acc.id,
        accountName: acc.name,
        accountCode: acc.code,
        notDue: '0.00',
        days1to30: '0.00',
        days31to60: '0.00',
        days61to90: '0.00',
        days90plus: '0.00',
        total: parseFloat(String(acc.currentBalance)).toFixed(2),
      }
    }

    for (const inv of invoices) {
      const accountId = inv.order?.accountId
      if (!accountId || !buckets[accountId]) continue

      const amount = parseFloat(String(inv.grandTotal))
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.createdAt)
      const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / 86400000)

      const bucket = buckets[accountId]
      if (daysDiff <= 0) {
        bucket.notDue = (parseFloat(bucket.notDue) + amount).toFixed(2)
      } else if (daysDiff <= 30) {
        bucket.days1to30 = (parseFloat(bucket.days1to30) + amount).toFixed(2)
      } else if (daysDiff <= 60) {
        bucket.days31to60 = (parseFloat(bucket.days31to60) + amount).toFixed(2)
      } else if (daysDiff <= 90) {
        bucket.days61to90 = (parseFloat(bucket.days61to90) + amount).toFixed(2)
      } else {
        bucket.days90plus = (parseFloat(bucket.days90plus) + amount).toFixed(2)
      }
    }

    return Object.values(buckets).filter(b => parseFloat(b.total) > 0)
  }

  // ── FX Revaluation ──────────────────────────────────────

  /**
   * Identify open foreign-currency invoices and calculate
   * unrealized FX gain/loss vs current rate.
   */
  async calculateFxRevaluation(currentRates: Record<string, number>): Promise<FxRevaluationSummary> {
    // Get open invoices (not fully paid, not cancelled)
    const invoices = await this.db.invoice.findMany({
      where: {
        isCancelled: false,
        status: { in: ['FINALIZED', 'SENT'] },
        currency: { not: 'TRY' },
      },
      include: {
        order: {
          select: {
            accountId: true,
            account: { select: { name: true } },
            orderExchangeRate: true,
          },
        },
      },
    })

    const items: FxRevaluationItem[] = []
    let totalGain = 0
    let totalLoss = 0

    for (const inv of invoices) {
      const currency = inv.currency
      const currentRate = currentRates[currency]
      if (!currentRate) continue

      const amount = parseFloat(String(inv.grandTotal))
      const bookingRate = parseFloat(String(inv.order?.orderExchangeRate ?? 1))

      const originalLocal = amount * bookingRate
      const currentLocal = amount * currentRate
      const diff = currentLocal - originalLocal
      const isGain = diff >= 0

      if (diff > 0) totalGain += diff
      else totalLoss += Math.abs(diff)

      items.push({
        invoiceId: inv.id,
        invoiceNo: inv.invoiceNo,
        accountName: inv.order?.account?.name ?? '',
        currency,
        originalAmount: amount.toFixed(2),
        bookingRate: bookingRate.toFixed(4),
        currentRate: currentRate.toFixed(4),
        originalValueLocal: originalLocal.toFixed(2),
        currentValueLocal: currentLocal.toFixed(2),
        unrealizedGainLoss: diff.toFixed(2),
        isGain,
      })
    }

    return {
      items,
      totalGain: totalGain.toFixed(2),
      totalLoss: totalLoss.toFixed(2),
      netGainLoss: (totalGain - totalLoss).toFixed(2),
    }
  }

  /**
   * Post FX revaluation entries to the ledger.
   */
  async postFxRevaluation(
    items: FxRevaluationItem[],
    postedBy: string,
  ) {
    return this.db.$transaction(async (tx: any) => {
      const entries = []
      for (const item of items) {
        const diff = parseFloat(item.unrealizedGainLoss)
        if (Math.abs(diff) < 0.01) continue

        const entryNo = `FXR-${Date.now().toString(36).toUpperCase()}-${entries.length}`

        // Find account for this invoice
        const invoice = await tx.invoice.findUnique({
          where: { id: item.invoiceId },
          select: { order: { select: { accountId: true } } },
        })

        if (!invoice?.order?.accountId) continue

        const entry = await tx.ledgerEntry.create({
          data: {
            entryNo,
            accountId: invoice.order.accountId,
            type: 'FX_GAIN_LOSS',
            debit: item.isGain ? Math.abs(diff).toFixed(2) : '0',
            credit: item.isGain ? '0' : Math.abs(diff).toFixed(2),
            currency: item.currency,
            exchangeRate: item.currentRate,
            costCenter: 'FX_REVALUATION',
            description: `Kur farkı değerleme: ${item.invoiceNo} (${item.bookingRate} → ${item.currentRate})`,
            referenceId: item.invoiceId,
            referenceType: 'INVOICE',
            invoiceId: item.invoiceId,
          },
        })
        entries.push(entry)
      }

      await tx.auditLog.create({
        data: {
          entityType: 'FxRevaluation',
          entityId: 'batch',
          action: 'CREATE',
          newData: { count: entries.length, postedBy },
          userId: postedBy,
          description: `Kur farkı değerleme: ${entries.length} kayıt oluşturuldu`,
        },
      })

      return { success: true, data: { entriesCreated: entries.length } }
    })
  }
}
