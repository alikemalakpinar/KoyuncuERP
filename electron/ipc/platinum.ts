/**
 * Platinum IPC Handlers – Inventory FIFO, Pricing, Finance
 *
 * New handlers for the Platinum Edition features:
 * - inventory:receiveLot, inventory:allocate, inventory:fulfill, inventory:lots, inventory:transactions
 * - pricing:resolve, pricing:lists, pricing:createList, pricing:addItem, pricing:assignToAccount
 * - finance:lockPeriod, finance:getLatestLock, finance:agingReport, finance:fxRevaluation, finance:postFxRevaluation
 */

import type { IpcMain } from 'electron'
import { getDb } from '../db'
import { InventoryService } from '../services/inventory'
import { PricingService } from '../services/pricing'
import { FinanceService } from '../services/finance'
import { writeAuditLog } from './audit'

export function registerPlatinumHandlers(ipcMain: IpcMain) {
  // Lazy service init (db may not be ready at registration time)
  const getServices = () => {
    const db = getDb()
    return {
      inventory: new InventoryService(db),
      pricing: new PricingService(db),
      finance: new FinanceService(db),
    }
  }

  // ═══════════════════════════════════════════════════════════
  // INVENTORY – FIFO Lot Management
  // ═══════════════════════════════════════════════════════════

  ipcMain.handle('inventory:receiveLot', async (_event, data: {
    productId: string
    variantId: string
    warehouseId: string
    quantity: string
    unitCost: string
    batchNo?: string
  }) => {
    try {
      const { inventory } = getServices()
      const result = await inventory.receiveLot(data)

      await writeAuditLog({
        entityType: 'InventoryLot',
        entityId: result.data?.id ?? '',
        action: 'CREATE',
        newData: data,
        description: `Lot girişi: ${data.quantity} adet @ $${data.unitCost}`,
      })

      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('inventory:allocate', async (_event, data: {
    variantId: string
    warehouseId: string
    quantity: string
    orderId: string
  }) => {
    try {
      const { inventory } = getServices()
      return await inventory.allocate(data)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('inventory:fulfill', async (_event, data: {
    variantId: string
    warehouseId: string
    quantity: string
    orderId: string
    orderNo: string
  }) => {
    try {
      const { inventory } = getServices()
      const result = await inventory.fulfillFifo(data)

      if (result.success && result.data) {
        // Create COGS ledger entry
        const db = getDb()
        const entryNo = `COGS-${Date.now().toString(36).toUpperCase()}`
        await db.ledgerEntry.create({
          data: {
            entryNo,
            accountId: data.orderId, // Will be resolved to proper account
            type: 'ADJUSTMENT',
            debit: result.data.totalCogs,
            credit: '0',
            currency: 'USD',
            exchangeRate: '1',
            costCenter: 'COGS',
            description: `SMM kaydı – ${data.orderNo}: $${result.data.totalCogs} (${result.data.lotsConsumed.length} lot)`,
            referenceId: data.orderId,
            referenceType: 'ORDER_COGS',
          },
        })
      }

      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('inventory:lots', async (_event, variantId: string, warehouseId?: string) => {
    try {
      const { inventory } = getServices()
      return await inventory.getLots(variantId, warehouseId)
    } catch (error: any) {
      return []
    }
  })

  ipcMain.handle('inventory:transactions', async (_event, variantId: string, limit?: number) => {
    try {
      const { inventory } = getServices()
      return await inventory.getTransactions(variantId, limit)
    } catch (error: any) {
      return []
    }
  })

  // ═══════════════════════════════════════════════════════════
  // PRICING – Multi-Price List Engine
  // ═══════════════════════════════════════════════════════════

  ipcMain.handle('pricing:resolve', async (_event, data: {
    accountId: string
    variantId: string
    quantity?: string
  }) => {
    try {
      const { pricing } = getServices()
      return await pricing.resolvePrice(data.accountId, data.variantId, data.quantity)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('pricing:resolveBatch', async (_event, data: {
    accountId: string
    variants: { variantId: string; quantity: string }[]
  }) => {
    try {
      const { pricing } = getServices()
      return await pricing.resolvePrices(data.accountId, data.variants)
    } catch (error: any) {
      return []
    }
  })

  ipcMain.handle('pricing:lists', async () => {
    try {
      const { pricing } = getServices()
      return await pricing.listPriceLists()
    } catch (error: any) {
      return []
    }
  })

  ipcMain.handle('pricing:createList', async (_event, data: {
    name: string
    currency: string
    isDefault?: boolean
  }) => {
    try {
      const { pricing } = getServices()
      const list = await pricing.createPriceList(data)
      return { success: true, data: list }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('pricing:addItem', async (_event, data: {
    priceListId: string
    variantId: string
    price: string
    minQuantity?: string
  }) => {
    try {
      const { pricing } = getServices()
      const item = await pricing.addPriceListItem(data)
      return { success: true, data: item }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('pricing:assignToAccount', async (_event, accountId: string, priceListId: string) => {
    try {
      const { pricing } = getServices()
      const account = await pricing.assignPriceListToAccount(accountId, priceListId)
      return { success: true, data: account }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // ═══════════════════════════════════════════════════════════
  // FINANCE – Period Lock, Aging, FX Revaluation
  // ═══════════════════════════════════════════════════════════

  ipcMain.handle('finance:lockPeriod', async (_event, data: {
    closingDate: string
    lockedBy: string
    notes?: string
  }) => {
    try {
      const { finance } = getServices()
      const result = await finance.lockPeriod(new Date(data.closingDate), data.lockedBy, data.notes)

      if (result.success) {
        await writeAuditLog({
          entityType: 'PeriodLock',
          entityId: result.data?.id ?? '',
          action: 'CREATE',
          newData: data,
          description: `Dönem kilitlendi: ${data.closingDate}`,
        })
      }

      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('finance:getLatestLock', async () => {
    try {
      const { finance } = getServices()
      return await finance.getLatestLock()
    } catch (error: any) {
      return null
    }
  })

  ipcMain.handle('finance:isDateLocked', async (_event, dateStr: string) => {
    try {
      const { finance } = getServices()
      return await finance.isDateLocked(new Date(dateStr))
    } catch (error: any) {
      return false
    }
  })

  ipcMain.handle('finance:agingReport', async () => {
    try {
      const { finance } = getServices()
      return await finance.generateAgingReport()
    } catch (error: any) {
      return []
    }
  })

  ipcMain.handle('finance:fxRevaluation', async (_event, currentRates: Record<string, number>) => {
    try {
      const { finance } = getServices()
      return await finance.calculateFxRevaluation(currentRates)
    } catch (error: any) {
      return { items: [], totalGain: '0.00', totalLoss: '0.00', netGainLoss: '0.00' }
    }
  })

  ipcMain.handle('finance:postFxRevaluation', async (_event, data: {
    items: any[]
    postedBy: string
  }) => {
    try {
      const { finance } = getServices()
      return await finance.postFxRevaluation(data.items, data.postedBy)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
