/**
 * Zod Validation Schemas
 *
 * Strict validation for all forms. Financial fields use string
 * representation (Decimal-safe). No direct float input allowed.
 */

import { z } from 'zod'

// ── Shared ─────────────────────────────────────────────────

const decimalString = z
  .string()
  .regex(/^\d+(\.\d{1,4})?$/, 'Geçerli bir sayı giriniz (ör: 1234.56)')

const positiveDecimal = decimalString.refine(
  (v) => parseFloat(v) > 0,
  'Tutar sıfırdan büyük olmalıdır',
)

const currencyCode = z.enum(['USD', 'EUR', 'TRY', 'GBP'])

// ── Account ────────────────────────────────────────────────

export const accountCreateSchema = z.object({
  code: z
    .string()
    .min(2, 'Kod en az 2 karakter olmalıdır')
    .max(20, 'Kod en fazla 20 karakter olabilir')
    .regex(/^[A-Z0-9-]+$/, 'Kod yalnızca büyük harf, rakam ve tire içerebilir'),
  name: z
    .string()
    .min(2, 'İsim en az 2 karakter olmalıdır')
    .max(200, 'İsim en fazla 200 karakter olabilir'),
  type: z.enum(['CUSTOMER', 'SUPPLIER', 'BOTH', 'AGENCY']),
  taxId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().length(2, 'Ülke kodu 2 harf olmalıdır').default('TR'),
  currency: currencyCode.default('USD'),
  riskLimit: decimalString.default('0'),
  paymentTermDays: z.number().int().min(0).max(365).default(30),
  parentAccountId: z.string().optional(),
})

export type AccountCreateInput = z.infer<typeof accountCreateSchema>

// ── Order ──────────────────────────────────────────────────

export const orderItemSchema = z.object({
  productName: z.string().min(1, 'Ürün adı zorunludur'),
  productGroup: z.string().optional(),
  sku: z.string().optional(),
  quantity: positiveDecimal,
  unit: z.enum(['m2', 'adet', 'mt', 'kg']).default('m2'),
  unitPrice: positiveDecimal,
  purchasePrice: decimalString.optional(),
})

export const orderCreateSchema = z.object({
  accountId: z.string().min(1, 'Müşteri seçimi zorunludur'),
  currency: currencyCode.default('USD'),
  vatRate: decimalString.default('0'),
  agencyStaffId: z.string().optional(),
  agencyCommissionRate: decimalString.default('0'),
  staffCommissionRate: decimalString.default('0'),
  exchangeRate: positiveDecimal,
  notes: z.string().optional(),
  items: z
    .array(orderItemSchema)
    .min(1, 'En az bir sipariş kalemi gereklidir'),
})

export type OrderCreateInput = z.infer<typeof orderCreateSchema>

// ── Payment / Collection ───────────────────────────────────

export const paymentSchema = z.object({
  accountId: z.string().min(1, 'Cari hesap seçimi zorunludur'),
  amount: positiveDecimal,
  currency: currencyCode,
  exchangeRate: positiveDecimal,
  description: z.string().min(1, 'Açıklama zorunludur'),
  referenceId: z.string().optional(),
})

export type PaymentInput = z.infer<typeof paymentSchema>

// ── Helper: format Zod errors ──────────────────────────────

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!result[path]) {
      result[path] = issue.message
    }
  }
  return result
}
