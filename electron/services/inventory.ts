/**
 * Inventory Service – FIFO Lot-Based Stock Management
 * All math via Decimal.js. $transaction used for all writes.
 * Schema models: Stock, StockMovement, InventoryLot, InventoryTransaction
 */

import Decimal from 'decimal.js'
import type { PrismaClient } from '@prisma/client'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

type DbClient = PrismaClient

export interface StockInInput {
  variantId: string; warehouseId: string; branchId: string
  quantity: string; unitCost: string; referenceId?: string; referenceType?: string; notes?: string
}

export interface StockOutInput {
  variantId: string; warehouseId: string; branchId: string
  quantity: string; referenceId?: string; referenceType?: string; notes?: string
}

export class InventoryService {
  constructor(private db: DbClient) {}

  /** Stock In – Creates lot, updates stock quantity */
  async stockIn(input: StockInInput) {
    return this.db.$transaction(async (tx: any) => {
      const qty = new Decimal(input.quantity)
      const cost = new Decimal(input.unitCost)
      if (qty.lte(0)) throw new Error('Miktar pozitif olmalı')
      if (cost.lt(0)) throw new Error('Maliyet negatif olamaz')

      // Get variant to find productId
      const variant = await tx.productVariant.findUnique({
        where: { id: input.variantId },
        select: { productId: true },
      })
      if (!variant) throw new Error('Ürün varyantı bulunamadı')

      // Create lot
      const batchNo = `LOT-${Date.now().toString(36).toUpperCase()}`
      await tx.inventoryLot.create({
        data: {
          productId: variant.productId,
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          branchId: input.branchId,
          batchNo,
          quantity: qty.toFixed(2),
          remainingQuantity: qty.toFixed(2),
          unitCost: cost.toFixed(2),
        },
      })

      // Upsert stock
      const existing = await tx.stock.findFirst({
        where: { variantId: input.variantId, warehouseId: input.warehouseId },
      })
      if (existing) {
        const newQty = new Decimal(String(existing.quantity)).plus(qty)
        await tx.stock.update({
          where: { id: existing.id },
          data: { quantity: Math.round(newQty.toNumber()) },
        })
      } else {
        await tx.stock.create({
          data: {
            variantId: input.variantId, warehouseId: input.warehouseId,
            quantity: Math.round(qty.toNumber()), reservedQuantity: 0,
          },
        })
      }

      // Record movement
      await tx.stockMovement.create({
        data: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          productId: variant.productId,
          branchId: input.branchId,
          type: 'IN',
          quantity: Math.round(qty.toNumber()),
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          description: input.notes,
        },
      })

      // Transaction record
      await tx.inventoryTransaction.create({
        data: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          branchId: input.branchId,
          type: 'PURCHASE',
          quantity: qty.toFixed(2),
          unitCost: cost.toFixed(2),
          totalCost: qty.mul(cost).toFixed(2),
          referenceId: input.referenceId,
          referenceType: input.referenceType,
        },
      })

      return { success: true, quantityAdded: qty.toFixed(2) }
    })
  }

  /** Stock Out – FIFO lot depletion, Decimal.js for COGS */
  async stockOut(input: StockOutInput) {
    return this.db.$transaction(async (tx: any) => {
      const qty = new Decimal(input.quantity)
      if (qty.lte(0)) throw new Error('Miktar pozitif olmalı')

      const variant = await tx.productVariant.findUnique({
        where: { id: input.variantId },
        select: { productId: true },
      })
      if (!variant) throw new Error('Ürün varyantı bulunamadı')

      // Get available lots (FIFO)
      const lots = await tx.inventoryLot.findMany({
        where: {
          variantId: input.variantId, warehouseId: input.warehouseId,
          remainingQuantity: { gt: 0 },
        },
        orderBy: { createdAt: 'asc' },
      })

      const totalAvailable = lots.reduce(
        (sum: Decimal, lot: any) => sum.plus(new Decimal(String(lot.remainingQuantity))),
        new Decimal(0),
      )

      if (totalAvailable.lt(qty)) {
        throw new Error(`Yetersiz stok. Mevcut: ${totalAvailable.toFixed(2)}, İstenen: ${qty.toFixed(2)}`)
      }

      // FIFO depletion
      let remaining = qty
      let totalCogs = new Decimal(0)

      for (const lot of lots) {
        if (remaining.lte(0)) break
        const lotRemaining = new Decimal(String(lot.remainingQuantity))
        const take = Decimal.min(remaining, lotRemaining)
        const unitCost = new Decimal(String(lot.unitCost))
        const lineCost = take.mul(unitCost)

        totalCogs = totalCogs.plus(lineCost)
        remaining = remaining.minus(take)

        await tx.inventoryLot.update({
          where: { id: lot.id },
          data: { remainingQuantity: lotRemaining.minus(take).toFixed(2) },
        })
      }

      // Update stock quantity
      const stock = await tx.stock.findFirst({
        where: { variantId: input.variantId, warehouseId: input.warehouseId },
      })
      if (stock) {
        const newQty = Math.max(0, new Decimal(String(stock.quantity)).minus(qty).toNumber())
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: Math.round(newQty) },
        })
      }

      // Movement
      await tx.stockMovement.create({
        data: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          productId: variant.productId,
          branchId: input.branchId,
          type: 'OUT',
          quantity: Math.round(qty.toNumber()),
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          description: input.notes,
        },
      })

      // Transaction record with COGS
      await tx.inventoryTransaction.create({
        data: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          branchId: input.branchId,
          type: 'SALE',
          quantity: qty.toFixed(2),
          unitCost: qty.gt(0) ? totalCogs.div(qty).toFixed(2) : '0.00',
          totalCost: totalCogs.toFixed(2),
          referenceId: input.referenceId,
          referenceType: input.referenceType,
        },
      })

      return { success: true, cogs: totalCogs.toFixed(2) }
    })
  }

  /** Reserve stock for an order (does NOT reduce physical quantity) */
  async reserveStock(variantId: string, warehouseId: string, branchId: string, quantity: string) {
    return this.db.$transaction(async (tx: any) => {
      const qty = new Decimal(quantity)
      if (qty.lte(0)) throw new Error('Miktar pozitif olmalı')

      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { productId: true },
      })
      if (!variant) throw new Error('Ürün varyantı bulunamadı')

      const stock = await tx.stock.findFirst({
        where: { variantId, warehouseId },
      })
      if (!stock) throw new Error('Stok kaydı bulunamadı')

      const available = new Decimal(String(stock.quantity)).minus(new Decimal(String(stock.reservedQuantity)))
      if (available.lt(qty)) {
        throw new Error(`Yetersiz stok. Kullanılabilir: ${available.toFixed(2)}, İstenen: ${qty.toFixed(2)}`)
      }

      const newReserved = new Decimal(String(stock.reservedQuantity)).plus(qty)
      await tx.stock.update({
        where: { id: stock.id },
        data: { reservedQuantity: Math.round(newReserved.toNumber()) },
      })

      await tx.stockMovement.create({
        data: {
          variantId, warehouseId,
          productId: variant.productId,
          branchId,
          type: 'RESERVE',
          quantity: Math.round(qty.toNumber()),
          description: 'Sipariş rezervasyonu',
        },
      })

      return { success: true }
    })
  }

  /** Release reserved stock */
  async releaseStock(variantId: string, warehouseId: string, branchId: string, quantity: string) {
    return this.db.$transaction(async (tx: any) => {
      const qty = new Decimal(quantity)
      if (qty.lte(0)) throw new Error('Miktar pozitif olmalı')

      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { productId: true },
      })
      if (!variant) throw new Error('Ürün varyantı bulunamadı')

      const stock = await tx.stock.findFirst({
        where: { variantId, warehouseId },
      })
      if (!stock) throw new Error('Stok kaydı bulunamadı')

      const newReserved = Decimal.max(
        new Decimal(0),
        new Decimal(String(stock.reservedQuantity)).minus(qty),
      )
      await tx.stock.update({
        where: { id: stock.id },
        data: { reservedQuantity: Math.round(newReserved.toNumber()) },
      })

      await tx.stockMovement.create({
        data: {
          variantId, warehouseId,
          productId: variant.productId,
          branchId,
          type: 'UNRESERVE',
          quantity: Math.round(qty.toNumber()),
          description: 'Rezervasyon iptali',
        },
      })

      return { success: true }
    })
  }

  /** Stock adjustment – for physical count differences */
  async adjustStock(input: {
    variantId: string; warehouseId: string; branchId: string
    newQuantity: string; reason: string; userId: string
  }) {
    return this.db.$transaction(async (tx: any) => {
      const newQty = new Decimal(input.newQuantity)
      if (newQty.lt(0)) throw new Error('Miktar negatif olamaz')

      const variant = await tx.productVariant.findUnique({
        where: { id: input.variantId },
        select: { productId: true },
      })
      if (!variant) throw new Error('Ürün varyantı bulunamadı')

      const stock = await tx.stock.findFirst({
        where: { variantId: input.variantId, warehouseId: input.warehouseId },
      })
      if (!stock) throw new Error('Stok kaydı bulunamadı')

      const oldQty = new Decimal(String(stock.quantity))
      const diff = newQty.minus(oldQty)

      if (diff.isZero()) return { success: true, adjustment: '0', oldQty: oldQty.toFixed(0), newQty: newQty.toFixed(0) }

      await tx.stock.update({
        where: { id: stock.id },
        data: { quantity: Math.round(newQty.toNumber()) },
      })

      await tx.stockMovement.create({
        data: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          productId: variant.productId,
          branchId: input.branchId,
          type: 'ADJUSTMENT',
          quantity: Math.round(diff.abs().toNumber()),
          description: `Stok düzeltme: ${oldQty.toFixed(0)} → ${newQty.toFixed(0)} (${input.reason})`,
        },
      })

      await tx.inventoryTransaction.create({
        data: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          branchId: input.branchId,
          type: 'ADJUSTMENT',
          quantity: diff.abs().toFixed(2),
          unitCost: '0.00',
          totalCost: '0.00',
          referenceType: 'ADJUSTMENT',
        },
      })

      return { success: true, adjustment: diff.toFixed(2), oldQty: oldQty.toFixed(0), newQty: newQty.toFixed(0) }
    })
  }
}
