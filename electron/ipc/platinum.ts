/**
 * Platinum IPC Handlers – Inventory FIFO, Pricing, Finance
 * All branch-scoped and permission-protected.
 */

import type { IpcMain } from 'electron'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'
import { InventoryService } from '../services/inventory'
import { PricingService } from '../services/pricing'
import { FinanceService } from '../services/finance'

export function registerPlatinumHandlers(ipcMain: IpcMain) {
  // ═══ INVENTORY – FIFO Lot Management ═══

  ipcMain.handle('inventory:receiveLot', protectedProcedure('manage_inventory', async (ctx, data: {
    productId: string; variantId: string; warehouseId: string
    quantity: string; unitCost: string; batchNo?: string
  }) => {
    try {
      const svc = new InventoryService(ctx.prisma)
      const result = await svc.receiveLot({ ...data, branchId: ctx.activeBranchId })
      await writeAuditLog({
        entityType: 'InventoryLot', entityId: result.data?.id ?? '',
        action: 'CREATE', newData: data,
        userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Lot girişi: ${data.quantity} adet @ $${data.unitCost}`,
      })
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('inventory:allocate', protectedProcedure('manage_inventory', async (ctx, data: {
    variantId: string; warehouseId: string; quantity: string; orderId: string
  }) => {
    try {
      const svc = new InventoryService(ctx.prisma)
      return await svc.allocate(data)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('inventory:fulfill', protectedProcedure('manage_inventory', async (ctx, data: {
    variantId: string; warehouseId: string; quantity: string; orderId: string; orderNo: string
  }) => {
    try {
      const svc = new InventoryService(ctx.prisma)
      const result = await svc.fulfillFifo(data)
      if (result.success && result.data) {
        const entryNo = `COGS-${Date.now().toString(36).toUpperCase()}`
        await ctx.prisma.ledgerEntry.create({
          data: {
            entryNo, accountId: data.orderId, // will be resolved
            branchId: ctx.activeBranchId, type: 'ADJUSTMENT',
            debit: result.data.totalCogs, credit: '0',
            currency: 'USD', exchangeRate: '1', costCenter: 'COGS',
            description: `SMM kaydı – ${data.orderNo}: $${result.data.totalCogs}`,
            referenceId: data.orderId, referenceType: 'ORDER_COGS',
          },
        })
      }
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('inventory:lots', protectedProcedure('read', async (ctx, args: {
    variantId: string; warehouseId?: string
  }) => {
    try {
      const where: any = {
        variantId: args.variantId, branchId: ctx.activeBranchId,
        remainingQuantity: { gt: 0 },
      }
      if (args.warehouseId) where.warehouseId = args.warehouseId
      return ctx.prisma.inventoryLot.findMany({
        where, orderBy: { receivedDate: 'asc' }, include: { warehouse: true },
      })
    } catch { return [] }
  }))

  ipcMain.handle('inventory:transactions', protectedProcedure('read', async (ctx, args: {
    variantId: string; limit?: number
  }) => {
    try {
      return ctx.prisma.inventoryTransaction.findMany({
        where: { variantId: args.variantId, branchId: ctx.activeBranchId },
        orderBy: { createdAt: 'desc' }, take: args.limit ?? 50,
        include: { lot: true, warehouse: true },
      })
    } catch { return [] }
  }))

  // ═══ PRICING ═══

  ipcMain.handle('pricing:resolve', protectedProcedure('read', async (ctx, data: {
    accountId: string; variantId: string; quantity?: string
  }) => {
    try {
      const svc = new PricingService(ctx.prisma)
      return await svc.resolvePrice(data.accountId, data.variantId, data.quantity)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('pricing:resolveBatch', protectedProcedure('read', async (ctx, data: {
    accountId: string; variants: { variantId: string; quantity: string }[]
  }) => {
    try {
      const svc = new PricingService(ctx.prisma)
      return await svc.resolvePrices(data.accountId, data.variants)
    } catch { return [] }
  }))

  ipcMain.handle('pricing:lists', protectedProcedure('read', async (ctx) => {
    try {
      const svc = new PricingService(ctx.prisma)
      return await svc.listPriceLists()
    } catch { return [] }
  }))

  ipcMain.handle('pricing:createList', protectedProcedure('manage_settings', async (ctx, data: {
    name: string; currency: string; isDefault?: boolean
  }) => {
    try {
      const svc = new PricingService(ctx.prisma)
      const list = await svc.createPriceList(data)
      return { success: true, data: list }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('pricing:addItem', protectedProcedure('manage_settings', async (ctx, data: {
    priceListId: string; variantId: string; price: string; minQuantity?: string
  }) => {
    try {
      const svc = new PricingService(ctx.prisma)
      const item = await svc.addPriceListItem(data)
      return { success: true, data: item }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('pricing:assignToAccount', protectedProcedure('manage_accounts', async (ctx, args: {
    accountId: string; priceListId: string
  }) => {
    try {
      // Verify account belongs to branch
      const acc = await ctx.prisma.account.findFirst({
        where: { id: args.accountId, branchId: ctx.activeBranchId },
      })
      if (!acc) return { success: false, error: 'Cari bu şubeye ait değil.' }
      const svc = new PricingService(ctx.prisma)
      const result = await svc.assignPriceListToAccount(args.accountId, args.priceListId)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // ═══ FINANCE ═══

  ipcMain.handle('finance:lockPeriod', protectedProcedure('lock_period', async (ctx, data: {
    closingDate: string; notes?: string
  }) => {
    try {
      const svc = new FinanceService(ctx.prisma)
      const result = await svc.lockPeriod(
        new Date(data.closingDate), ctx.user.id, data.notes, ctx.activeBranchId,
      )
      if (result.success) {
        await writeAuditLog({
          entityType: 'PeriodLock', entityId: result.data?.id ?? '',
          action: 'CREATE', newData: data,
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Dönem kilitlendi: ${data.closingDate}`,
        })
      }
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  ipcMain.handle('finance:getLatestLock', protectedProcedure('read', async (ctx) => {
    try {
      const svc = new FinanceService(ctx.prisma)
      return await svc.getLatestLock(ctx.activeBranchId)
    } catch { return null }
  }))

  ipcMain.handle('finance:isDateLocked', protectedProcedure('read', async (ctx, args: { date: string }) => {
    try {
      const svc = new FinanceService(ctx.prisma)
      return await svc.isDateLocked(new Date(args.date), ctx.activeBranchId)
    } catch { return false }
  }))

  ipcMain.handle('finance:agingReport', protectedProcedure('view_analytics', async (ctx) => {
    try {
      const svc = new FinanceService(ctx.prisma)
      return await svc.generateAgingReport(ctx.activeBranchId)
    } catch { return [] }
  }))

  ipcMain.handle('finance:fxRevaluation', protectedProcedure('manage_ledger', async (ctx, args: {
    currentRates: Record<string, number>
  }) => {
    try {
      const svc = new FinanceService(ctx.prisma)
      return await svc.calculateFxRevaluation(args.currentRates, ctx.activeBranchId)
    } catch {
      return { items: [], totalGain: '0.00', totalLoss: '0.00', netGainLoss: '0.00' }
    }
  }))

  ipcMain.handle('finance:postFxRevaluation', protectedProcedure('manage_ledger', async (ctx, args: {
    items: any[]
  }) => {
    try {
      const svc = new FinanceService(ctx.prisma)
      return await svc.postFxRevaluation(args.items, ctx.user.id, ctx.activeBranchId)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
