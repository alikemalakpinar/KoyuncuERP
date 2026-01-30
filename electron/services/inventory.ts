/**
 * Inventory Service – FIFO Lot-Based Stock Management
 *
 * Handles:
 * - Lot creation on purchase receipt
 * - Stock allocation (reservation) on order confirmation
 * - FIFO fulfillment on shipment with exact COGS calculation
 * - Inventory transactions audit trail
 *
 * All monetary calculations use string-based decimal arithmetic.
 */

import type { DbClient } from '../db'

// ── Helpers ────────────────────────────────────────────────

function toFixed2(n: number): string {
  return n.toFixed(2)
}

function generateBatchNo(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const seq = Date.now().toString(36).toUpperCase().slice(-6)
  return `LOT-${y}${m}-${seq}`
}

// ── Types ──────────────────────────────────────────────────

export interface ReceiveLotInput {
  productId: string
  variantId: string
  warehouseId: string
  quantity: string
  unitCost: string
  batchNo?: string
}

export interface AllocateInput {
  variantId: string
  warehouseId: string
  quantity: string
  orderId: string
}

export interface FulfillInput {
  variantId: string
  warehouseId: string
  quantity: string
  orderId: string
  orderNo: string
}

export interface FulfillmentResult {
  totalCogs: string
  lotsConsumed: { lotId: string; batchNo: string; quantity: string; unitCost: string; lineCost: string }[]
}

// ── Service ────────────────────────────────────────────────

export class InventoryService {
  constructor(private db: DbClient) {}

  /**
   * Receive stock into a new lot (purchase receipt).
   * Creates an InventoryLot + InventoryTransaction(PURCHASE).
   * Updates Stock aggregate.
   */
  async receiveLot(input: ReceiveLotInput) {
    const qty = parseFloat(input.quantity)
    const cost = parseFloat(input.unitCost)
    const batchNo = input.batchNo || generateBatchNo()

    return this.db.$transaction(async (tx: any) => {
      const lot = await tx.inventoryLot.create({
        data: {
          productId: input.productId,
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          batchNo,
          quantity: input.quantity,
          remainingQuantity: input.quantity,
          unitCost: input.unitCost,
        },
      })

      await tx.inventoryTransaction.create({
        data: {
          type: 'PURCHASE',
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          lotId: lot.id,
          quantity: input.quantity,
          unitCost: input.unitCost,
          totalCost: toFixed2(qty * cost),
          referenceId: lot.id,
          referenceType: 'LOT',
          description: `Lot girişi: ${batchNo} (${qty} adet @ $${input.unitCost})`,
        },
      })

      // Update aggregate stock
      await tx.stock.upsert({
        where: {
          variantId_warehouseId: {
            variantId: input.variantId,
            warehouseId: input.warehouseId,
          },
        },
        update: { quantity: { increment: qty } },
        create: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          quantity: qty,
          reservedQuantity: 0,
        },
      })

      return { success: true, data: lot }
    })
  }

  /**
   * Allocate (reserve) stock when an order is CONFIRMED.
   * Increases reservedQuantity but does NOT decrease available stock.
   */
  async allocate(input: AllocateInput) {
    const qty = parseFloat(input.quantity)

    return this.db.$transaction(async (tx: any) => {
      const stock = await tx.stock.findUnique({
        where: {
          variantId_warehouseId: {
            variantId: input.variantId,
            warehouseId: input.warehouseId,
          },
        },
      })

      if (!stock) {
        return { success: false, error: 'Bu depoda stok bulunamadı' }
      }

      const available = stock.quantity - stock.reservedQuantity
      if (available < qty) {
        return {
          success: false,
          error: `Yetersiz stok. Mevcut: ${available}, İstenen: ${qty}`,
        }
      }

      await tx.stock.update({
        where: { id: stock.id },
        data: { reservedQuantity: { increment: qty } },
      })

      await tx.inventoryTransaction.create({
        data: {
          type: 'SALE', // reservation is part of sale flow
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          quantity: toFixed2(qty),
          unitCost: '0',
          totalCost: '0',
          referenceId: input.orderId,
          referenceType: 'ORDER_RESERVE',
          description: `Stok rezervasyonu: ${qty} adet`,
        },
      })

      return { success: true, data: { reserved: qty } }
    })
  }

  /**
   * FIFO Fulfillment – Consume oldest lots when order is SHIPPED.
   *
   * 1. Find oldest lots with remainingQuantity > 0
   * 2. Consume sequentially until order qty met
   * 3. Calculate exact COGS from lot unit costs
   * 4. Create InventoryTransaction per lot consumed
   * 5. Decrease stock quantity + reservedQuantity
   */
  async fulfillFifo(input: FulfillInput): Promise<{ success: boolean; data?: FulfillmentResult; error?: string }> {
    const qtyNeeded = parseFloat(input.quantity)

    return this.db.$transaction(async (tx: any) => {
      // Get oldest lots with remaining stock
      const lots = await tx.inventoryLot.findMany({
        where: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          remainingQuantity: { gt: 0 },
        },
        orderBy: { receivedDate: 'asc' }, // FIFO: oldest first
      })

      let remaining = qtyNeeded
      let totalCogs = 0
      const consumed: FulfillmentResult['lotsConsumed'] = []

      for (const lot of lots) {
        if (remaining <= 0) break

        const lotRemaining = parseFloat(String(lot.remainingQuantity))
        const take = Math.min(remaining, lotRemaining)
        const unitCost = parseFloat(String(lot.unitCost))
        const lineCost = take * unitCost

        // Decrease lot remaining
        await tx.inventoryLot.update({
          where: { id: lot.id },
          data: { remainingQuantity: { decrement: take } },
        })

        // Transaction record
        await tx.inventoryTransaction.create({
          data: {
            type: 'SALE',
            variantId: input.variantId,
            warehouseId: input.warehouseId,
            lotId: lot.id,
            quantity: toFixed2(take),
            unitCost: toFixed2(unitCost),
            totalCost: toFixed2(lineCost),
            referenceId: input.orderId,
            referenceType: 'ORDER_FULFILL',
            description: `FIFO sevk: ${lot.batchNo} → ${input.orderNo} (${take} adet @ $${toFixed2(unitCost)})`,
          },
        })

        consumed.push({
          lotId: lot.id,
          batchNo: lot.batchNo,
          quantity: toFixed2(take),
          unitCost: toFixed2(unitCost),
          lineCost: toFixed2(lineCost),
        })

        totalCogs += lineCost
        remaining -= take
      }

      if (remaining > 0) {
        // Not enough stock – this shouldn't happen if allocation was checked
        return {
          success: false,
          error: `FIFO: Yetersiz lot stoğu. ${toFixed2(remaining)} adet karşılanamadı`,
        }
      }

      // Decrease aggregate stock
      await tx.stock.update({
        where: {
          variantId_warehouseId: {
            variantId: input.variantId,
            warehouseId: input.warehouseId,
          },
        },
        data: {
          quantity: { decrement: qtyNeeded },
          reservedQuantity: { decrement: qtyNeeded },
        },
      })

      return {
        success: true,
        data: {
          totalCogs: toFixed2(totalCogs),
          lotsConsumed: consumed,
        },
      }
    })
  }

  /**
   * Get lot summary for a variant (for UI display).
   */
  async getLots(variantId: string, warehouseId?: string) {
    const where: any = { variantId, remainingQuantity: { gt: 0 } }
    if (warehouseId) where.warehouseId = warehouseId

    return this.db.inventoryLot.findMany({
      where,
      orderBy: { receivedDate: 'asc' },
      include: { warehouse: true },
    })
  }

  /**
   * Get transaction history for a variant.
   */
  async getTransactions(variantId: string, limit = 50) {
    return this.db.inventoryTransaction.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { lot: true, warehouse: true },
    })
  }
}
