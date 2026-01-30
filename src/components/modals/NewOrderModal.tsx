import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

interface OrderLine {
  productName: string
  quantity: string
  unit: string
  unitPrice: string
}

export default function NewOrderModal({ open, onClose }: Props) {
  const [customer, setCustomer] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [lines, setLines] = useState<OrderLine[]>([
    { productName: '', quantity: '', unit: 'm2', unitPrice: '' },
  ])

  const addLine = () =>
    setLines([...lines, { productName: '', quantity: '', unit: 'm2', unitPrice: '' }])

  const removeLine = (idx: number) =>
    setLines(lines.filter((_, i) => i !== idx))

  const updateLine = (idx: number, field: keyof OrderLine, value: string) =>
    setLines(lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)))

  const total = lines.reduce((sum, l) => {
    const q = parseFloat(l.quantity) || 0
    const p = parseFloat(l.unitPrice) || 0
    return sum + q * p
  }, 0)

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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-surface-dark-secondary shadow-glass border border-border dark:border-border-dark overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border dark:border-border-dark px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Yeni Sipariş
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-5">
              {/* Customer & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Müşteri
                  </label>
                  <input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="Cari seçin..."
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Para Birimi
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR</option>
                    <option value="TRY">TRY</option>
                  </select>
                </div>
              </div>

              {/* Order Lines */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
                    Sipariş Kalemleri
                  </label>
                  <button
                    onClick={addLine}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Kalem Ekle
                  </button>
                </div>

                <div className="space-y-2">
                  {lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_80px_70px_100px_32px] gap-2 items-center"
                    >
                      <input
                        value={line.productName}
                        onChange={(e) =>
                          updateLine(idx, 'productName', e.target.value)
                        }
                        placeholder="Ürün adı"
                        className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white placeholder:text-gray-400"
                      />
                      <input
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, 'quantity', e.target.value)
                        }
                        placeholder="Miktar"
                        type="number"
                        className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white placeholder:text-gray-400 tabular-nums"
                      />
                      <select
                        value={line.unit}
                        onChange={(e) => updateLine(idx, 'unit', e.target.value)}
                        className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-2 py-2 text-sm outline-none text-gray-900 dark:text-white"
                      >
                        <option value="m2">m2</option>
                        <option value="adet">Adet</option>
                        <option value="mt">mt</option>
                      </select>
                      <input
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(idx, 'unitPrice', e.target.value)
                        }
                        placeholder="Fiyat"
                        type="number"
                        className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white placeholder:text-gray-400 tabular-nums"
                      />
                      <button
                        onClick={() => removeLine(idx)}
                        disabled={lines.length === 1}
                        className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border dark:border-border-dark px-6 py-4">
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Toplam: </span>
                <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                  {currency === 'USD' ? '$' : currency === 'EUR' ? '\u20AC' : '\u20BA'}
                  {total.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-border dark:border-border-dark px-4 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
                >
                  Iptal
                </button>
                <button className="rounded-xl bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors">
                  Sipariş Oluştur
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
