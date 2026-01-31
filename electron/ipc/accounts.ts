/**
 * Account IPC Handlers – Branch-Scoped & Protected
 */

import type { IpcMain } from 'electron'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'

export function registerAccountHandlers(ipcMain: IpcMain) {
  ipcMain.handle('accounts:list', protectedProcedure('read', async (ctx, filters?: {
    type?: string
    isActive?: boolean
    search?: string
  }) => {
    const where: any = { branchId: ctx.activeBranchId }
    if (filters?.type) where.type = filters.type
    if (filters?.isActive !== undefined) where.isActive = filters.isActive
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    return ctx.prisma.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { agency: true },
    })
  }))

  ipcMain.handle('accounts:get', protectedProcedure('read', async (ctx, args: { id: string }) => {
    return ctx.prisma.account.findFirst({
      where: { id: args.id, branchId: ctx.activeBranchId },
      include: {
        agency: { include: { staff: true, commissionConfigs: true } },
        childAccounts: true,
        ledgerEntries: {
          where: { isCancelled: false, branchId: ctx.activeBranchId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })
  }))

  ipcMain.handle('accounts:create', protectedProcedure('manage_accounts', async (ctx, data: {
    code: string; name: string; type: string; taxId?: string; phone?: string
    email?: string; address?: string; city?: string; country?: string
    currency?: string; riskLimit?: string; paymentTermDays?: number; parentAccountId?: string
  }) => {
    try {
      const account = await ctx.prisma.account.create({
        data: {
          code: data.code, name: data.name, type: data.type as any,
          branchId: ctx.activeBranchId,
          taxId: data.taxId, phone: data.phone, email: data.email,
          address: data.address, city: data.city,
          country: data.country ?? 'TR', currency: data.currency ?? 'USD',
          riskLimit: data.riskLimit ?? '0', paymentTermDays: data.paymentTermDays ?? 30,
          parentAccountId: data.parentAccountId,
        },
      })
      await writeAuditLog({
        entityType: 'Account', entityId: account.id, action: 'CREATE',
        newData: account, userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Yeni cari: ${data.code} – ${data.name}`,
      })
      return { success: true, data: account }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('accounts:update', protectedProcedure('manage_accounts', async (ctx, args: {
    id: string; data: Record<string, any>
  }) => {
    try {
      const existing = await ctx.prisma.account.findFirst({
        where: { id: args.id, branchId: ctx.activeBranchId },
      })
      if (!existing) return { success: false, error: 'Cari bulunamadı' }

      const { branchId: _, ...safeData } = args.data
      const updated = await ctx.prisma.account.update({ where: { id: args.id }, data: safeData })

      await writeAuditLog({
        entityType: 'Account', entityId: args.id, action: 'UPDATE',
        previousData: existing, newData: updated,
        userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Cari güncellendi: ${updated.code}`,
      })
      return { success: true, data: updated }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
