/**
 * Finance Service – Period Locking, Aging & FX Revaluation
 * All methods accept branchId for branch scoping.
 */

import type { PrismaClient } from '@prisma/client'

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
        total: parseFloat(String(acc.currentBalance)).toFixed(2),
      }
    }

    for (const inv of invoices) {
      const accountId = inv.order?.accountId
      if (!accountId || !buckets[accountId]) continue
      const amount = parseFloat(String(inv.grandTotal))
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.createdAt)
      const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / 86400000)
      const b = buckets[accountId]
      if (daysDiff <= 0) b.notDue = (parseFloat(b.notDue) + amount).toFixed(2)
      else if (daysDiff <= 30) b.days1to30 = (parseFloat(b.days1to30) + amount).toFixed(2)
      else if (daysDiff <= 60) b.days31to60 = (parseFloat(b.days31to60) + amount).toFixed(2)
      else if (daysDiff <= 90) b.days61to90 = (parseFloat(b.days61to90) + amount).toFixed(2)
      else b.days90plus = (parseFloat(b.days90plus) + amount).toFixed(2)
    }
    return Object.values(buckets).filter(b => parseFloat(b.total) > 0)
  }

  async calculateFxRevaluation(currentRates: Record<string, number>, branchId?: string): Promise<FxRevaluationSummary> {
    const where: any = { isCancelled: false, status: { in: ['FINALIZED', 'SENT'] }, currency: { not: 'TRY' } }
    if (branchId) where.branchId = branchId

    const invoices = await this.db.invoice.findMany({
      where,
      include: { order: { select: { accountId: true, account: { select: { name: true } }, orderExchangeRate: true } } },
    })

    const items: FxRevaluationItem[] = []
    let totalGain = 0, totalLoss = 0

    for (const inv of invoices) {
      const currentRate = currentRates[inv.currency]
      if (!currentRate) continue
      const amount = parseFloat(String(inv.grandTotal))
      const bookingRate = parseFloat(String(inv.order?.orderExchangeRate ?? 1))
      const originalLocal = amount * bookingRate
      const currentLocal = amount * currentRate
      const diff = currentLocal - originalLocal
      if (diff > 0) totalGain += diff; else totalLoss += Math.abs(diff)
      items.push({
        invoiceId: inv.id, invoiceNo: inv.invoiceNo,
        accountName: inv.order?.account?.name ?? '', currency: inv.currency,
        originalAmount: amount.toFixed(2), bookingRate: bookingRate.toFixed(4),
        currentRate: currentRate.toFixed(4), originalValueLocal: originalLocal.toFixed(2),
        currentValueLocal: currentLocal.toFixed(2), unrealizedGainLoss: diff.toFixed(2),
        isGain: diff >= 0,
      })
    }

    return { items, totalGain: totalGain.toFixed(2), totalLoss: totalLoss.toFixed(2), netGainLoss: (totalGain - totalLoss).toFixed(2) }
  }

  async postFxRevaluation(items: FxRevaluationItem[], postedBy: string, branchId?: string) {
    return this.db.$transaction(async (tx: any) => {
      const entries = []
      for (const item of items) {
        const diff = parseFloat(item.unrealizedGainLoss)
        if (Math.abs(diff) < 0.01) continue
        const entryNo = `FXR-${Date.now().toString(36).toUpperCase()}-${entries.length}`
        const invoice = await tx.invoice.findUnique({
          where: { id: item.invoiceId }, select: { order: { select: { accountId: true } } },
        })
        if (!invoice?.order?.accountId) continue
        const entry = await tx.ledgerEntry.create({
          data: {
            entryNo, accountId: invoice.order.accountId,
            branchId: branchId!, type: 'FX_GAIN_LOSS',
            debit: item.isGain ? Math.abs(diff).toFixed(2) : '0',
            credit: item.isGain ? '0' : Math.abs(diff).toFixed(2),
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
