import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, AlertCircle, Search, AlertTriangle } from 'lucide-react'
import { orderCreateSchema, formatZodErrors } from '../../lib/validation'
import { useCreateOrder, useAccountsQuery } from '../../hooks/useIpc'
import ProductPicker from '../ProductPicker'
import { useToast } from '../Toast'

interface Props {
  open: boolean
  onClose: () => void
}

interface OrderLine {
  variantId?: string
  productName: string
  sku: string
  quantity: string
  unit: string
  unitPrice: string
  purchasePrice: string
  belowCost: boolean
}

const emptyLine: OrderLine = {
  productName: '',
  sku: '',
  quantity: '',
  unit: 'm2',
  unitPrice: '',
  purchasePrice: '',
  belowCost: false,
}

export default function NewOrderModal({ open, onClose }: Props) {
  const { data: accounts = [] } = useAccountsQuery({ type: 'CUSTOMER' })
  const createOrder = useCreateOrder()
  const { toast } = useToast()

  const [accountId, setAccountId] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [vatRate, setVatRate] = useState('0')
  const [exchangeRate, setExchangeRate] = useState('1.0000')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([{ ...emptyLine }])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerLineIdx, setPickerLineIdx] = useState<number>(0)

  const addLine = () => setLines([...lines, { ...emptyLine }])
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx))
  const updateLine = (idx: number, field: keyof OrderLine, value: string) => {
    setLines(lines.map((l, i) => {
      if (i !== idx) return l
      const updated = { ...l, [field]: value }
      // Check below cost
      if (field === 'unitPrice' && updated.purchasePrice) {
        updated.belowCost = parseFloat(value || '0') < parseFloat(updated.purchasePrice || '0')
      }
      return updated
    }))
  }

  const openPicker = (idx: number) => {
    setPickerLineIdx(idx)
    setPickerOpen(true)
  }

  const handleProductSelect = (item: any) => {
    setLines(lines.map((l, i) => {
      if (i !== pickerLineIdx) return l
      const belowCost = parseFloat(item.unitPrice || '0') < parseFloat(item.baseCost || '0')
      return {
        ...l,
        variantId: item.variantId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        purchasePrice: item.baseCost,
        unit: item.unit,
        belowCost,
      }
    }))
  }

  const total = lines.reduce((sum, l) => {
    const q = parseFloat(l.quantity) || 0
    const p = parseFloat(l.unitPrice) || 0
    return sum + q * p
  }, 0)

  const handleSubmit = () => {
    const data = {
      accountId,
      currency,
      vatRate,
      exchangeRate,
      notes: notes || undefined,
      items: lines.map((l) => ({
        productName: l.productName,
        sku: l.sku || undefined,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        purchasePrice: l.purchasePrice || undefined,
      })),
    }

    const result = orderCreateSchema.safeParse(data)
    if (!result.success) {
      setErrors(formatZodErrors(result.error))
      return
    }

    setErrors({})
    createOrder.mutate(result.data, {
      onSuccess: (res) => {
        if (res.success) {
          toast('success', 'Sipariş başarıyla oluşturuldu')
          resetForm()
          onClose()
        } else {
          toast('error', res.error || 'Sipariş oluşturulamadı')
        }
      },
    })
  }

  const resetForm = () => {
    setAccountId('')
    setCurrency('USD')
    setVatRate('0')
    setExchangeRate('1.0000')
    setNotes('')
    setLines([{ ...emptyLine }])
    setErrors({})
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-4 z-50 flex flex-col rounded-2xl bg-white dark:bg-surface-dark shadow-glass border border-border dark:border-border-dark overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border dark:border-border-dark px-6 py-4 shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Yeni Sipariş Oluştur
                  </h2>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400">
                    Ürün seçerek sipariş kalemleri ekleyin
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Customer & Currency Row */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Müşteri
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className={`w-full rounded-xl border ${errors.accountId ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white`}
                    >
                      <option value="">Seçiniz...</option>
                      {accounts
                        .filter((a: any) => a.type === 'CUSTOMER' || a.type === 'BOTH')
                        .map((a: any) => (
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
                  <div>
                    <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Para Birimi
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Kur (1 {currency} = ? TRY)
                    </label>
                    <input
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      type="number"
                      step="0.0001"
                      className={`w-full rounded-xl border ${errors.exchangeRate ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums`}
                    />
                    {errors.exchangeRate && (
                      <p className="mt-1 text-[11px] text-red-500">{errors.exchangeRate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      KDV (%)
                    </label>
                    <input
                      value={vatRate}
                      onChange={(e) => setVatRate(e.target.value)}
                      type="number"
                      step="1"
                      className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums"
                    />
                  </div>
                </div>

                {/* Order Lines */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[13px] font-semibold text-gray-900 dark:text-white">
                      Sipariş Kalemleri
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPicker(lines.length)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                      >
                        <Search className="h-3 w-3" />
                        Ürün Seç
                      </button>
                      <button
                        onClick={addLine}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-gray-600 dark:text-gray-400 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Boş Satır
                      </button>
                    </div>
                  </div>
                  {errors.items && (
                    <p className="mb-2 flex items-center gap-1 text-[11px] text-red-500">
                      <AlertCircle className="h-3 w-3" /> {errors.items}
                    </p>
                  )}

                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_100px_70px_60px_90px_90px_32px] gap-2 px-1 mb-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    <span>Ürün</span>
                    <span>SKU</span>
                    <span>Miktar</span>
                    <span>Birim</span>
                    <span>Birim Fiyat</span>
                    <span>Alış Fiyat</span>
                    <span />
                  </div>

                  <div className="space-y-2">
                    {lines.map((line, idx) => (
                      <div key={idx}>
                        <div className="grid grid-cols-[1fr_100px_70px_60px_90px_90px_32px] gap-2 items-center">
                          <div className="relative">
                            <input
                              value={line.productName}
                              onChange={(e) => updateLine(idx, 'productName', e.target.value)}
                              placeholder="Ürün adı (veya seçin →)"
                              className={`w-full rounded-xl border ${errors[`items.${idx}.productName`] ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white placeholder:text-gray-400`}
                            />
                            <button
                              onClick={() => openPicker(idx)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                            >
                              <Search className="h-3.5 w-3.5 text-gray-400" />
                            </button>
                          </div>
                          <input
                            value={line.sku}
                            readOnly
                            placeholder="—"
                            className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50 px-2 py-2 text-[12px] font-mono text-gray-500 outline-none"
                          />
                          <input
                            value={line.quantity}
                            onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                            placeholder="0"
                            type="number"
                            className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-2 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums"
                          />
                          <select
                            value={line.unit}
                            onChange={(e) => updateLine(idx, 'unit', e.target.value)}
                            className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-1 py-2 text-sm outline-none text-gray-900 dark:text-white"
                          >
                            <option value="m2">m2</option>
                            <option value="adet">Adet</option>
                            <option value="mt">mt</option>
                          </select>
                          <input
                            value={line.unitPrice}
                            onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)}
                            placeholder="0.00"
                            type="number"
                            className={`rounded-xl border ${line.belowCost ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/10' : 'border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary'} px-2 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums`}
                          />
                          <input
                            value={line.purchasePrice}
                            onChange={(e) => updateLine(idx, 'purchasePrice', e.target.value)}
                            placeholder="0.00"
                            type="number"
                            className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-2 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums"
                          />
                          <button
                            onClick={() => removeLine(idx)}
                            disabled={lines.length === 1}
                            className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {line.belowCost && (
                          <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            Birim fiyat maliyet altında (Alış: ${line.purchasePrice})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Notlar
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Sipariş notu (opsiyonel)..."
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition resize-none text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border dark:border-border-dark px-6 py-4 shrink-0 bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Toplam: </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                    ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="ml-2 text-[12px] text-gray-400">
                    {lines.filter((l) => l.productName).length} kalem
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="rounded-xl border border-border dark:border-border-dark px-5 py-2.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={createOrder.isPending}
                    className="rounded-xl bg-brand-600 px-6 py-2.5 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {createOrder.isPending ? 'Kaydediliyor...' : 'Sipariş Oluştur'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleProductSelect}
      />
    </>
  )
}
