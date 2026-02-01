/**
 * Pricing Service – Multi-Price List & Campaign Engine
 *
 * Handles:
 * - Price list management (CRUD)
 * - Customer-specific pricing resolution
 * - Tiered pricing (quantity breaks)
 * - Margin guard (below-cost warning)
 * - Fallback to variant listPrice
 */

import type { PrismaClient } from '@prisma/client'

type DbClient = PrismaClient

// ── Types ──────────────────────────────────────────────────

export interface PriceResolution {
  variantId: string
  sku: string
  resolvedPrice: string
  source: 'PRICE_LIST' | 'TIERED' | 'FALLBACK'
  priceListName?: string
  baseCost: string
  belowCost: boolean
  marginPercent: string
}

export interface PriceListCreateInput {
  name: string
  currency: string
  isDefault?: boolean
}

export interface PriceListItemInput {
  priceListId: string
  variantId: string
  price: string
  minQuantity?: string
}

// ── Service ────────────────────────────────────────────────

export class PricingService {
  constructor(private db: DbClient) {}

  /**
   * Resolve the best price for a variant given a customer account.
   *
   * Priority:
   * 1. Customer's assigned PriceList → tiered by minQuantity DESC
   * 2. Default PriceList (isDefault = true)
   * 3. Fallback: ProductVariant.listPrice
   */
  async resolvePrice(
    accountId: string,
    variantId: string,
    quantity: string = '1',
  ): Promise<PriceResolution> {
    const qty = parseFloat(quantity)

    // Get variant base info
    const variant = await this.db.productVariant.findUnique({
      where: { id: variantId },
    })

    if (!variant) {
      return {
        variantId,
        sku: '',
        resolvedPrice: '0.00',
        source: 'FALLBACK',
        baseCost: '0.00',
        belowCost: false,
        marginPercent: '0.0',
      }
    }

    const baseCost = parseFloat(String(variant.baseCost))
    const fallbackPrice = parseFloat(String(variant.listPrice))

    // Get customer's price list
    const account = await this.db.account.findUnique({
      where: { id: accountId },
      select: { priceListId: true },
    })

    let resolvedPrice = fallbackPrice
    let source: PriceResolution['source'] = 'FALLBACK'
    let priceListName: string | undefined

    if (account?.priceListId) {
      // Look up tiered pricing: best match where minQuantity <= qty
      const items = await this.db.priceListItem.findMany({
        where: {
          priceListId: account.priceListId,
          variantId,
          minQuantity: { lte: qty },
        },
        orderBy: { minQuantity: 'desc' },
        take: 1,
        include: { priceList: { select: { name: true } } },
      })

      if (items.length > 0) {
        resolvedPrice = parseFloat(String(items[0].price))
        priceListName = items[0].priceList.name
        source = qty > 1 && parseFloat(String(items[0].minQuantity)) > 1
          ? 'TIERED'
          : 'PRICE_LIST'
      }
    }

    // If no customer list, try default list
    if (source === 'FALLBACK') {
      const defaultItems = await this.db.priceListItem.findMany({
        where: {
          variantId,
          minQuantity: { lte: qty },
          priceList: { isDefault: true, isActive: true },
        },
        orderBy: { minQuantity: 'desc' },
        take: 1,
        include: { priceList: { select: { name: true } } },
      })

      if (defaultItems.length > 0) {
        resolvedPrice = parseFloat(String(defaultItems[0].price))
        priceListName = defaultItems[0].priceList.name
        source = 'PRICE_LIST'
      }
    }

    const belowCost = resolvedPrice < baseCost
    const margin = baseCost > 0
      ? (((resolvedPrice - baseCost) / baseCost) * 100).toFixed(1)
      : '0.0'

    return {
      variantId,
      sku: variant.sku,
      resolvedPrice: resolvedPrice.toFixed(2),
      source,
      priceListName,
      baseCost: baseCost.toFixed(2),
      belowCost,
      marginPercent: margin,
    }
  }

  /**
   * Resolve prices for multiple variants at once (batch).
   */
  async resolvePrices(
    accountId: string,
    variants: { variantId: string; quantity: string }[],
  ): Promise<PriceResolution[]> {
    const results: PriceResolution[] = []
    for (const v of variants) {
      results.push(await this.resolvePrice(accountId, v.variantId, v.quantity))
    }
    return results
  }

  // ── CRUD ─────────────────────────────────────────────────

  async listPriceLists() {
    return this.db.priceList.findMany({
      where: { isActive: true },
      include: { _count: { select: { items: true, accounts: true } } },
      orderBy: { name: 'asc' },
    })
  }

  async createPriceList(input: PriceListCreateInput) {
    return this.db.priceList.create({
      data: {
        name: input.name,
        currency: input.currency,
        isDefault: input.isDefault ?? false,
      },
    })
  }

  async addPriceListItem(input: PriceListItemInput) {
    return this.db.priceListItem.upsert({
      where: {
        priceListId_variantId_minQuantity: {
          priceListId: input.priceListId,
          variantId: input.variantId,
          minQuantity: parseFloat(input.minQuantity ?? '1'),
        },
      },
      update: { price: input.price },
      create: {
        priceListId: input.priceListId,
        variantId: input.variantId,
        price: input.price,
        minQuantity: input.minQuantity ?? '1',
      },
    })
  }

  async assignPriceListToAccount(accountId: string, priceListId: string) {
    return this.db.account.update({
      where: { id: accountId },
      data: { priceListId },
    })
  }
}
