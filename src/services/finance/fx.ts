/**
 * FX (Foreign Exchange) Gain/Loss Calculation
 *
 * Sipariş tarihindeki kur ile tahsilat tarihindeki kur farkını hesaplar.
 * Sonuç otomatik olarak Ledger'a FX_GAIN_LOSS kaydı olarak işlenir.
 */

import { multiply, subtract, isPositive } from './decimal'
import type { FxGainLossInput, FxGainLossResult } from './types'

/**
 * Kur farkı hesaplaması.
 * originalRate: sipariş anındaki kur
 * currentRate: tahsilat/kapanış anındaki kur
 */
export function calculateFxGainLoss(input: FxGainLossInput): FxGainLossResult {
  const originalValueLocal = multiply(input.originalAmount, input.originalRate)
  const currentValueLocal = multiply(input.originalAmount, input.currentRate)
  const gainOrLoss = subtract(currentValueLocal, originalValueLocal)

  return {
    originalValueLocal,
    currentValueLocal,
    gainOrLoss,
    isGain: isPositive(gainOrLoss),
  }
}

/**
 * Kur farkı için Ledger entry verisi oluşturur.
 */
export function buildFxLedgerEntry(
  accountId: string,
  gainOrLoss: string,
  isGain: boolean,
  currency: string,
  exchangeRate: string,
  referenceId: string,
) {
  return {
    type: 'FX_GAIN_LOSS' as const,
    // Kur kazancı → credit (gelir), kur kaybı → debit (gider)
    debit: isGain ? '0.00' : gainOrLoss.replace('-', ''),
    credit: isGain ? gainOrLoss : '0.00',
    currency,
    exchangeRate,
    costCenter: 'FX_GAIN_LOSS',
    description: `Kur farkı ${isGain ? 'kazancı' : 'kaybı'} – ${currency}`,
    referenceId,
    referenceType: 'COLLECTION',
    isCancelled: false,
    accountId,
  }
}
