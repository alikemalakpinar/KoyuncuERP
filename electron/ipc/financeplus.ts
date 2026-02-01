/**
 * Finance++ IPC Handlers
 *
 * - Chart of Accounts (Hesap Planı) — hierarchical tree
 * - Cheque lifecycle management (Çek/Senet)
 * - Cost Centers (Maliyet Merkezleri) — hierarchical tree
 */

import type { IpcMain } from 'electron'
import { protectedProcedure } from './_secure'
import { ChequeService } from '../services/cheque'
import { getDb } from '../db'

export function registerFinancePlusHandlers(ipcMain: IpcMain) {
  const db = () => getDb()

  // ══ Chart of Accounts ═══════════════════════════════════════

  ipcMain.handle('coa:list', protectedProcedure('read', async (ctx) => {
    return ctx.prisma.accountPlan.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    })
  }))

  ipcMain.handle('coa:create', protectedProcedure('manage_ledger', async (ctx, data: {
    code: string; name: string; parentId?: string; accountType: string; currency?: string; isPostable?: boolean
  }) => {
    // Auto-calculate level from parent
    let level = 0
    if (data.parentId) {
      const parent = await ctx.prisma.accountPlan.findUnique({ where: { id: data.parentId } })
      if (parent) level = parent.level + 1
    }

    return ctx.prisma.accountPlan.create({
      data: {
        code: data.code,
        name: data.name,
        parentId: data.parentId,
        level,
        accountType: data.accountType as any,
        currency: data.currency,
        isPostable: data.isPostable ?? (level >= 2),
      },
    })
  }))

  ipcMain.handle('coa:update', protectedProcedure('manage_ledger', async (ctx, args: {
    id: string; data: { name?: string; isActive?: boolean; isPostable?: boolean }
  }) => {
    return ctx.prisma.accountPlan.update({
      where: { id: args.id },
      data: args.data,
    })
  }))

  ipcMain.handle('coa:tree', protectedProcedure('read', async (ctx) => {
    const all = await ctx.prisma.accountPlan.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    })

    // Build tree structure
    const map = new Map<string, any>()
    const roots: any[] = []
    all.forEach(a => map.set(a.id, { ...a, children: [] }))
    all.forEach(a => {
      const node = map.get(a.id)!
      if (a.parentId && map.has(a.parentId)) {
        map.get(a.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    })
    return roots
  }))

  // ══ Cheques ════════════════════════════════════════════════

  ipcMain.handle('cheques:list', protectedProcedure('read', async (ctx, filters?: any) => {
    const svc = new ChequeService(db())
    return svc.list(ctx.activeBranchId, filters)
  }))

  ipcMain.handle('cheques:create', protectedProcedure('manage_ledger', async (ctx, data: any) => {
    const svc = new ChequeService(db())
    return svc.create({ ...data, branchId: ctx.activeBranchId })
  }))

  ipcMain.handle('cheques:transition', protectedProcedure('manage_ledger', async (ctx, args: {
    chequeId: string; toStatus: string; endorsedTo?: string; payeeId?: string; notes?: string
  }) => {
    const svc = new ChequeService(db())
    return svc.transition(
      args.chequeId,
      args.toStatus as any,
      ctx.activeBranchId,
      ctx.user.id,
      { endorsedTo: args.endorsedTo, payeeId: args.payeeId, notes: args.notes },
    )
  }))

  ipcMain.handle('cheques:history', protectedProcedure('read', async (_ctx, args: { chequeId: string }) => {
    const svc = new ChequeService(db())
    return svc.getHistory(args.chequeId)
  }))

  // ══ Cost Centers ══════════════════════════════════════════

  ipcMain.handle('costCenters:list', protectedProcedure('read', async (ctx) => {
    return ctx.prisma.costCenter.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    })
  }))

  ipcMain.handle('costCenters:create', protectedProcedure('manage_ledger', async (ctx, data: {
    code: string; name: string; parentId?: string
  }) => {
    let level = 0
    if (data.parentId) {
      const parent = await ctx.prisma.costCenter.findUnique({ where: { id: data.parentId } })
      if (parent) level = parent.level + 1
    }

    return ctx.prisma.costCenter.create({
      data: { code: data.code, name: data.name, parentId: data.parentId, level },
    })
  }))

  ipcMain.handle('costCenters:tree', protectedProcedure('read', async (ctx) => {
    const all = await ctx.prisma.costCenter.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    })

    const map = new Map<string, any>()
    const roots: any[] = []
    all.forEach(a => map.set(a.id, { ...a, children: [] }))
    all.forEach(a => {
      const node = map.get(a.id)!
      if (a.parentId && map.has(a.parentId)) {
        map.get(a.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    })
    return roots
  }))

  ipcMain.handle('costCenters:update', protectedProcedure('manage_ledger', async (ctx, args: {
    id: string; data: { name?: string; isActive?: boolean }
  }) => {
    return ctx.prisma.costCenter.update({
      where: { id: args.id },
      data: args.data,
    })
  }))
}
