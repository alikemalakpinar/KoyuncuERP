/**
 * Finance Service – Period Locking, Aging & FX Revaluation
 * All methods accept branchId for branch scoping.
 * All financial math via Decimal.js for precision.
 */

import Decimal from 'decimal.js'
import type { PrismaClient } from '@prisma/client'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

export interface AgingBucket {
  accountId: string; accountName: string; accountCode: string
  notDue: string; days1to30: string; days31to60: string; days61to90: string; days90plus: string; total: string
}

export interface FxRevaluationItem {
  invoiceId: string; invoiceNo: string; accountName: string; currency: string
  originalAmount: string; bookingRate: string; currentRate: string
  originalValueLocal: string; currentValueLocal: string; unrealizedGainLoss: string; isGain: boolean
}

export interface FxRevaluationSummary {
  items: FxRevaluationItem[]; totalGain: string; totalLoss: string; netGainLoss: string
}

export class FinanceService {
  constructor(private db: PrismaClient) {}

  async lockPeriod(closingDate: Date, lockedBy: string, notes?: string, branchId?: string) {
    if (closingDate > new Date()) return { success: false, error: 'Gelecek tarih kilitlenemez' }

    const where: any = branchId ? { branchId } : {}
    const existing = await this.db.periodLock.findMany({
      where, orderBy: { closingDate: 'desc' }, take: 1,
    })
    if (existing.length > 0 && new Date(existing[0].closingDate) >= closingDate) {
      return { success: false, error: `Zaten ${new Date(existing[0].closingDate).toLocaleDateString('tr-TR')} tarihine kadar kilitli` }
    }

    const lock = await this.db.periodLock.create({
      data: { closingDate, lockedBy, notes, branchId: branchId! },
    })
    return { success: true, data: lock }
  }

  async getLatestLock(branchId?: string) {
    const where: any = branchId ? { branchId } : {}
    const locks = await this.db.periodLock.findMany({
      where, orderBy: { closingDate: 'desc' }, take: 1,
    })
    return locks[0] || null
  }

  async isDateLocked(date: Date, branchId?: string): Promise<boolean> {
    const latest = await this.getLatestLock(branchId)
    if (!latest) return false
    return date <= new Date(latest.closingDate)
  }

  async generateAgingReport(branchId?: string): Promise<AgingBucket[]> {
    const now = new Date()
    const accWhere: any = { isActive: true, currentBalance: { gt: 0 } }
    if (branchId) accWhere.branchId = branchId

    const accounts = await this.db.account.findMany({
      where: accWhere,
      select: { id: true, code: true, name: true, currentBalance: true },
    })

    const invWhere: any = { isCancelled: false, status: { in: ['FINALIZED', 'SENT'] } }
    if (branchId) invWhere.branchId = branchId

    const invoices = await this.db.invoice.findMany({
      where: invWhere,
      select: { id: true, order: { select: { accountId: true } }, grandTotal: true, dueDate: true, createdAt: true },
    })

    const buckets: Record<string, AgingBucket> = {}
    for (const acc of accounts) {
      buckets[acc.id] = {
        accountId: acc.id, accountName: acc.name, accountCode: acc.code,
        notDue: '0.00', days1to30: '0.00', days31to60: '0.00',
        days61to90: '0.00', days90plus: '0.00',
        total: new Decimal(String(acc.currentBalance)).toFixed(2),
      }
    }

    for (const inv of invoices) {
      const accountId = inv.order?.accountId
      if (!accountId || !buckets[accountId]) continue
      const amount = new Decimal(String(inv.grandTotal))
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.createdAt)
      const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / 86400000)
      const b = buckets[accountId]
      if (daysDiff <= 0) b.notDue = new Decimal(b.notDue).plus(amount).toFixed(2)
      else if (daysDiff <= 30) b.days1to30 = new Decimal(b.days1to30).plus(amount).toFixed(2)
      else if (daysDiff <= 60) b.days31to60 = new Decimal(b.days31to60).plus(amount).toFixed(2)
      else if (daysDiff <= 90) b.days61to90 = new Decimal(b.days61to90).plus(amount).toFixed(2)
      else b.days90plus = new Decimal(b.days90plus).plus(amount).toFixed(2)
    }
    return Object.values(buckets).filter(b => new Decimal(b.total).gt(0))
  }

  async calculateFxRevaluation(currentRates: Record<string, number>, branchId?: string): Promise<FxRevaluationSummary> {
    const where: any = { isCancelled: false, status: { in: ['FINALIZED', 'SENT'] }, currency: { not: 'TRY' } }
    if (branchId) where.branchId = branchId

    const invoices = await this.db.invoice.findMany({
      where,
      include: { order: { select: { accountId: true, account: { select: { name: true } }, orderExchangeRate: true } } },
    })

    const items: FxRevaluationItem[] = []
    let totalGain = new Decimal(0)
    let totalLoss = new Decimal(0)

    for (const inv of invoices) {
      const currentRate = currentRates[inv.currency]
      if (!currentRate) continue
      const amount = new Decimal(String(inv.grandTotal))
      const bookingRate = new Decimal(String(inv.order?.orderExchangeRate ?? 1))
      const currentRateDec = new Decimal(currentRate)
      const originalLocal = amount.mul(bookingRate)
      const currentLocal = amount.mul(currentRateDec)
      const diff = currentLocal.minus(originalLocal)
      if (diff.gt(0)) totalGain = totalGain.plus(diff)
      else totalLoss = totalLoss.plus(diff.abs())
      items.push({
        invoiceId: inv.id, invoiceNo: inv.invoiceNo,
        accountName: inv.order?.account?.name ?? '', currency: inv.currency,
        originalAmount: amount.toFixed(2), bookingRate: bookingRate.toFixed(4),
        currentRate: currentRateDec.toFixed(4), originalValueLocal: originalLocal.toFixed(2),
        currentValueLocal: currentLocal.toFixed(2), unrealizedGainLoss: diff.toFixed(2),
        isGain: diff.gte(0),
      })
    }

    return {
      items,
      totalGain: totalGain.toFixed(2),
      totalLoss: totalLoss.toFixed(2),
      netGainLoss: totalGain.minus(totalLoss).toFixed(2),
    }
  }

  async postFxRevaluation(items: FxRevaluationItem[], postedBy: string, branchId?: string) {
    return this.db.$transaction(async (tx: any) => {
      const entries = []
      for (const item of items) {
        const diff = new Decimal(item.unrealizedGainLoss)
        if (diff.abs().lt(new Decimal('0.01'))) continue
        const entryNo: string = `FXR-${Date.now().toString(36).toUpperCase()}-${entries.length}`
        const invoice = await tx.invoice.findUnique({
          where: { id: item.invoiceId }, select: { order: { select: { accountId: true } } },
        })
        if (!invoice?.order?.accountId) continue
        const entry: any = await tx.ledgerEntry.create({
          data: {
            entryNo, accountId: invoice.order.accountId,
            branchId: branchId!, type: 'FX_GAIN_LOSS',
            debit: diff.gt(0) ? diff.abs().toFixed(2) : '0',
            credit: diff.gt(0) ? '0' : diff.abs().toFixed(2),
            currency: item.currency, exchangeRate: item.currentRate,
            costCenter: 'FX_REVALUATION',
            description: `Kur farkı: ${item.invoiceNo} (${item.bookingRate} → ${item.currentRate})`,
            referenceId: item.invoiceId, referenceType: 'INVOICE',
            invoiceId: item.invoiceId,
          },
        })
        entries.push(entry)
      }
      await tx.auditLog.create({
        data: {
          entityType: 'FxRevaluation', entityId: 'batch', action: 'CREATE',
          newData: { count: entries.length, postedBy },
          userId: postedBy, branchId: branchId!,
          description: `Kur farkı değerleme: ${entries.length} kayıt`,
        },
      })
      return { success: true, data: { entriesCreated: entries.length } }
    })
  }
}
