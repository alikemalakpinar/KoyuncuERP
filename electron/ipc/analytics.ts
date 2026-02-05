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

  // RECENT ACTIVITY - Son aktiviteler (Dashboard için)
  ipcMain.handle('analytics:recentActivity', protectedProcedure('view_analytics', async (ctx) => {
    try {
      const activities: any[] = []

      // Son siparişler
      const recentOrders = await ctx.prisma.order.findMany({
        where: { branchId: ctx.activeBranchId, isCancelled: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { account: { select: { name: true } }, seller: { select: { fullName: true } } },
      })
      for (const order of recentOrders) {
        activities.push({
          id: `ord-${order.id}`,
          type: 'order',
          title: 'Yeni sipariş oluşturuldu',
          desc: `${order.orderNo} — ${order.account?.name ?? 'Müşteri'} ($${Number(order.grandTotal).toLocaleString()})`,
          time: order.createdAt,
          user: order.seller?.fullName ?? 'Sistem',
        })
      }

      // Son tahsilatlar
      const recentCollections = await ctx.prisma.ledgerEntry.findMany({
        where: { branchId: ctx.activeBranchId, type: { in: ['PAYMENT', 'COLLECTION'] }, isCancelled: false },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { account: { select: { name: true } } },
      })
      for (const entry of recentCollections) {
        activities.push({
          id: `col-${entry.id}`,
          type: 'collection',
          title: 'Tahsilat kaydedildi',
          desc: `${entry.account?.name ?? 'Hesap'} — $${Number(entry.credit).toLocaleString()}`,
          time: entry.createdAt,
          user: 'Muhasebe',
        })
      }

      // Son sevkiyatlar
      const recentShipments = await ctx.prisma.shipment.findMany({
        where: { branchId: ctx.activeBranchId, status: 'IN_TRANSIT' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { order: { select: { orderNo: true, account: { select: { name: true } } } } },
      })
      for (const shipment of recentShipments) {
        activities.push({
          id: `shp-${shipment.id}`,
          type: 'shipment',
          title: 'Sevkiyat yola çıktı',
          desc: `${shipment.shipmentNo} — ${shipment.order?.account?.name ?? 'Müşteri'}`,
          time: shipment.createdAt,
          user: 'Lojistik',
        })
      }

      // Son faturalar
      const recentInvoices = await ctx.prisma.invoice.findMany({
        where: { branchId: ctx.activeBranchId, isCancelled: false },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { order: { select: { account: { select: { name: true } } } } },
      })
      for (const invoice of recentInvoices) {
        activities.push({
          id: `inv-${invoice.id}`,
          type: 'invoice',
          title: 'Fatura kesildi',
          desc: `${invoice.invoiceNo} — ${invoice.order?.account?.name ?? 'Müşteri'} ($${Number(invoice.grandTotal).toLocaleString()})`,
          time: invoice.createdAt,
          user: 'Muhasebe',
        })
      }

      // Zamana göre sırala
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      return activities.slice(0, 10)
    } catch (error) {
      console.error('[IPC] analytics:recentActivity error:', error)
      return []
    }
  }))

  // TOP CUSTOMERS - En iyi müşteriler (Dashboard için)
  ipcMain.handle('analytics:topCustomers', protectedProcedure('view_analytics', async (ctx) => {
    try {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const customers = await ctx.prisma.account.findMany({
        where: { branchId: ctx.activeBranchId, type: 'CUSTOMER', isActive: true },
        include: {
          orders: {
            where: { isCancelled: false, createdAt: { gte: monthStart } },
            select: { grandTotal: true },
          },
          _count: {
            select: { orders: { where: { isCancelled: false, createdAt: { gte: monthStart } } } },
          },
        },
      })

      const ranked = customers
        .map((c) => {
          const totalRevenue = c.orders.reduce(
            (sum, o) => sum.plus(new Decimal(String(o.grandTotal))),
            new Decimal(0),
          )
          return {
            id: c.id,
            name: c.name,
            city: c.city ?? '',
            revenue: totalRevenue.toFixed(2),
            orders: c._count.orders,
          }
        })
        .filter((c) => Number(c.revenue) > 0)
        .sort((a, b) => Number(b.revenue) - Number(a.revenue))
        .slice(0, 5)

      return ranked
    } catch (error) {
      console.error('[IPC] analytics:topCustomers error:', error)
      return []
    }
  }))

  // ORDER STATS - Sipariş pipeline (Dashboard için)
  ipcMain.handle('analytics:orderStats', protectedProcedure('view_analytics', async (ctx) => {
    try {
      const statuses = ['QUOTE', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED']
      const result: { status: string; count: number; amount: string }[] = []

      for (const status of statuses) {
        const orders = await ctx.prisma.order.findMany({
          where: { branchId: ctx.activeBranchId, status, isCancelled: false },
          select: { grandTotal: true },
        })
        const total = sumDecimal(orders, 'grandTotal')
        result.push({
          status,
          count: orders.length,
          amount: total,
        })
      }

      return result
    } catch (error) {
      console.error('[IPC] analytics:orderStats error:', error)
      return []
    }
  }))

  // ALERTS - Kritik uyarılar (Dashboard için)
  ipcMain.handle('analytics:alerts', protectedProcedure('view_analytics', async (ctx) => {
    try {
      const alerts: any[] = []
      const now = new Date()

      // Vadesi 30+ gün geçmiş faturalar
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const overdueInvoices = await ctx.prisma.invoice.findMany({
        where: {
          branchId: ctx.activeBranchId,
          isCancelled: false,
          dueDate: { lt: thirtyDaysAgo },
          status: { in: ['FINALIZED', 'SENT'] },
        },
        include: { order: { select: { account: { select: { name: true } } } } },
        take: 3,
      })
      for (const inv of overdueInvoices) {
        alerts.push({
          id: `overdue-${inv.id}`,
          severity: 'critical',
          title: 'Vadesi 30+ gün geçmiş',
          desc: `${inv.order?.account?.name ?? 'Müşteri'} — $${Number(inv.grandTotal).toLocaleString()}`,
          action: 'Cariye Git',
          path: '/accounts',
        })
      }

      // Kritik stok seviyeleri
      const lowStock = await ctx.prisma.stock.findMany({
        where: {
          warehouse: { branch: { id: ctx.activeBranchId } },
          quantity: { lt: 10 },
        },
        include: { product: { select: { name: true } } },
        take: 3,
      })
      for (const stock of lowStock) {
        alerts.push({
          id: `stock-${stock.id}`,
          severity: 'warning',
          title: 'Kritik stok seviyesi',
          desc: `${stock.product?.name ?? 'Ürün'}: ${stock.quantity} adet`,
          action: 'Stok Detay',
          path: '/stock-analysis',
        })
      }

      return alerts.slice(0, 5)
    } catch (error) {
      console.error('[IPC] analytics:alerts error:', error)
      return []
    }
  }))

  // UPCOMING - Yaklaşan işler (Dashboard için)
  ipcMain.handle('analytics:upcoming', protectedProcedure('view_analytics', async (ctx) => {
    try {
      const upcoming: any[] = []
      const now = new Date()
      const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

      // Yaklaşan sevkiyat ETA'ları
      const shipments = await ctx.prisma.shipment.findMany({
        where: {
          branchId: ctx.activeBranchId,
          status: 'IN_TRANSIT',
          eta: { gte: now, lte: twoWeeksLater },
        },
        orderBy: { eta: 'asc' },
        take: 4,
        include: { order: { select: { account: { select: { city: true } } } } },
      })
      for (const shp of shipments) {
        const days = Math.ceil((new Date(shp.eta!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        upcoming.push({
          id: `shp-${shp.id}`,
          type: 'shipment',
          label: `${shp.shipmentNo} ETA`,
          detail: `${shp.order?.account?.city ?? 'Hedef'} — ${new Date(shp.eta!).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`,
          days,
        })
      }

      // Yaklaşan sipariş teslimleri
      const orders = await ctx.prisma.order.findMany({
        where: {
          branchId: ctx.activeBranchId,
          status: { in: ['READY', 'SHIPPED'] },
          isCancelled: false,
        },
        orderBy: { createdAt: 'asc' },
        take: 2,
        include: { account: { select: { name: true } } },
      })
      for (const ord of orders) {
        upcoming.push({
          id: `ord-${ord.id}`,
          type: 'order',
          label: `${ord.account?.name ?? 'Müşteri'} sipariş teslim`,
          detail: ord.orderNo,
          days: 5,
        })
      }

      return upcoming.sort((a, b) => a.days - b.days).slice(0, 4)
    } catch (error) {
      console.error('[IPC] analytics:upcoming error:', error)
      return []
    }
  }))
}
