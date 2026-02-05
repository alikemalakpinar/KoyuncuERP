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
      include: {
        agency: {
          include: {
            parentAgency: { select: { id: true, account: { select: { name: true } } } },
            marketer: { select: { id: true, account: { select: { name: true } } } },
          }
        },
        marketer: true,
        referredByAgency: { include: { account: { select: { id: true, name: true, code: true } } } },
      },
    })
  }))

  ipcMain.handle('accounts:get', protectedProcedure('read', async (ctx, args: { id: string }) => {
    return ctx.prisma.account.findFirst({
      where: { id: args.id, branchId: ctx.activeBranchId },
      include: {
        agency: { include: { staff: true, commissionConfigs: true } },
        referredByAgency: { include: { account: { select: { id: true, name: true, code: true } } } },
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
    referredByAgencyId?: string
    // Agency specific
    agencyRegion?: string; defaultCommission?: string; parentAgencyId?: string; marketerId?: string
    // Marketer specific
    marketerDefaultRate?: string
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
          referredByAgencyId: data.referredByAgencyId,
        },
      })

      // Create Agency record if type is AGENCY
      if (data.type === 'AGENCY') {
        await ctx.prisma.agency.create({
          data: {
            accountId: account.id,
            region: data.agencyRegion,
            defaultCommission: data.defaultCommission ? parseFloat(data.defaultCommission) : 0,
            parentAgencyId: data.parentAgencyId || undefined,
            marketerId: data.marketerId || undefined,
          },
        })
      }

      // Create Marketer record if type is MARKETER
      if (data.type === 'MARKETER') {
        await ctx.prisma.marketer.create({
          data: {
            accountId: account.id,
            defaultRate: data.marketerDefaultRate ? parseFloat(data.marketerDefaultRate) : 0,
          },
        })
      }

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

  // ═══════════════════════════════════════════════════════════════════════════
  // AGENCY & STAFF ENDPOINTS (For NewOrderModal dropdowns)
  // ═══════════════════════════════════════════════════════════════════════════

  ipcMain.handle('accounts:listAgencies', protectedProcedure('read', async (ctx) => {
    const agencies = await ctx.prisma.agency.findMany({
      where: {
        account: { branchId: ctx.activeBranchId, isActive: true },
      },
      include: {
        account: { select: { id: true, code: true, name: true, city: true, country: true } },
        parentAgency: { include: { account: { select: { name: true } } } },
        marketer: { include: { account: { select: { name: true } } } },
      },
      orderBy: { account: { name: 'asc' } },
    })

    return agencies.map(ag => ({
      id: ag.id,
      accountId: ag.accountId,
      accountCode: ag.account.code,
      name: ag.account.name,
      region: ag.region,
      city: ag.account.city,
      country: ag.account.country,
      defaultCommission: ag.defaultCommission ? Number(ag.defaultCommission) : 0,
      parentAgency: ag.parentAgency?.account?.name || null,
      marketer: ag.marketer?.account?.name || null,
    }))
  }))

  ipcMain.handle('accounts:listAgencyStaff', protectedProcedure('read', async (ctx, args: { agencyId: string }) => {
    if (!args.agencyId) return []

    const staff = await ctx.prisma.agencyStaff.findMany({
      where: {
        agencyId: args.agencyId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })

    return staff.map(s => ({
      id: s.id,
      name: s.name,
      commissionRate: s.commissionRate ? Number(s.commissionRate) : 0,
      phone: s.phone,
      email: s.email,
    }))
  }))

  // ═══════════════════════════════════════════════════════════════════════════
  // PRICE LISTS ENDPOINT
  // ═══════════════════════════════════════════════════════════════════════════

  ipcMain.handle('pricing:listPriceLists', protectedProcedure('read', async (ctx) => {
    const priceLists = await ctx.prisma.priceList.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return priceLists.map(pl => ({
      id: pl.id,
      name: pl.name,
      currency: pl.currency,
      multiplier: 1, // Will be calculated from priceListItems in production
    }))
  }))

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS LIST (for admin/reporting)
  // ═══════════════════════════════════════════════════════════════════════════

  ipcMain.handle('auth:listUsers', protectedProcedure('read', async (ctx) => {
    const users = await ctx.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        branches: {
          select: {
            role: true,
            branch: { select: { code: true, name: true } },
          },
        },
      },
      orderBy: { fullName: 'asc' },
    })

    return users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      roles: u.branches.map(b => ({ branch: b.branch.code, role: b.role })),
    }))
  }))
}
