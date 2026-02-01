/**
 * Cheque Service – Full Lifecycle Management
 *
 * Turkish market cheque/promissory note lifecycle:
 *   PORTFOLIO → DEPOSITED → COLLECTED
 *   PORTFOLIO → ENDORSED (ciro)
 *   PORTFOLIO → COLLATERAL (teminat)
 *   Any → BOUNCED (karşılıksız)
 *
 * Each transition creates automatic ledger entries via nazım hesap logic.
 */

import type { PrismaClient } from '@prisma/client'
import Decimal from 'decimal.js'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

type ChequeStatus = 'PORTFOLIO' | 'DEPOSITED' | 'ENDORSED' | 'COLLATERAL' | 'COLLECTED' | 'PAID' | 'BOUNCED' | 'CANCELLED'

// Valid status transitions
const VALID_TRANSITIONS: Record<string, ChequeStatus[]> = {
  PORTFOLIO:  ['DEPOSITED', 'ENDORSED', 'COLLATERAL', 'BOUNCED', 'CANCELLED'],
  DEPOSITED:  ['COLLECTED', 'BOUNCED', 'CANCELLED'],
  ENDORSED:   ['BOUNCED', 'CANCELLED'],
  COLLATERAL: ['PORTFOLIO', 'BOUNCED', 'CANCELLED'],
  COLLECTED:  [],
  PAID:       [],
  BOUNCED:    ['PORTFOLIO'], // can re-enter portfolio after bounce resolution
  CANCELLED:  [],
}

export class ChequeService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    chequeNo: string; type: string; direction: string;
    drawerId: string; branchId: string; bankName?: string; bankBranch?: string;
    amount: string; currency?: string; issueDate: string; dueDate: string; notes?: string
  }) {
    return this.prisma.cheque.create({
      data: {
        chequeNo: data.chequeNo,
        type: data.type as any,
        direction: data.direction as any,
        drawerId: data.drawerId,
        branchId: data.branchId,
        bankName: data.bankName,
        bankBranch: data.bankBranch,
        amount: new Decimal(data.amount),
        currency: data.currency ?? 'TRY',
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        notes: data.notes,
        history: {
          create: {
            fromStatus: 'PORTFOLIO',
            toStatus: 'PORTFOLIO',
            notes: 'Çek/Senet oluşturuldu',
            performedBy: 'system',
          },
        },
      },
      include: { drawer: true, history: true },
    })
  }

  async list(branchId: string, filters?: {
    status?: string; direction?: string; type?: string;
    dueDateFrom?: string; dueDateTo?: string
  }) {
    const where: any = { branchId, isCancelled: false }
    if (filters?.status) where.status = filters.status
    if (filters?.direction) where.direction = filters.direction
    if (filters?.type) where.type = filters.type
    if (filters?.dueDateFrom || filters?.dueDateTo) {
      where.dueDate = {}
      if (filters.dueDateFrom) where.dueDate.gte = new Date(filters.dueDateFrom)
      if (filters.dueDateTo) where.dueDate.lte = new Date(filters.dueDateTo)
    }

    return this.prisma.cheque.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: { drawer: { select: { name: true, code: true } }, payee: { select: { name: true, code: true } } },
    })
  }

  /**
   * Transition cheque to a new status with automatic ledger entries.
   */
  async transition(chequeId: string, toStatus: ChequeStatus, branchId: string, userId: string, opts?: {
    endorsedTo?: string; payeeId?: string; notes?: string
  }) {
    return this.prisma.$transaction(async (tx) => {
      const cheque = await tx.cheque.findUniqueOrThrow({
        where: { id: chequeId },
        include: { drawer: true },
      })

      const fromStatus = cheque.status as ChequeStatus
      const allowed = VALID_TRANSITIONS[fromStatus] ?? []
      if (!allowed.includes(toStatus)) {
        throw new Error(`Geçersiz statü geçişi: ${fromStatus} → ${toStatus}`)
      }

      const amount = new Decimal(String(cheque.amount))
      const updateData: any = { status: toStatus }

      // Status-specific updates
      if (toStatus === 'ENDORSED') {
        updateData.endorsedTo = opts?.endorsedTo ?? null
        if (opts?.payeeId) updateData.payeeId = opts.payeeId
      }
      if (toStatus === 'COLLECTED' || toStatus === 'PAID') {
        updateData.collectedAt = new Date()
      }
      if (toStatus === 'BOUNCED') {
        updateData.bouncedAt = new Date()
      }
      if (toStatus === 'CANCELLED') {
        updateData.isCancelled = true
      }

      const updated = await tx.cheque.update({
        where: { id: chequeId },
        data: updateData,
      })

      // Record history
      await tx.chequeHistory.create({
        data: {
          chequeId,
          fromStatus: fromStatus as any,
          toStatus: toStatus as any,
          notes: opts?.notes,
          performedBy: userId,
        },
      })

      // Create automatic ledger entries based on transition
      const ledgerType = this.getLedgerType(toStatus)
      if (ledgerType) {
        const isDebit = ['COLLECTED', 'BOUNCED'].includes(toStatus)
        await tx.ledgerEntry.create({
          data: {
            entryNo: `CHQ-${Date.now()}`,
            accountId: cheque.drawerId,
            branchId,
            type: ledgerType as any,
            debit: isDebit ? amount : new Decimal(0),
            credit: isDebit ? new Decimal(0) : amount,
            currency: cheque.currency,
            description: `Çek ${cheque.chequeNo} — ${fromStatus} → ${toStatus}`,
            referenceId: chequeId,
            referenceType: 'CHEQUE',
          },
        })

        // Update account balance
        const balanceChange = isDebit ? amount : amount.neg()
        await tx.account.update({
          where: { id: cheque.drawerId },
          data: { currentBalance: { increment: balanceChange } },
        })
      }

      return updated
    })
  }

  private getLedgerType(status: ChequeStatus): string | null {
    switch (status) {
      case 'COLLECTED': return 'CHEQUE_COLLECT'
      case 'ENDORSED': return 'CHEQUE_ENDORSE'
      case 'BOUNCED': return 'CHEQUE_BOUNCE'
      default: return null
    }
  }

  async getHistory(chequeId: string) {
    return this.prisma.chequeHistory.findMany({
      where: { chequeId },
      orderBy: { createdAt: 'asc' },
    })
  }
}
