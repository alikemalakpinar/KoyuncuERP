/**
 * SequenceService – Atomic Document Number Generation
 *
 * Generates branch-scoped, year-partitioned sequential document numbers.
 * Uses PostgreSQL UPSERT + atomic increment inside $transaction for safety.
 *
 * Format: {PREFIX}-{YEAR}-{SEQ:padded}
 * Example: ORD-2026-0001, INV-2026-00152
 */

import Decimal from 'decimal.js'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

export type DocType = 'ORDER' | 'INVOICE' | 'WAYBILL' | 'LEDGER' | 'COMMISSION' | 'RETURN' | 'PAYMENT' | 'ADJUSTMENT'

const PREFIX_MAP: Record<DocType, string> = {
  ORDER: 'ORD',
  INVOICE: 'INV',
  WAYBILL: 'WBL',
  LEDGER: 'LED',
  COMMISSION: 'COM',
  RETURN: 'RET',
  PAYMENT: 'PAY',
  ADJUSTMENT: 'ADJ',
}

const PAD_MAP: Record<DocType, number> = {
  ORDER: 4,
  INVOICE: 5,
  WAYBILL: 4,
  LEDGER: 5,
  COMMISSION: 5,
  RETURN: 4,
  PAYMENT: 5,
  ADJUSTMENT: 5,
}

/**
 * Atomically increment and return the next sequence value.
 * MUST be called inside a Prisma $transaction.
 *
 * @param tx - Prisma transaction client
 * @param branchId - Active branch
 * @param type - Document type (ORDER, INVOICE, etc.)
 * @returns Full document number like "ORD-2026-0001"
 */
export async function nextDocumentNo(
  tx: any,
  branchId: string,
  type: DocType,
): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = PREFIX_MAP[type]
  const pad = PAD_MAP[type]

  // Atomic upsert: insert if not exists, increment if exists
  const result = await tx.$queryRaw`
    INSERT INTO document_sequences (id, branch_id, type, prefix, year, current_val)
    VALUES (gen_random_uuid(), ${branchId}, ${type}, ${prefix}, ${year}, 1)
    ON CONFLICT (branch_id, type, year)
    DO UPDATE SET current_val = document_sequences.current_val + 1
    RETURNING current_val
  ` as { current_val: number }[]

  const seq = result[0].current_val
  return `${prefix}-${year}-${String(seq).padStart(pad, '0')}`
}

/**
 * Generate a custom-prefix document number (e.g. for FX reversals).
 */
export async function nextCustomNo(
  tx: any,
  branchId: string,
  type: DocType,
  customPrefix: string,
): Promise<string> {
  const year = new Date().getFullYear()
  const pad = PAD_MAP[type] ?? 5

  const result = await tx.$queryRaw`
    INSERT INTO document_sequences (id, branch_id, type, prefix, year, current_val)
    VALUES (gen_random_uuid(), ${branchId}, ${type + '_' + customPrefix}, ${customPrefix}, ${year}, 1)
    ON CONFLICT (branch_id, type, year)
    DO UPDATE SET current_val = document_sequences.current_val + 1
    RETURNING current_val
  ` as { current_val: number }[]

  const seq = result[0].current_val
  return `${customPrefix}-${year}-${String(seq).padStart(pad, '0')}`
}
