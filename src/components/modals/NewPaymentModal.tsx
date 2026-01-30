import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle } from 'lucide-react'
import { paymentSchema, formatZodErrors } from '../../lib/validation'
import { useRecordCollection, useRecordPayment, useAccountsQuery } from '../../hooks/useIpc'

interface Props {
  open: boolean
  onClose: () => void
}

export default function NewPaymentModal({ open, onClose }: Props) {
  const { data: accounts = [] } = useAccountsQuery()
  const recordCollection = useRecordCollection()
  const recordPayment = useRecordPayment()

  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [exchangeRate, setExchangeRate] = useState('1.0000')
  const [paymentType, setPaymentType] = useState<'COLLECTION' | 'PAYMENT'>('COLLECTION')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = paymentType === 'COLLECTION' ? recordCollection : recordPayment

  const handleSubmit = () => {
    const data = {
      accountId,
      amount,
      currency,
      exchangeRate,
      description,
    }

    const result = paymentSchema.safeParse(data)
    if (!result.success) {
      setErrors(formatZodErrors(result.error))
      return
    }

    setErrors({})
    mutation.mutate(result.data, {
      onSuccess: (res: any) => {
        if (res.success) {
          resetForm()
          onClose()
        }
      },
    })
  }

  const resetForm = () => {
    setAccountId('')
    setAmount('')
    setCurrency('USD')
    setExchangeRate('1.0000')
    setDescription('')
    setErrors({})
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-surface-dark-secondary shadow-glass border border-border dark:border-border-dark overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border dark:border-border-dark px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Tahsilat / Ödeme
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              {/* Type Toggle */}
              <div className="flex rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-1">
                <button
                  onClick={() => setPaymentType('COLLECTION')}
                  className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors ${
                    paymentType === 'COLLECTION'
                      ? 'bg-white dark:bg-surface-dark shadow-soft text-brand-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Tahsilat
                </button>
                <button
                  onClick={() => setPaymentType('PAYMENT')}
                  className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors ${
                    paymentType === 'PAYMENT'
                      ? 'bg-white dark:bg-surface-dark shadow-soft text-brand-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Ödeme
                </button>
              </div>

              {/* Account */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Cari Hesap
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className={`w-full rounded-xl border ${errors.accountId ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white`}
                >
                  <option value="">Seçiniz...</option>
                  {accounts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.code} – {a.name}
                    </option>
                  ))}
                </select>
                {errors.accountId && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                    <AlertCircle className="h-3 w-3" /> {errors.accountId}
                  </p>
                )}
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Tutar
                  </label>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    className={`w-full rounded-xl border ${errors.amount ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white placeholder:text-gray-400 tabular-nums`}
                  />
                  {errors.amount && (
                    <p className="mt-1 text-[11px] text-red-500">{errors.amount}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Para Birimi
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR</option>
                    <option value="TRY">TRY</option>
                  </select>
                </div>
              </div>

              {/* Exchange Rate */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Kur (1 {currency} = ? TRY)
                </label>
                <input
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  type="number"
                  step="0.0001"
                  className={`w-full rounded-xl border ${errors.exchangeRate ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white tabular-nums`}
                />
                {errors.exchangeRate && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.exchangeRate}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Açıklama
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ödeme açıklaması..."
                  className={`w-full rounded-xl border ${errors.description ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition resize-none text-gray-900 dark:text-white placeholder:text-gray-400`}
                />
                {errors.description && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border dark:border-border-dark px-6 py-4">
              <button
                onClick={onClose}
                className="rounded-xl border border-border dark:border-border-dark px-4 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="rounded-xl bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {mutation.isPending
                  ? 'Kaydediliyor...'
                  : paymentType === 'COLLECTION'
                    ? 'Tahsilat Kaydet'
                    : 'Ödeme Kaydet'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
