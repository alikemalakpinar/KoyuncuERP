/**
 * Pricing Service – PriceList + PriceListItem Engine
 * All math via Decimal.js for financial precision.
 * Uses schema models: PriceList, PriceListItem, Account.priceListId
 */

import Decimal from 'decimal.js'
import type { PrismaClient } from '@prisma/client'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

type DbClient = PrismaClient

export interface PriceListInput {
  name: string; code: string; currency: string
  isDefault?: boolean
}

export interface PriceListItemInput {
  priceListId: string; variantId: string
  price: string; minQuantity?: string
}

export interface ResolvedPrice {
  unitPrice: string
  appliedPriceList: string | null
  discount: string
  belowCost: boolean
  margin: string
}

export class PricingService {
  constructor(private db: DbClient) {}

  // ─── Price Lists ────────────────────────────────────────────
  async createPriceList(input: PriceListInput) {
    return this.db.$transaction(async (tx: any) => {
      if (input.isDefault) {
        await tx.priceList.updateMany({
          where: { currency: input.currency, isDefault: true },
          data: { isDefault: false },
        })
      }
      return tx.priceList.create({ data: input })
    })
  }

  async updatePriceList(id: string, input: Partial<PriceListInput>) {
    return this.db.$transaction(async (tx: any) => {
      if (input.isDefault) {
        const existing = await tx.priceList.findUnique({ where: { id } })
        if (existing) {
          await tx.priceList.updateMany({
            where: { currency: existing.currency, isDefault: true, id: { not: id } },
            data: { isDefault: false },
          })
        }
      }
      return tx.priceList.update({ where: { id }, data: input })
    })
  }

  async getPriceLists(currency?: string) {
    const where: any = {}
    if (currency) where.currency = currency
    return this.db.priceList.findMany({ where, orderBy: { name: 'asc' } })
  }

  // ─── Price List Items ─────────────────────────────────────────
  async addPriceListItem(input: PriceListItemInput) {
    const price = new Decimal(input.price)
    if (price.lt(0)) throw new Error('Birim fiyat negatif olamaz')
    const minQty = input.minQuantity ? new Decimal(input.minQuantity) : new Decimal(1)

    return this.db.priceListItem.create({
      data: {
        priceListId: input.priceListId,
        variantId: input.variantId,
        price: price.toFixed(2),
        minQuantity: minQty.toFixed(2),
      },
    })
  }

  // ─── Assign Price List to Account ─────────────────────────────
  async assignPriceListToAccount(accountId: string, priceListId: string) {
    return this.db.account.update({
      where: { id: accountId },
      data: { priceListId },
    })
  }

  // ─── Price Resolution Engine ────────────────────────────────
  async resolvePrice(
    accountId: string,
    variantId: string,
    quantity?: string,
  ): Promise<ResolvedPrice> {
    const qty = quantity ? new Decimal(quantity) : new Decimal(1)

    // Get variant for baseCost + listPrice
    const variant = await this.db.productVariant.findUnique({ where: { id: variantId } })
    if (!variant) throw new Error('Ürün varyantı bulunamadı')

    const baseCost = new Decimal(String(variant.baseCost ?? 0))
    const fallbackPrice = new Decimal(String(variant.listPrice ?? 0))

    let resolvedPrice = fallbackPrice
    let appliedPriceList: string | null = null

    // 1. Account-specific price list
    const account = await this.db.account.findUnique({
      where: { id: accountId },
      select: { priceListId: true },
    })

    if (account?.priceListId) {
      const item = await this.db.priceListItem.findFirst({
        where: {
          priceListId: account.priceListId,
          variantId,
          minQuantity: { lte: qty.toNumber() },
        },
        orderBy: { minQuantity: 'desc' },
        include: { priceList: { select: { name: true } } },
      })
      if (item) {
        resolvedPrice = new Decimal(String(item.price))
        appliedPriceList = item.priceList.name
      }
    }

    // 2. Default price list fallback
    if (!appliedPriceList) {
      const defaultItem = await this.db.priceListItem.findFirst({
        where: {
          priceList: { isDefault: true },
          variantId,
          minQuantity: { lte: qty.toNumber() },
        },
        orderBy: { minQuantity: 'desc' },
        include: { priceList: { select: { name: true } } },
      })
      if (defaultItem) {
        resolvedPrice = new Decimal(String(defaultItem.price))
        appliedPriceList = defaultItem.priceList.name
      }
    }

    // Below-cost check & margin
    const belowCost = baseCost.gt(0) && resolvedPrice.lt(baseCost)
    const margin = baseCost.gt(0)
      ? resolvedPrice.minus(baseCost).div(baseCost).mul(100).toFixed(1)
      : '0.0'

    const discount = fallbackPrice.gt(0) && resolvedPrice.lt(fallbackPrice)
      ? fallbackPrice.minus(resolvedPrice).toFixed(2)
      : '0.00'

    return {
      unitPrice: resolvedPrice.toFixed(2),
      appliedPriceList,
      discount,
      belowCost,
      margin,
    }
  }
}
