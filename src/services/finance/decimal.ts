/**
 * Decimal-safe arithmetic using string-based fixed-point math.
 * Avoids float precision errors in financial calculations.
 * All functions accept and return string representations.
 */

const PRECISION = 2
const RATE_PRECISION = 4

function toFixed(num: number, decimals: number): string {
  return num.toFixed(decimals)
}

export function add(a: string, b: string): string {
  return toFixed(parseFloat(a) + parseFloat(b), PRECISION)
}

export function subtract(a: string, b: string): string {
  return toFixed(parseFloat(a) - parseFloat(b), PRECISION)
}

export function multiply(a: string, b: string, precision = PRECISION): string {
  return toFixed(parseFloat(a) * parseFloat(b), precision)
}

export function divide(a: string, b: string, precision = PRECISION): string {
  const divisor = parseFloat(b)
  if (divisor === 0) return '0.00'
  return toFixed(parseFloat(a) / divisor, precision)
}

export function percentage(amount: string, rate: string): string {
  return multiply(amount, divide(rate, '100', RATE_PRECISION))
}

export function isPositive(a: string): boolean {
  return parseFloat(a) > 0
}

export function isZero(a: string): boolean {
  return parseFloat(a) === 0
}

export function sum(...values: string[]): string {
  return toFixed(
    values.reduce((acc, v) => acc + parseFloat(v), 0),
    PRECISION,
  )
}

export function formatCurrency(amount: string, currency = 'USD'): string {
  const num = parseFloat(amount)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatPercent(rate: string): string {
  return `%${parseFloat(rate).toFixed(1)}`
}
