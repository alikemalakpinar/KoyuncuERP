/**
 * Inventory Service – FIFO Lot-Based Stock Management
 * Updated to support branchId on lots and transactions.
 */

import type { PrismaClient } from '@prisma/client'

function toFixed2(n: number): string { return n.toFixed(2) }

function generateBatchNo(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const seq = Date.now().toString(36).toUpperCase().slice(-6)
  return `LOT-${y}${m}-${seq}`
}

export interface ReceiveLotInput {
  productId: string; variantId: string; warehouseId: string
  quantity: string; unitCost: string; batchNo?: string; branchId?: string
}

export interface AllocateInput {
  variantId: string; warehouseId: string; quantity: string; orderId: string
}

export interface FulfillInput {
  variantId: string; warehouseId: string; quantity: string; orderId: string; orderNo: string
}

export interface FulfillmentResult {
  totalCogs: string
  lotsConsumed: { lotId: string; batchNo: string; quantity: string; unitCost: string; lineCost: string }[]
}

export class InventoryService {
  constructor(private db: PrismaClient) {}

  async receiveLot(input: ReceiveLotInput) {
    const qty = parseFloat(input.quantity)
    const cost = parseFloat(input.unitCost)
    const batchNo = input.batchNo || generateBatchNo()

    return this.db.$transaction(async (tx: any) => {
      const lot = await tx.inventoryLot.create({
        data: {
          productId: input.productId, variantId: input.variantId,
          warehouseId: input.warehouseId, branchId: input.branchId!,
          batchNo, quantity: input.quantity, remainingQuantity: input.quantity,
          unitCost: input.unitCost,
        },
      })

      await tx.inventoryTransaction.create({
        data: {
          type: 'PURCHASE', variantId: input.variantId,
          warehouseId: input.warehouseId, branchId: input.branchId!,
          lotId: lot.id, quantity: input.quantity, unitCost: input.unitCost,
          totalCost: toFixed2(qty * cost), referenceId: lot.id, referenceType: 'LOT',
          description: `Lot girişi: ${batchNo} (${qty} adet @ $${input.unitCost})`,
        },
      })

      await tx.stock.upsert({
        where: { variantId_warehouseId: { variantId: input.variantId, warehouseId: input.warehouseId } },
        update: { quantity: { increment: qty } },
        create: { variantId: input.variantId, warehouseId: input.warehouseId, quantity: qty, reservedQuantity: 0 },
      })

      return { success: true, data: lot }
    })
  }

  async allocate(input: AllocateInput) {
    const qty = parseFloat(input.quantity)
    return this.db.$transaction(async (tx: any) => {
      const stock = await tx.stock.findUnique({
        where: { variantId_warehouseId: { variantId: input.variantId, warehouseId: input.warehouseId } },
      })
      if (!stock) return { success: false, error: 'Bu depoda stok bulunamadı' }
      const available = stock.quantity - stock.reservedQuantity
      if (available < qty) return { success: false, error: `Yetersiz stok. Mevcut: ${available}, İstenen: ${qty}` }

      await tx.stock.update({ where: { id: stock.id }, data: { reservedQuantity: { increment: qty } } })
      return { success: true, data: { reserved: qty } }
    })
  }

  async fulfillFifo(input: FulfillInput): Promise<{ success: boolean; data?: FulfillmentResult; error?: string }> {
    const qtyNeeded = parseFloat(input.quantity)
    return this.db.$transaction(async (tx: any) => {
      const lots = await tx.inventoryLot.findMany({
        where: { variantId: input.variantId, warehouseId: input.warehouseId, remainingQuantity: { gt: 0 } },
        orderBy: { receivedDate: 'asc' },
      })

      let remaining = qtyNeeded, totalCogs = 0
      const consumed: FulfillmentResult['lotsConsumed'] = []

      for (const lot of lots) {
        if (remaining <= 0) break
        const lotRemaining = parseFloat(String(lot.remainingQuantity))
        const take = Math.min(remaining, lotRemaining)
        const unitCost = parseFloat(String(lot.unitCost))
        const lineCost = take * unitCost

        await tx.inventoryLot.update({ where: { id: lot.id }, data: { remainingQuantity: { decrement: take } } })
        consumed.push({ lotId: lot.id, batchNo: lot.batchNo, quantity: toFixed2(take), unitCost: toFixed2(unitCost), lineCost: toFixed2(lineCost) })
        totalCogs += lineCost
        remaining -= take
      }

      if (remaining > 0) return { success: false, error: `FIFO: ${toFixed2(remaining)} adet karşılanamadı` }

      await tx.stock.update({
        where: { variantId_warehouseId: { variantId: input.variantId, warehouseId: input.warehouseId } },
        data: { quantity: { decrement: qtyNeeded }, reservedQuantity: { decrement: qtyNeeded } },
      })

      return { success: true, data: { totalCogs: toFixed2(totalCogs), lotsConsumed: consumed } }
    })
  }

  async getLots(variantId: string, warehouseId?: string) {
    const where: any = { variantId, remainingQuantity: { gt: 0 } }
    if (warehouseId) where.warehouseId = warehouseId
    return this.db.inventoryLot.findMany({ where, orderBy: { receivedDate: 'asc' }, include: { warehouse: true } })
  }

  async getTransactions(variantId: string, limit = 50) {
    return this.db.inventoryTransaction.findMany({
      where: { variantId }, orderBy: { createdAt: 'desc' }, take: limit,
      include: { lot: true, warehouse: true },
    })
  }
}
