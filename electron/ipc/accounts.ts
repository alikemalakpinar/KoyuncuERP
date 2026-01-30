/**
 * Account IPC Handlers – Main Process
 *
 * All Prisma calls for Account (Cari) entity.
 * Renderer accesses via: window.api.accounts.*
 */

import type { IpcMain } from 'electron'
import { getDb } from '../db'
import { writeAuditLog } from './audit'

export function registerAccountHandlers(ipcMain: IpcMain) {
  // ── List all accounts ──────────────────────────────────
  ipcMain.handle('accounts:list', async (_event, filters?: {
    type?: string
    isActive?: boolean
    search?: string
  }) => {
    try {
      const db = getDb()
      const where: any = {}

      if (filters?.type) where.type = filters.type
      if (filters?.isActive !== undefined) where.isActive = filters.isActive
      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
        ]
      }

      return await db.account.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { agency: true },
      })
    } catch (error) {
      console.error('[IPC] accounts:list error:', error)
      return []
    }
  })

  // ── Get single account ─────────────────────────────────
  ipcMain.handle('accounts:get', async (_event, id: string) => {
    try {
      const db = getDb()
      return await db.account.findUnique({
        where: { id },
        include: {
          agency: { include: { staff: true, commissionConfigs: true } },
          childAccounts: true,
          ledgerEntries: {
            where: { isCancelled: false },
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      })
    } catch (error) {
      console.error('[IPC] accounts:get error:', error)
      return null
    }
  })

  // ── Create account ─────────────────────────────────────
  ipcMain.handle('accounts:create', async (_event, data: {
    code: string
    name: string
    type: string
    taxId?: string
    phone?: string
    email?: string
    address?: string
    city?: string
    country?: string
    currency?: string
    riskLimit?: string
    paymentTermDays?: number
    parentAccountId?: string
  }) => {
    try {
      const db = getDb()
      const account = await db.account.create({
        data: {
          code: data.code,
          name: data.name,
          type: data.type as any,
          taxId: data.taxId,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          country: data.country ?? 'TR',
          currency: data.currency ?? 'USD',
          riskLimit: data.riskLimit ?? '0',
          paymentTermDays: data.paymentTermDays ?? 30,
          parentAccountId: data.parentAccountId,
        },
      })

      await writeAuditLog({
        entityType: 'Account',
        entityId: account.id,
        action: 'CREATE',
        newData: account,
        description: `Yeni cari oluşturuldu: ${data.code} – ${data.name}`,
      })

      return { success: true, data: account }
    } catch (error: any) {
      console.error('[IPC] accounts:create error:', error)
      return { success: false, error: error.message }
    }
  })

  // ── Update account ─────────────────────────────────────
  ipcMain.handle('accounts:update', async (_event, id: string, data: Record<string, any>) => {
    try {
      const db = getDb()
      const previous = await db.account.findUnique({ where: { id } })

      const updated = await db.account.update({
        where: { id },
        data,
      })

      await writeAuditLog({
        entityType: 'Account',
        entityId: id,
        action: 'UPDATE',
        previousData: previous,
        newData: updated,
        description: `Cari güncellendi: ${updated.code}`,
      })

      return { success: true, data: updated }
    } catch (error: any) {
      console.error('[IPC] accounts:update error:', error)
      return { success: false, error: error.message }
    }
  })
}
