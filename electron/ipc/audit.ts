/**
 * Audit Log Helper
 *
 * Immutability principle: nothing is deleted, everything is logged.
 * Called from IPC handlers when critical entities change.
 */

import { getDb } from '../db'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'STATUS_CHANGE'
  | 'CANCEL'
  | 'REVERSAL'

export interface AuditEntry {
  entityType: string      // 'Order' | 'Account' | 'Shipment' | 'LedgerEntry'
  entityId: string
  action: AuditAction
  previousData?: any      // JSON snapshot before change
  newData?: any           // JSON snapshot after change
  userId?: string         // future: authenticated user
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
        userId: entry.userId ?? 'system',
        description: entry.description,
      },
    })
  } catch {
    // Audit logging must never crash the main operation
    console.error('[AuditLog] Failed to write:', entry.description)
  }
}
