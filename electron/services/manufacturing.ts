/**
 * Manufacturing Service – BOM & Work Order Management
 *
 * - BOM (Bill of Materials) CRUD with cost roll-up
 * - Work Order lifecycle: DRAFT → RELEASED → IN_PROGRESS → COMPLETED
 * - Material consumption (auto stock-out from BOM)
 * - Production receipt (auto stock-in of finished product)
 * - COGM (Cost of Goods Manufactured) calculation
 */

import type { PrismaClient } from '@prisma/client'
import Decimal from 'decimal.js'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// ─── BOM Service ────────────────────────────────────────────────

export class BomService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    code: string; name: string; productId: string;
    outputQty?: number; outputUnit?: string;
    laborHours?: number; laborCost?: number; overheadCost?: number;
    items: { productId: string; quantity: number; unit: string; wastePct?: number; notes?: string }[]
  }) {
    return this.prisma.billOfMaterial.create({
      data: {
        code: data.code,
        name: data.name,
        productId: data.productId,
        outputQty: data.outputQty ?? 1,
        outputUnit: data.outputUnit ?? 'PCS',
        laborHours: data.laborHours ?? 0,
        laborCost: data.laborCost ?? 0,
        overheadCost: data.overheadCost ?? 0,
        items: {
          create: data.items.map((item, i) => ({
            productId: item.productId,
            quantity: new Decimal(item.quantity),
            unit: item.unit,
            wastePct: item.wastePct ?? 0,
            notes: item.notes,
            sortOrder: i,
          })),
        },
      },
      include: { items: { include: { product: true } }, product: true },
    })
  }

  async list(productId?: string) {
    return this.prisma.billOfMaterial.findMany({
      where: { isActive: true, ...(productId ? { productId } : {}) },
      include: {
        product: { select: { id: true, code: true, name: true } },
        items: {
          include: { product: { select: { id: true, code: true, name: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async get(id: string) {
    return this.prisma.billOfMaterial.findUniqueOrThrow({
      where: { id },
      include: {
        product: true,
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  }

  /**
   * Calculate total material cost for a BOM based on current inventory lot costs.
   * Includes waste percentage.
   */
  async calculateCost(bomId: string): Promise<{
    materialCost: Decimal; laborCost: Decimal; overheadCost: Decimal; totalCost: Decimal;
    breakdown: { productName: string; qty: Decimal; unitCost: Decimal; lineCost: Decimal }[]
  }> {
    const bom = await this.get(bomId)
    let materialCost = new Decimal(0)
    const breakdown: { productName: string; qty: Decimal; unitCost: Decimal; lineCost: Decimal }[] = []

    for (const item of bom.items) {
      const wasteMul = new Decimal(1).plus(new Decimal(String(item.wastePct)).div(100))
      const effectiveQty = new Decimal(String(item.quantity)).mul(wasteMul)

      // Get average cost from latest inventory lots
      const lots = await this.prisma.inventoryLot.findMany({
        where: { productId: item.productId, remainingQuantity: { gt: 0 } },
        orderBy: { receivedDate: 'desc' },
        take: 5,
      })

      let avgCost = new Decimal(0)
      if (lots.length > 0) {
        const totalCostFromLots = lots.reduce(
          (s, l) => s.plus(new Decimal(String(l.unitCost))),
          new Decimal(0),
        )
        avgCost = totalCostFromLots.div(lots.length)
      }

      const lineCost = effectiveQty.mul(avgCost)
      materialCost = materialCost.plus(lineCost)
      breakdown.push({
        productName: item.product.name,
        qty: effectiveQty,
        unitCost: avgCost,
        lineCost,
      })
    }

    const laborCost = new Decimal(String(bom.laborCost))
    const overheadCost = new Decimal(String(bom.overheadCost))
    const totalCost = materialCost.plus(laborCost).plus(overheadCost)

    return { materialCost, laborCost, overheadCost, totalCost, breakdown }
  }
}

// ─── Work Order Service ─────────────────────────────────────────

export class WorkOrderService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    workOrderNo: string; bomId: string; branchId: string;
    orderId?: string; outputVariantId?: string;
    plannedQty: number; plannedStart?: string; plannedEnd?: string;
    costCenterCode?: string; notes?: string
  }) {
    return this.prisma.workOrder.create({
      data: {
        workOrderNo: data.workOrderNo,
        bomId: data.bomId,
        branchId: data.branchId,
        orderId: data.orderId,
        outputVariantId: data.outputVariantId,
        plannedQty: new Decimal(data.plannedQty),
        plannedStart: data.plannedStart ? new Date(data.plannedStart) : null,
        plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : null,
        costCenterCode: data.costCenterCode,
        notes: data.notes,
      },
      include: { bom: { include: { product: true } }, branch: true },
    })
  }

  async list(branchId: string, filters?: { status?: string; orderId?: string }) {
    const where: any = { branchId, isCancelled: false }
    if (filters?.status) where.status = filters.status
    if (filters?.orderId) where.orderId = filters.orderId

    return this.prisma.workOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        bom: { include: { product: { select: { id: true, code: true, name: true } } } },
        order: { select: { id: true, orderNo: true } },
        outputVariant: { select: { id: true, sku: true, size: true, color: true } },
        _count: { select: { consumptions: true } },
      },
    })
  }

  async get(id: string) {
    return this.prisma.workOrder.findUniqueOrThrow({
      where: { id },
      include: {
        bom: { include: { product: true, items: { include: { product: true } } } },
        order: { select: { id: true, orderNo: true } },
        outputVariant: true,
        consumptions: { orderBy: { consumedAt: 'desc' } },
      },
    })
  }

  /**
   * Release work order for production.
   */
  async release(id: string) {
    return this.prisma.workOrder.update({
      where: { id },
      data: { status: 'RELEASED' },
    })
  }

  /**
   * Start production — sets status to IN_PROGRESS, records actual start time.
   */
  async startProduction(id: string) {
    return this.prisma.workOrder.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        actualStart: new Date(),
      },
    })
  }

  /**
   * Consume raw materials from stock based on BOM.
   * Creates StockMovement (CONSUMPTION) and WorkOrderConsumption records.
   */
  async consumeMaterials(workOrderId: string, warehouseId: string) {
    return this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.findUniqueOrThrow({
        where: { id: workOrderId },
        include: { bom: { include: { items: { include: { product: true } } } } },
      })

      if (wo.status !== 'IN_PROGRESS') {
        throw new Error('İş emri üretimde değil. Önce üretimi başlatın.')
      }

      const multiplier = new Decimal(String(wo.plannedQty)).div(new Decimal(String(wo.bom.outputQty)))
      let totalMaterialCost = new Decimal(0)
      const consumptions: any[] = []

      for (const bomItem of wo.bom.items) {
        const wasteMul = new Decimal(1).plus(new Decimal(String(bomItem.wastePct)).div(100))
        const requiredQty = new Decimal(String(bomItem.quantity)).mul(multiplier).mul(wasteMul)

        // Get FIFO cost from lots
        const lots = await tx.inventoryLot.findMany({
          where: {
            productId: bomItem.productId,
            warehouseId,
            remainingQuantity: { gt: 0 },
          },
          orderBy: { receivedDate: 'asc' },
        })

        let remaining = requiredQty
        let consumptionCost = new Decimal(0)

        for (const lot of lots) {
          if (remaining.lte(0)) break
          const available = new Decimal(String(lot.remainingQuantity))
          const take = Decimal.min(remaining, available)

          consumptionCost = consumptionCost.plus(take.mul(new Decimal(String(lot.unitCost))))
          remaining = remaining.minus(take)

          await tx.inventoryLot.update({
            where: { id: lot.id },
            data: { remainingQuantity: { decrement: take } },
          })
        }

        // Find variant for stock movement (first variant of this product)
        const variant = await tx.productVariant.findFirst({
          where: { productId: bomItem.productId },
        })

        if (variant) {
          // Create stock movement for consumption
          await tx.stockMovement.create({
            data: {
              variantId: variant.id,
              warehouseId,
              productId: bomItem.productId,
              branchId: wo.branchId,
              type: 'CONSUMPTION',
              quantity: -Math.round(requiredQty.toNumber()),
              referenceId: workOrderId,
              referenceType: 'WORK_ORDER',
              description: `İş emri ${wo.workOrderNo} malzeme tüketimi`,
            },
          })

          // Update stock quantity
          await tx.stock.updateMany({
            where: { variantId: variant.id, warehouseId },
            data: { quantity: { decrement: Math.round(requiredQty.toNumber()) } },
          })
        }

        const unitCost = requiredQty.gt(0)
          ? consumptionCost.div(requiredQty)
          : new Decimal(0)

        consumptions.push({
          workOrderId,
          productId: bomItem.productId,
          quantity: requiredQty,
          unit: bomItem.unit,
          unitCost,
          totalCost: consumptionCost,
        })

        totalMaterialCost = totalMaterialCost.plus(consumptionCost)
      }

      // Batch create consumption records
      for (const c of consumptions) {
        await tx.workOrderConsumption.create({ data: c })
      }

      // Update work order material cost
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { materialCost: totalMaterialCost },
      })

      return { totalMaterialCost: totalMaterialCost.toFixed(2), items: consumptions.length }
    })
  }

  /**
   * Complete production — stock-in finished goods, calculate COGM.
   */
  async completeProduction(workOrderId: string, warehouseId: string, producedQty: number, wasteQty?: number) {
    return this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.findUniqueOrThrow({
        where: { id: workOrderId },
        include: { bom: { include: { product: true } } },
      })

      if (wo.status !== 'IN_PROGRESS') {
        throw new Error('İş emri üretimde değil.')
      }

      const produced = new Decimal(producedQty)
      const waste = new Decimal(wasteQty ?? 0)
      const matCost = new Decimal(String(wo.materialCost))
      const labCost = new Decimal(String(wo.bom.laborCost)).mul(produced)
      const ovhCost = new Decimal(String(wo.bom.overheadCost)).mul(produced)
      const totalCost = matCost.plus(labCost).plus(ovhCost)
      const unitCost = produced.gt(0) ? totalCost.div(produced) : new Decimal(0)

      // Stock-in the finished product
      if (wo.outputVariantId) {
        await tx.stockMovement.create({
          data: {
            variantId: wo.outputVariantId,
            warehouseId,
            productId: wo.bom.productId,
            branchId: wo.branchId,
            type: 'PRODUCTION',
            quantity: Math.round(produced.toNumber()),
            referenceId: workOrderId,
            referenceType: 'WORK_ORDER',
            description: `İş emri ${wo.workOrderNo} üretim girişi`,
          },
        })

        await tx.stock.upsert({
          where: { variantId_warehouseId: { variantId: wo.outputVariantId, warehouseId } },
          create: {
            variantId: wo.outputVariantId,
            warehouseId,
            quantity: Math.round(produced.toNumber()),
          },
          update: { quantity: { increment: Math.round(produced.toNumber()) } },
        })

        // Create inventory lot for the produced goods
        await tx.inventoryLot.create({
          data: {
            productId: wo.bom.productId,
            variantId: wo.outputVariantId,
            warehouseId,
            branchId: wo.branchId,
            batchNo: `PROD-${wo.workOrderNo}-${Date.now()}`,
            quantity: produced,
            remainingQuantity: produced,
            unitCost,
          },
        })
      }

      // Update work order
      const updated = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: 'COMPLETED',
          producedQty: produced,
          wasteQty: waste,
          laborCost: labCost,
          overheadCost: ovhCost,
          totalCost,
          actualEnd: new Date(),
        },
      })

      return {
        ...updated,
        cogm: {
          materialCost: matCost.toFixed(2),
          laborCost: labCost.toFixed(2),
          overheadCost: ovhCost.toFixed(2),
          totalCost: totalCost.toFixed(2),
          unitCost: unitCost.toFixed(2),
        },
      }
    })
  }

  async cancel(id: string) {
    return this.prisma.workOrder.update({
      where: { id },
      data: { status: 'CANCELLED', isCancelled: true },
    })
  }
}
