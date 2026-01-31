/**
 * Analytics IPC Handlers – Branch-Scoped & Protected
 */

import type { IpcMain } from 'electron'
import { protectedProcedure } from './_secure'

export function registerAnalyticsHandlers(ipcMain: IpcMain) {
  ipcMain.handle('analytics:dashboardKpis', protectedProcedure('view_analytics', async (ctx) => {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const bi = ctx.activeBranchId

      const invoices = await ctx.prisma.ledgerEntry.findMany({
        where: { type: 'INVOICE', isCancelled: false, branchId: bi, createdAt: { gte: monthStart } },
      })
      const monthlyRevenue = invoices.reduce((sum: number, e: any) => sum + parseFloat(String(e.debit)), 0)

      const collections = await ctx.prisma.ledgerEntry.findMany({
        where: { type: 'COLLECTION', isCancelled: false, branchId: bi, createdAt: { gte: monthStart } },
      })
      const collectedAmount = collections.reduce((sum: number, e: any) => sum + parseFloat(String(e.credit)), 0)
      const collectionRate = monthlyRevenue > 0 ? ((collectedAmount / monthlyRevenue) * 100).toFixed(1) : '0'

      const pendingShipments = await ctx.prisma.order.findMany({
        where: { status: { in: ['READY', 'PARTIALLY_SHIPPED', 'SHIPPED'] }, isCancelled: false, branchId: bi },
      })

      const overdueAccounts = await ctx.prisma.account.findMany({
        where: { currentBalance: { gt: 0 }, isActive: true, branchId: bi },
      })
      const overdueTotal = overdueAccounts.reduce((sum: number, a: any) => sum + parseFloat(String(a.currentBalance)), 0)

      return {
        monthlyRevenue: monthlyRevenue.toFixed(2), collectionRate,
        pendingShipments: pendingShipments.length, overdueReceivables: overdueTotal.toFixed(2),
      }
    } catch (error) {
      return { monthlyRevenue: '0', collectionRate: '0', pendingShipments: 0, overdueReceivables: '0' }
    }
  }))

  ipcMain.handle('analytics:profitAnalysis', protectedProcedure('view_profit', async (ctx) => {
    try {
      const orders = await ctx.prisma.order.findMany({
        where: { isCancelled: false, branchId: ctx.activeBranchId },
        include: {
          account: { select: { name: true } }, items: true,
          landedCosts: { where: { isCancelled: false } },
        },
        orderBy: { createdAt: 'desc' }, take: 50,
      })

      return orders.map((order: any) => {
        const sellingPrice = parseFloat(String(order.grandTotal))
        const purchaseCost = order.items.reduce(
          (sum: number, item: any) => sum + parseFloat(String(item.purchasePrice)) * parseFloat(String(item.quantity)), 0)
        const costsByType: Record<string, number> = {}
        for (const cost of order.landedCosts) {
          costsByType[cost.costType] = (costsByType[cost.costType] || 0) + parseFloat(String(cost.amount))
        }
        const totalCost = purchaseCost + (costsByType['FREIGHT'] || 0) + (costsByType['CUSTOMS_TAX'] || 0) +
          (costsByType['WAREHOUSE'] || 0) + (costsByType['INSURANCE'] || 0) + (costsByType['AGENCY_FEE'] || 0) + (costsByType['OTHER'] || 0)
        const netProfit = sellingPrice - totalCost
        const netMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0

        return {
          orderId: order.id, orderNo: order.orderNo, customer: order.account.name,
          status: order.status, sellingPrice: sellingPrice.toFixed(2),
          purchaseCost: purchaseCost.toFixed(2), freight: (costsByType['FREIGHT'] || 0).toFixed(2),
          customs: (costsByType['CUSTOMS_TAX'] || 0).toFixed(2), warehouse: (costsByType['WAREHOUSE'] || 0).toFixed(2),
          insurance: (costsByType['INSURANCE'] || 0).toFixed(2), agencyFee: (costsByType['AGENCY_FEE'] || 0).toFixed(2),
          totalCost: totalCost.toFixed(2), netProfit: netProfit.toFixed(2), netMargin: netMargin.toFixed(1),
        }
      })
    } catch { return [] }
  }))

  ipcMain.handle('analytics:agencyPerformance', protectedProcedure('view_analytics', async (ctx) => {
    try {
      const records = await ctx.prisma.commissionRecord.findMany({
        where: { isCancelled: false, branchId: ctx.activeBranchId },
        include: {
          agency: { include: { account: { select: { name: true } } } },
          order: { select: { grandTotal: true } },
        },
      })

      const byAgency = new Map<string, any>()
      for (const rec of records) {
        const existing = byAgency.get(rec.agencyId) || {
          name: rec.agency.account.name, region: rec.agency.region || '',
          totalSales: 0, commission: 0, pendingCommission: 0, orderCount: 0,
          commissionRate: parseFloat(String(rec.commissionRate)),
        }
        existing.totalSales += parseFloat(String(rec.baseAmount))
        existing.commission += parseFloat(String(rec.commissionAmount))
        if (rec.status === 'PENDING') existing.pendingCommission += parseFloat(String(rec.commissionAmount))
        existing.orderCount++
        byAgency.set(rec.agencyId, existing)
      }

      return Array.from(byAgency.entries()).map(([id, d]) => ({
        id, ...d, totalSales: d.totalSales.toFixed(2), commission: d.commission.toFixed(2),
        pendingCommission: d.pendingCommission.toFixed(2), commissionRate: d.commissionRate.toFixed(1),
      }))
    } catch { return [] }
  }))

  ipcMain.handle('analytics:accountHealth', protectedProcedure('read', async (ctx, args: { accountId: string }) => {
    try {
      const now = new Date()
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

      // Verify account belongs to branch
      const account = await ctx.prisma.account.findFirst({
        where: { id: args.accountId, branchId: ctx.activeBranchId },
      })
      if (!account) return null

      const entries = await ctx.prisma.ledgerEntry.findMany({
        where: { accountId: args.accountId, branchId: ctx.activeBranchId, type: 'INVOICE', isCancelled: false, createdAt: { gte: yearAgo } },
        orderBy: { createdAt: 'asc' },
      })

      const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
      const monthlyRevenue = months.map((month, idx) => {
        const amount = entries.filter((e: any) => new Date(e.createdAt).getMonth() === idx)
          .reduce((sum: number, e: any) => sum + parseFloat(String(e.debit)), 0)
        return { month, amount: amount.toFixed(2) }
      })

      const totalRevenue = entries.reduce((sum: number, e: any) => sum + parseFloat(String(e.debit)), 0)
      const balance = parseFloat(String(account.currentBalance))
      const riskLimit = parseFloat(String(account.riskLimit))
      const balanceRatio = riskLimit > 0 ? balance / riskLimit : 0
      const riskScore = Math.max(0, Math.min(100, Math.round((1 - balanceRatio) * 100)))

      return {
        accountId: args.accountId, totalRevenue12m: totalRevenue.toFixed(2),
        avgPaymentDays: account.paymentTermDays ?? 30,
        overdueAmount: balance > 0 ? balance.toFixed(2) : '0',
        riskScore, monthlyRevenue,
      }
    } catch { return null }
  }))
}
