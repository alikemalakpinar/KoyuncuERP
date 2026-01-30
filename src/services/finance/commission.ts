/**
 * Commission Calculation Service
 *
 * Sipariş DELIVERED olduğunda acente komisyonunu hesaplar ve
 * Ledger tablosuna "Alacak" olarak kaydedilecek veriyi üretir.
 */

import { percentage, subtract } from './decimal'
import type { CommissionInput, CommissionResult } from './types'

/**
 * Acente ve personel komisyonlarını hesaplar.
 * Tüm hesaplamalar Decimal string ile yapılır, float hatası olmaz.
 */
export function calculateCommission(input: CommissionInput): CommissionResult {
  const agencyCommission = percentage(input.orderTotal, input.agencyCommissionRate)
  const staffCommission = input.agencyStaffId
    ? percentage(input.orderTotal, input.staffCommissionRate)
    : '0.00'

  // Personel komisyonu, acente komisyonunun içinden kesilir
  const netAgencyCommission = subtract(agencyCommission, staffCommission)

  return {
    agencyCommission: netAgencyCommission,
    staffCommission,
    totalCommission: agencyCommission,
  }
}

/**
 * Komisyon kaydı için Ledger entry verisini oluşturur.
 * Movement-First: Her komisyon bir defter kaydı üretir.
 */
export function buildCommissionLedgerEntry(
  orderId: string,
  orderNo: string,
  accountId: string,
  commissionAmount: string,
  currency: string,
  exchangeRate: string,
) {
  return {
    type: 'COMMISSION' as const,
    debit: '0.00',
    credit: commissionAmount,
    currency,
    exchangeRate,
    costCenter: 'AGENCY_COMMISSION',
    description: `Acente komisyonu – Sipariş ${orderNo}`,
    referenceId: orderId,
    referenceType: 'ORDER',
    isCancelled: false,
    accountId,
  }
}
