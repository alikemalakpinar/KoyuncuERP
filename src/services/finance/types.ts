// Decimal-safe types for financial calculations
// All monetary values use string representation to avoid float errors

export interface MoneyAmount {
  value: string // Decimal string e.g. "1234.56"
  currency: string
}

export interface CommissionInput {
  orderId: string
  orderTotal: string
  agencyCommissionRate: string
  staffCommissionRate: string
  agencyId: string
  agencyStaffId?: string
}

export interface CommissionResult {
  agencyCommission: string
  staffCommission: string
  totalCommission: string
}

export interface LandedCostBreakdown {
  purchaseCost: string
  freightCost: string
  customsTax: string
  warehouseCost: string
  insuranceCost: string
  agencyFee: string
  otherCosts: string
  totalCost: string
}

export interface ProfitAnalysis {
  orderId: string
  orderNo: string
  sellingPrice: string
  landedCost: LandedCostBreakdown
  grossProfit: string
  grossMargin: string // percentage
  netProfit: string
  netMargin: string // percentage
}

export interface FxGainLossInput {
  originalAmount: string
  originalRate: string
  currentRate: string
  currency: string
}

export interface FxGainLossResult {
  originalValueLocal: string
  currentValueLocal: string
  gainOrLoss: string // positive = gain, negative = loss
  isGain: boolean
}

export interface AccountHealthMetrics {
  accountId: string
  totalRevenue12m: string
  avgPaymentDays: number
  overdueAmount: string
  riskScore: number // 0-100, 100 = safest
  monthlyRevenue: { month: string; amount: string }[]
}
