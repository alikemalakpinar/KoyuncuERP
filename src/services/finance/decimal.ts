/**
 * Decimal-safe arithmetic using decimal.js
 * Eliminates ALL floating-point precision errors in financial calculations.
 * All functions accept and return string representations.
 */

import Decimal from 'decimal.js'

// Configure decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

const PRECISION = 2
const RATE_PRECISION = 4

export function add(a: string, b: string): string {
  return new Decimal(a).plus(new Decimal(b)).toFixed(PRECISION)
}

export function subtract(a: string, b: string): string {
  return new Decimal(a).minus(new Decimal(b)).toFixed(PRECISION)
}

export function multiply(a: string, b: string, precision = PRECISION): string {
  return new Decimal(a).times(new Decimal(b)).toFixed(precision)
}

export function divide(a: string, b: string, precision = PRECISION): string {
  const divisor = new Decimal(b)
  if (divisor.isZero()) return new Decimal(0).toFixed(precision)
  return new Decimal(a).dividedBy(divisor).toFixed(precision)
}

export function percentage(amount: string, rate: string): string {
  return new Decimal(amount).times(new Decimal(rate)).dividedBy(100).toFixed(PRECISION)
}

export function isPositive(a: string): boolean {
  return new Decimal(a).greaterThan(0)
}

export function isZero(a: string): boolean {
  return new Decimal(a).isZero()
}

export function sum(...values: string[]): string {
  return values
    .reduce((acc, v) => acc.plus(new Decimal(v)), new Decimal(0))
    .toFixed(PRECISION)
}

export function abs(a: string): string {
  return new Decimal(a).abs().toFixed(PRECISION)
}

export function isNegative(a: string): boolean {
  return new Decimal(a).lessThan(0)
}

export function formatCurrency(amount: string, currency = 'USD'): string {
  const num = new Decimal(amount).toNumber()
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatPercent(rate: string): string {
  return `%${new Decimal(rate).toFixed(1)}`
}
