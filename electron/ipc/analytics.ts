/**
 * Analytics IPC Handlers – Main Process
 *
 * Dashboard KPIs, profit analysis, and agency performance
 * calculated from Ledger + Order data.
 */

import type { IpcMain } from 'electron'
import { getDb } from '../db'

export function registerAnalyticsHandlers(ipcMain: IpcMain) {
  // ── Dashboard KPIs ─────────────────────────────────────
  ipcMain.handle('analytics:dashboardKpis', async () => {
    try {
      const db = getDb()
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Monthly revenue from INVOICE ledger entries
      const invoices = await db.ledgerEntry.findMany({
        where: {
          type: 'INVOICE',
          isCancelled: false,
          createdAt: { gte: monthStart },
        },
      })
      const monthlyRevenue = invoices.reduce(
        (sum: number, e: any) => sum + parseFloat(String(e.debit)),
        0,
      )

      // Collections this month
      const collections = await db.ledgerEntry.findMany({
        where: {
          type: 'COLLECTION',
          isCancelled: false,
          createdAt: { gte: monthStart },
        },
      })
      const collectedAmount = collections.reduce(
        (sum: number, e: any) => sum + parseFloat(String(e.credit)),
        0,
      )
      const collectionRate = monthlyRevenue > 0
        ? ((collectedAmount / monthlyRevenue) * 100).toFixed(1)
        : '0'

      // Pending shipments
      const pendingShipments = await db.order.findMany({
        where: {
          status: { in: ['READY', 'PARTIALLY_SHIPPED', 'SHIPPED'] },
          isCancelled: false,
        },
      })

      // Overdue: accounts with positive balance past payment terms
      const overdueAccounts = await db.account.findMany({
        where: {
          currentBalance: { gt: 0 },
          isActive: true,
        },
      })
      const overdueTotal = overdueAccounts.reduce(
        (sum: number, a: any) => sum + parseFloat(String(a.currentBalance)),
        0,
      )

      return {
        monthlyRevenue: monthlyRevenue.toFixed(2),
        collectionRate,
        pendingShipments: pendingShipments.length,
        overdueReceivables: overdueTotal.toFixed(2),
      }
    } catch (error) {
      console.error('[IPC] analytics:dashboardKpis error:', error)
      return {
        monthlyRevenue: '0',
        collectionRate: '0',
        pendingShipments: 0,
        overdueReceivables: '0',
      }
    }
  })

  // ── Profit analysis ────────────────────────────────────
  ipcMain.handle('analytics:profitAnalysis', async () => {
    try {
      const db = getDb()
      const orders = await db.order.findMany({
        where: { isCancelled: false },
        include: {
          account: { select: { name: true } },
          items: true,
          landedCosts: { where: { isCancelled: false } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      return orders.map((order: any) => {
        const sellingPrice = parseFloat(String(order.grandTotal))
        const purchaseCost = order.items.reduce(
          (sum: number, item: any) =>
            sum + parseFloat(String(item.purchasePrice)) * parseFloat(String(item.quantity)),
          0,
        )

        const costsByType: Record<string, number> = {}
        for (const cost of order.landedCosts) {
          const type = cost.costType
          costsByType[type] = (costsByType[type] || 0) + parseFloat(String(cost.amount))
        }

        const totalCost =
          purchaseCost +
          (costsByType['FREIGHT'] || 0) +
          (costsByType['CUSTOMS_TAX'] || 0) +
          (costsByType['WAREHOUSE'] || 0) +
          (costsByType['INSURANCE'] || 0) +
          (costsByType['AGENCY_FEE'] || 0) +
          (costsByType['OTHER'] || 0)

        const netProfit = sellingPrice - totalCost
        const netMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0

        return {
          orderId: order.id,
          orderNo: order.orderNo,
          customer: order.account.name,
          status: order.status,
          sellingPrice: sellingPrice.toFixed(2),
          purchaseCost: purchaseCost.toFixed(2),
          freight: (costsByType['FREIGHT'] || 0).toFixed(2),
          customs: (costsByType['CUSTOMS_TAX'] || 0).toFixed(2),
          warehouse: (costsByType['WAREHOUSE'] || 0).toFixed(2),
          insurance: (costsByType['INSURANCE'] || 0).toFixed(2),
          agencyFee: (costsByType['AGENCY_FEE'] || 0).toFixed(2),
          totalCost: totalCost.toFixed(2),
          netProfit: netProfit.toFixed(2),
          netMargin: netMargin.toFixed(1),
        }
      })
    } catch (error) {
      console.error('[IPC] analytics:profitAnalysis error:', error)
      return []
    }
  })

  // ── Agency performance ─────────────────────────────────
  ipcMain.handle('analytics:agencyPerformance', async () => {
    try {
      const db = getDb()
      const records = await db.commissionRecord.findMany({
        where: { isCancelled: false },
        include: {
          agency: { include: { account: { select: { name: true } } } },
          order: { select: { grandTotal: true } },
        },
      })

      // Group by agency
      const byAgency = new Map<string, {
        name: string
        region: string
        totalSales: number
        commission: number
        pendingCommission: number
        orderCount: number
        commissionRate: number
      }>()

      for (const rec of records) {
        const agencyId = rec.agencyId
        const existing = byAgency.get(agencyId) || {
          name: rec.agency.account.name,
          region: rec.agency.region || '',
          totalSales: 0,
          commission: 0,
          pendingCommission: 0,
          orderCount: 0,
          commissionRate: parseFloat(String(rec.commissionRate)),
        }

        existing.totalSales += parseFloat(String(rec.baseAmount))
        existing.commission += parseFloat(String(rec.commissionAmount))
        if (rec.status === 'PENDING') {
          existing.pendingCommission += parseFloat(String(rec.commissionAmount))
        }
        existing.orderCount++
        byAgency.set(agencyId, existing)
      }

      return Array.from(byAgency.entries()).map(([id, data]) => ({
        id,
        ...data,
        totalSales: data.totalSales.toFixed(2),
        commission: data.commission.toFixed(2),
        pendingCommission: data.pendingCommission.toFixed(2),
        commissionRate: data.commissionRate.toFixed(1),
      }))
    } catch (error) {
      console.error('[IPC] analytics:agencyPerformance error:', error)
      return []
    }
  })

  // ── Account health metrics ─────────────────────────────
  ipcMain.handle('analytics:accountHealth', async (_event, accountId: string) => {
    try {
      const db = getDb()
      const now = new Date()
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

      const entries = await db.ledgerEntry.findMany({
        where: {
          accountId,
          type: 'INVOICE',
          isCancelled: false,
          createdAt: { gte: yearAgo },
        },
        orderBy: { createdAt: 'asc' },
      })

      // Monthly revenue
      const months = [
        'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
        'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
      ]
      const monthlyRevenue = months.map((month, idx) => {
        const monthEntries = entries.filter((e: any) => {
          const d = new Date(e.createdAt)
          return d.getMonth() === idx
        })
        const amount = monthEntries.reduce(
          (sum: number, e: any) => sum + parseFloat(String(e.debit)),
          0,
        )
        return { month, amount: amount.toFixed(2) }
      })

      const totalRevenue = entries.reduce(
        (sum: number, e: any) => sum + parseFloat(String(e.debit)),
        0,
      )

      // Collection entries for avg payment days
      const collectionEntries = await db.ledgerEntry.findMany({
        where: {
          accountId,
          type: 'COLLECTION',
          isCancelled: false,
          createdAt: { gte: yearAgo },
        },
      })

      const account = await db.account.findUnique({ where: { id: accountId } })
      const balance = account ? parseFloat(String(account.currentBalance)) : 0
      const riskLimit = account ? parseFloat(String(account.riskLimit)) : 0

      // Simple risk score: lower balance ratio = higher score
      const balanceRatio = riskLimit > 0 ? balance / riskLimit : 0
      const riskScore = Math.max(0, Math.min(100, Math.round((1 - balanceRatio) * 100)))

      return {
        accountId,
        totalRevenue12m: totalRevenue.toFixed(2),
        avgPaymentDays: account?.paymentTermDays ?? 30,
        overdueAmount: balance > 0 ? balance.toFixed(2) : '0',
        riskScore,
        monthlyRevenue,
      }
    } catch (error) {
      console.error('[IPC] analytics:accountHealth error:', error)
      return null
    }
  })
}
