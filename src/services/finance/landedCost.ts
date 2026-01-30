/**
 * Landed Cost Calculator
 *
 * Halının TR'den çıkıp ABD'ye varana kadar tüm maliyetlerini toplar.
 * PurchasePrice + Freight + CustomsTax + Warehouse + Insurance + AgencyFee = Total Cost
 * Net Profit = Selling Price - Total Cost
 */

import { add, subtract, divide, multiply, sum } from './decimal'
import type { LandedCostBreakdown, ProfitAnalysis } from './types'

interface LandedCostItem {
  costType: string
  amount: string
  isCancelled: boolean
}

/**
 * Maliyet kalemlerini tipine göre gruplayıp toplam maliyeti hesaplar.
 */
export function calculateLandedCost(items: LandedCostItem[]): LandedCostBreakdown {
  const active = items.filter((i) => !i.isCancelled)

  const byType = (type: string) =>
    active
      .filter((i) => i.costType === type)
      .reduce((acc, i) => add(acc, i.amount), '0.00')

  const purchaseCost = byType('PURCHASE')
  const freightCost = byType('FREIGHT')
  const customsTax = byType('CUSTOMS_TAX')
  const warehouseCost = byType('WAREHOUSE')
  const insuranceCost = byType('INSURANCE')
  const agencyFee = byType('AGENCY_FEE')
  const otherCosts = byType('OTHER')

  const totalCost = sum(
    purchaseCost,
    freightCost,
    customsTax,
    warehouseCost,
    insuranceCost,
    agencyFee,
    otherCosts,
  )

  return {
    purchaseCost,
    freightCost,
    customsTax,
    warehouseCost,
    insuranceCost,
    agencyFee,
    otherCosts,
    totalCost,
  }
}

/**
 * Sipariş bazında kâr analizi.
 * grossProfit = sellingPrice - purchaseCost
 * netProfit = sellingPrice - totalLandedCost
 */
export function calculateProfitAnalysis(
  orderId: string,
  orderNo: string,
  sellingPrice: string,
  costItems: LandedCostItem[],
): ProfitAnalysis {
  const landedCost = calculateLandedCost(costItems)

  const grossProfit = subtract(sellingPrice, landedCost.purchaseCost)
  const grossMargin =
    parseFloat(sellingPrice) > 0
      ? multiply(divide(grossProfit, sellingPrice, 4), '100')
      : '0.00'

  const netProfit = subtract(sellingPrice, landedCost.totalCost)
  const netMargin =
    parseFloat(sellingPrice) > 0
      ? multiply(divide(netProfit, sellingPrice, 4), '100')
      : '0.00'

  return {
    orderId,
    orderNo,
    sellingPrice,
    landedCost,
    grossProfit,
    grossMargin,
    netProfit,
    netMargin,
  }
}
