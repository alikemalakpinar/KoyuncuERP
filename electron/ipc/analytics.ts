/**
 * Analytics IPC Handlers – Branch-Scoped & Protected
 * All financial aggregations via Decimal.js for precision.
 */

import type { IpcMain } from 'electron'
import Decimal from 'decimal.js'
import { protectedProcedure } from './_secure'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

function sumDecimal(items: any[], key: string): string {
  return items.reduce(
    (acc: Decimal, item: any) => acc.plus(new Decimal(String(item[key] ?? 0))),
    new Decimal(0),
  ).toFixed(2)
}

export function registerAnalyticsHandlers(ipcMain: IpcMain) {
  // DASHBOARD KPIs
  ipcMain.handle('analytics:dashboardKpis', protectedProcedure('view_analytics', async (ctx) => {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Monthly revenue (from ledger debit entries of type INVOICE)
      const invoiceEntries = await ctx.prisma.ledgerEntry.findMany({
        where: {
          branchId: ctx.activeBranchId,
          type: 'INVOICE',
          isCancelled: false,
          createdAt: { gte: monthStart },
        },
        select: { debit: true },
      })
      const monthlyRevenue = sumDecimal(invoiceEntries, 'debit')

      // Monthly collections (from ledger credit entries of type PAYMENT/COLLECTION)
      const collectionEntries = await ctx.prisma.ledgerEntry.findMany({
        where: {
          branchId: ctx.activeBranchId,
          type: { in: ['PAYMENT', 'COLLECTION'] },
          isCancelled: false,
          createdAt: { gte: monthStart },
        },
        select: { credit: true },
      })
      const monthlyCollections = sumDecimal(collectionEntries, 'credit')

      // Collection rate
      const revenueDec = new Decimal(monthlyRevenue)
      const collectionRate = revenueDec.gt(0)
        ? new Decimal(monthlyCollections).div(revenueDec).mul(100).toFixed(1)
        : '0.0'

      // Pending shipments
      const pendingShipments = await ctx.prisma.order.count({
        where: {
          branchId: ctx.activeBranchId,
          status: { in: ['CONFIRMED', 'IN_PRODUCTION', 'READY'] },
          isCancelled: false,
        },
      })

      // Overdue invoices (past due date, not cancelled, with balance)
      const overdueInvoices = await ctx.prisma.invoice.findMany({
        where: {
          branchId: ctx.activeBranchId,
          isCancelled: false,
          dueDate: { lt: now },
          status: { in: ['FINALIZED', 'SENT'] },
        },
        select: { grandTotal: true },
      })
      const overdueAmount = sumDecimal(overdueInvoices, 'grandTotal')

      // Active orders count
      const activeOrders = await ctx.prisma.order.count({
        where: { branchId: ctx.activeBranchId, isCancelled: false, status: { not: 'DELIVERED' } },
      })

      // Cash balance
      const cashRegisters = await ctx.prisma.cashRegister.findMany({
        where: { branchId: ctx.activeBranchId },
        select: { currentBalance: true, name: true },
      })
      const totalCash = cashRegisters
        .reduce((sum: Decimal, r: any) => sum.plus(new Decimal(String(r.currentBalance))), new Decimal(0))
        .toFixed(2)

      // Critical stock (below min threshold)
      const criticalStock = await ctx.prisma.stock.count({
        where: {
          warehouse: { branch: { id: ctx.activeBranchId } },
          quantity: { lt: 10 }, // threshold
        },
      })

      return {
        monthlyRevenue: `$${Number(monthlyRevenue).toLocaleString()}`,
        revenueChange: '+0%',
        collectionRate: `%${collectionRate}`,
        collectionChange: '+0%',
        pendingShipments: String(pendingShipments),
        shipmentNote: `${activeOrders} aktif`,
        overdueAmount: `$${Number(overdueAmount).toLocaleString()}`,
        overdueChange: '0%',
        cashBalance: totalCash,
        criticalStockCount: criticalStock,
      }
    } catch (error) {
      console.error('[IPC] analytics:dashboardKpis error:', error)
      return null
    }
  }))

  // PROFIT ANALYSIS
  ipcMain.handle('analytics:profitAnalysis', protectedProcedure('view_profit', async (ctx) => {
    try {
      const orders = await ctx.prisma.order.findMany({
        where: { branchId: ctx.activeBranchId, isCancelled: false, status: 'DELIVERED' },
        include: { items: true, account: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      return orders.map((order: any) => {
        const revenue = new Decimal(String(order.grandTotal))
        const costs = order.items.reduce((sum: Decimal, item: any) => {
          const qty = new Decimal(String(item.quantity))
          const cost = new Decimal(String(item.purchasePrice ?? '0'))
          return sum.plus(qty.mul(cost))
        }, new Decimal(0))
        const profit = revenue.minus(costs)
        const margin = revenue.gt(0) ? profit.div(revenue).mul(100).toFixed(1) : '0.0'

        return {
          orderId: order.id,
          orderNo: order.orderNo,
          accountName: order.account?.name ?? '',
          date: order.createdAt,
          revenue: revenue.toFixed(2),
          costs: costs.toFixed(2),
          profit: profit.toFixed(2),
          margin,
          currency: order.currency,
        }
      })
    } catch (error) {
      console.error('[IPC] analytics:profitAnalysis error:', error)
      return []
    }
  }))

  // AGENCY PERFORMANCE
  ipcMain.handle('analytics:agencyPerformance', protectedProcedure('view_analytics', async (ctx) => {
    try {
      const commissions = await ctx.prisma.commissionRecord.findMany({
        where: { branchId: ctx.activeBranchId, isCancelled: false },
        include: {
          agency: { include: { account: { select: { name: true } } } },
          agencyStaff: { select: { name: true } },
          order: { select: { orderNo: true, grandTotal: true, currency: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return commissions.map((c: any) => ({
        id: c.id,
        agencyName: c.agency?.account?.name ?? '',
        staffName: c.agencyStaff?.name ?? '',
        orderNo: c.order?.orderNo ?? '',
        baseAmount: new Decimal(String(c.baseAmount)).toFixed(2),
        commissionRate: new Decimal(String(c.commissionRate)).toFixed(2),
        commissionAmount: new Decimal(String(c.commissionAmount)).toFixed(2),
        currency: c.order?.currency ?? 'USD',
        date: c.createdAt,
      }))
    } catch (error) {
      console.error('[IPC] analytics:agencyPerformance error:', error)
      return []
    }
  }))

  // ACCOUNT HEALTH
  ipcMain.handle('analytics:accountHealth', protectedProcedure('read', async (ctx, args: { accountId: string }) => {
    try {
      const account = await ctx.prisma.account.findFirst({
        where: { id: args.accountId, branchId: ctx.activeBranchId },
      })
      if (!account) return null

      const overdueInvoices = await ctx.prisma.invoice.findMany({
        where: {
          order: { accountId: args.accountId },
          branchId: ctx.activeBranchId,
          isCancelled: false,
          dueDate: { lt: new Date() },
          status: { in: ['FINALIZED', 'SENT'] },
        },
        select: { grandTotal: true },
      })
      const overdueTotal = sumDecimal(overdueInvoices, 'grandTotal')

      const orderCount = await ctx.prisma.order.count({
        where: { accountId: args.accountId, branchId: ctx.activeBranchId, isCancelled: false },
      })

      const balance = new Decimal(String(account.currentBalance))
      const riskLimit = new Decimal(String(account.riskLimit))
      const riskPct = riskLimit.gt(0)
        ? balance.div(riskLimit).mul(100).toFixed(1)
        : '0.0'

      return {
        balance: balance.toFixed(2),
        riskLimit: riskLimit.toFixed(2),
        riskPct,
        overdueTotal,
        overdueCount: overdueInvoices.length,
        orderCount,
        isRiskHigh: new Decimal(riskPct).gt(80),
      }
    } catch (error) {
      console.error('[IPC] analytics:accountHealth error:', error)
      return null
    }
  }))

  // ═══════════════════════════════════════════════════════════════════════════
  // RECENT ACTIVITY - For Dashboard Activity Feed
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle('analytics:recentActivity', protectedProcedure('read', async (ctx, args?: { limit?: number }) => {
    try {
      const limit = args?.limit || 10

      // Get recent audit logs
      const auditLogs = await ctx.prisma.auditLog.findMany({
        where: { branchId: ctx.activeBranchId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { fullName: true } },
        },
      })

      return auditLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        description: log.description,
        userName: log.user?.fullName || 'Sistem',
        createdAt: log.createdAt,
      }))
    } catch (error) {
      console.error('[IPC] analytics:recentActivity error:', error)
      return []
    }
  }))

  // ═══════════════════════════════════════════════════════════════════════════
  // TOP CUSTOMERS - For Dashboard
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle('analytics:topCustomers', protectedProcedure('view_analytics', async (ctx, args?: { limit?: number }) => {
    try {
      const limit = args?.limit || 5

      // Get customers with their order totals
      const customers = await ctx.prisma.account.findMany({
        where: {
          branchId: ctx.activeBranchId,
          type: 'CUSTOMER',
          isActive: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          currentBalance: true,
          orders: {
            where: { isCancelled: false },
            select: { grandTotal: true },
          },
        },
        take: 50,
      })

      // Calculate totals and sort
      const customersWithTotals = customers.map((c: any) => {
        const totalRevenue = c.orders.reduce(
          (sum: Decimal, order: any) => sum.plus(new Decimal(String(order.grandTotal))),
          new Decimal(0),
        )
        return {
          id: c.id,
          code: c.code,
          name: c.name,
          totalOrders: c.orders.length,
          totalRevenue: totalRevenue.toFixed(2),
          currentBalance: new Decimal(String(c.currentBalance)).toFixed(2),
        }
      })

      // Sort by revenue and take top N
      return customersWithTotals
        .sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue))
        .slice(0, limit)
    } catch (error) {
      console.error('[IPC] analytics:topCustomers error:', error)
      return []
    }
  }))

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER STATS BY STATUS - For Dashboard Charts
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle('analytics:orderStats', protectedProcedure('view_analytics', async (ctx) => {
    try {
      const statuses = ['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED']

      const stats = await Promise.all(
        statuses.map(async (status) => {
          const count = await ctx.prisma.order.count({
            where: {
              branchId: ctx.activeBranchId,
              status,
              isCancelled: false,
            },
          })

          const orders = await ctx.prisma.order.findMany({
            where: {
              branchId: ctx.activeBranchId,
              status,
              isCancelled: false,
            },
            select: { grandTotal: true },
          })

          const total = sumDecimal(orders, 'grandTotal')

          return { status, count, total }
        }),
      )

      return stats
    } catch (error) {
      console.error('[IPC] analytics:orderStats error:', error)
      return []
    }
  }))
}
