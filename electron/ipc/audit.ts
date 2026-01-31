/**
 * Audit Log Helper – Server-Trustworthy
 *
 * Immutability principle: nothing is deleted, everything is logged.
 * Actor (userId, branchId) is ALWAYS derived from the validated session context.
 * Never accept actor info from the client.
 */

import { getDb } from '../db'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'STATUS_CHANGE'
  | 'CANCEL'
  | 'REVERSAL'

export interface AuditEntry {
  entityType: string
  entityId: string
  action: AuditAction
  previousData?: any
  newData?: any
  userId: string      // MUST come from session context
  branchId: string    // MUST come from session context
  description: string
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const db = getDb()
    await db.auditLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        previousData: entry.previousData ?? null,
        newData: entry.newData ?? null,
        userId: entry.userId,
        branchId: entry.branchId,
        description: entry.description,
      },
    })
  } catch {
    // Audit logging must never crash the main operation
    console.error('[AuditLog] Failed to write:', entry.description)
  }
}
