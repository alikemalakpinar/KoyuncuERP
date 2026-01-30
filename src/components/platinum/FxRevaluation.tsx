/**
 * FX Revaluation Wizard
 *
 * Identifies open foreign-currency invoices and calculates
 * unrealized gain/loss vs current exchange rates.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, RefreshCw, TrendingUp, TrendingDown, CheckCircle,
  AlertTriangle, DollarSign, ArrowRight, Zap,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
}

interface RevalItem {
  invoiceNo: string
  accountName: string
  currency: string
  amount: string
  bookingRate: string
  currentRate: string
  originalLocal: string
  currentLocal: string
  diff: string
  isGain: boolean
}

// Demo data
const demoItems: RevalItem[] = [
  { invoiceNo: 'INV-2026-0089', accountName: 'HomeStyle Inc.', currency: 'USD', amount: '45000.00', bookingRate: '32.4500', currentRate: '33.1200', originalLocal: '1460250.00', currentLocal: '1490400.00', diff: '30150.00', isGain: true },
  { invoiceNo: 'INV-2026-0091', accountName: 'Desert Home Decor', currency: 'USD', amount: '28500.00', bookingRate: '33.2000', currentRate: '33.1200', originalLocal: '946200.00', currentLocal: '943920.00', diff: '-2280.00', isGain: false },
  { invoiceNo: 'INV-2026-0085', accountName: 'Pacific Rugs LLC', currency: 'USD', amount: '52300.00', bookingRate: '31.8800', currentRate: '33.1200', originalLocal: '1667324.00', currentLocal: '1732176.00', diff: '64852.00', isGain: true },
  { invoiceNo: 'INV-2026-0078', accountName: 'Chicago Interiors', currency: 'EUR', amount: '18400.00', bookingRate: '35.1000', currentRate: '35.8500', originalLocal: '645840.00', currentLocal: '659640.00', diff: '13800.00', isGain: true },
  { invoiceNo: 'INV-2026-0093', accountName: 'Manhattan Carpets', currency: 'USD', amount: '33200.00', bookingRate: '33.5000', currentRate: '33.1200', originalLocal: '1112200.00', currentLocal: '1099584.00', diff: '-12616.00', isGain: false },
  { invoiceNo: 'INV-2026-0072', accountName: 'Dallas Décor Hub', currency: 'GBP', amount: '12800.00', bookingRate: '41.2000', currentRate: '42.0500', originalLocal: '527360.00', currentLocal: '538240.00', diff: '10880.00', isGain: true },
]

function fmt(v: string, currency = 'TRY') {
  const num = parseFloat(v)
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(num)
}

function fmtUsd(v: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(parseFloat(v))
}

export default function FxRevaluation({ open, onClose }: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState<'rates' | 'preview' | 'posted'>('rates')
  const [rates, setRates] = useState({ USD: '33.12', EUR: '35.85', GBP: '42.05' })
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(demoItems.map(i => i.invoiceNo)))

  const summary = useMemo(() => {
    const selected = demoItems.filter(i => selectedItems.has(i.invoiceNo))
    const gains = selected.filter(i => i.isGain).reduce((s, i) => s + parseFloat(i.diff), 0)
    const losses = selected.filter(i => !i.isGain).reduce((s, i) => s + Math.abs(parseFloat(i.diff)), 0)
    return {
      totalGain: gains.toFixed(2),
      totalLoss: losses.toFixed(2),
      net: (gains - losses).toFixed(2),
      isNetGain: gains >= losses,
      count: selected.length,
    }
  }, [selectedItems])

  const toggleItem = (invoiceNo: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(invoiceNo)) next.delete(invoiceNo)
      else next.add(invoiceNo)
      return next
    })
  }

  const handlePost = () => {
    // In production: call window.api.finance.postFxRevaluation(...)
    setStep('posted')
  }

  const handleClose = () => {
    setStep('rates')
    setSelectedItems(new Set(demoItems.map(i => i.invoiceNo)))
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[85vh] rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 dark:border-border-dark/50 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                <RefreshCw className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Kur Farkı Değerleme</h2>
                <p className="text-xs text-gray-500">Açık dövizli faturaların kur farkı analizi</p>
              </div>
            </div>
            <button onClick={handleClose} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {step === 'posted' ? (
              <div className="text-center py-10 space-y-3">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Değerleme Kayıtları Oluşturuldu</h3>
                <p className="text-sm text-gray-500">
                  {summary.count} fatura için kur farkı kayıtları yevmiye defterine işlendi.
                </p>
                <div className="inline-flex items-center gap-4 mt-2">
                  <span className="text-sm text-green-600 font-medium">Kâr: {fmt(summary.totalGain)}</span>
                  <span className="text-sm text-red-600 font-medium">Zarar: {fmt(summary.totalLoss)}</span>
                  <span className={`text-sm font-bold ${summary.isNetGain ? 'text-green-700' : 'text-red-700'}`}>
                    Net: {fmt(summary.net)}
                  </span>
                </div>
                <button onClick={handleClose} className="mt-4 rounded-xl bg-brand-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-brand-700 transition-colors">
                  Kapat
                </button>
              </div>
            ) : step === 'rates' ? (
              <>
                {/* Current Rates Input */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Güncel Kur Bilgisi</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(rates).map(([currency, rate]) => (
                      <div key={currency} className="rounded-xl border border-border dark:border-border-dark p-3">
                        <label className="text-xs text-gray-500 mb-1 block">{currency}/TRY</label>
                        <input
                          type="text"
                          value={rate}
                          onChange={e => setRates(prev => ({ ...prev, [currency]: e.target.value }))}
                          className="w-full rounded-lg border border-border dark:border-border-dark bg-surface-secondary/30 dark:bg-surface-dark-secondary/30 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-3">
                  <div className="flex gap-2">
                    <Zap className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Güncel kurları girdikten sonra sistem tüm açık dövizli faturaları tarayarak kur farkını hesaplayacaktır.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setStep('preview')}
                  className="w-full rounded-xl bg-indigo-600 text-white py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Değerlemeyi Hesapla
                </button>
              </>
            ) : (
              <>
                {/* Summary Strip */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-3 text-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Kur Kârı</p>
                    <p className="text-lg font-bold text-green-600">{fmt(summary.totalGain)}</p>
                  </div>
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-3 text-center">
                    <TrendingDown className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Kur Zararı</p>
                    <p className="text-lg font-bold text-red-600">{fmt(summary.totalLoss)}</p>
                  </div>
                  <div className={`rounded-xl border p-3 text-center ${summary.isNetGain ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800'}`}>
                    <DollarSign className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Net</p>
                    <p className={`text-lg font-bold ${summary.isNetGain ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(summary.net)}</p>
                  </div>
                </div>

                {/* Detail Table */}
                <div className="rounded-xl border border-border dark:border-border-dark overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50 dark:border-border-dark/50 bg-surface-secondary/30 dark:bg-surface-dark-secondary/30">
                        <th className="px-3 py-2.5 text-left w-8">
                          <input
                            type="checkbox"
                            checked={selectedItems.size === demoItems.length}
                            onChange={() => {
                              if (selectedItems.size === demoItems.length) setSelectedItems(new Set())
                              else setSelectedItems(new Set(demoItems.map(i => i.invoiceNo)))
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-gray-500">Fatura</th>
                        <th className="px-3 py-2.5 text-left font-medium text-gray-500">Cari</th>
                        <th className="px-3 py-2.5 text-right font-medium text-gray-500">Tutar</th>
                        <th className="px-3 py-2.5 text-center font-medium text-gray-500">Defter Kuru</th>
                        <th className="px-3 py-2.5 text-center font-medium text-gray-500"><ArrowRight className="h-3 w-3 inline" /></th>
                        <th className="px-3 py-2.5 text-center font-medium text-gray-500">Güncel Kur</th>
                        <th className="px-3 py-2.5 text-right font-medium text-gray-500">Kur Farkı (₺)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
                      {demoItems.map(item => (
                        <tr key={item.invoiceNo} className={`hover:bg-surface-secondary/20 transition-colors ${!selectedItems.has(item.invoiceNo) ? 'opacity-40' : ''}`}>
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.invoiceNo)}
                              onChange={() => toggleItem(item.invoiceNo)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-3 py-2.5 font-mono text-gray-600 dark:text-gray-300">{item.invoiceNo}</td>
                          <td className="px-3 py-2.5 text-gray-900 dark:text-white">{item.accountName}</td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            <span className="text-gray-500">{item.currency}</span> {parseFloat(item.amount).toLocaleString('en-US')}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-gray-500">{item.bookingRate}</td>
                          <td className="px-3 py-2.5 text-center text-gray-300"><ArrowRight className="h-3 w-3 inline" /></td>
                          <td className="px-3 py-2.5 text-center font-mono text-indigo-600 font-medium">{item.currentRate}</td>
                          <td className={`px-3 py-2.5 text-right font-mono font-medium ${item.isGain ? 'text-green-600' : 'text-red-600'}`}>
                            {item.isGain ? '+' : ''}{fmt(item.diff)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Warning */}
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Seçilen {summary.count} fatura için yevmiye defterine kur farkı kayıtları oluşturulacaktır. Bu işlem gerçekleşmemiş kur farkını muhasebeleştirir.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('rates')}
                    className="flex-1 rounded-xl border border-border dark:border-border-dark py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-surface-secondary transition-colors"
                  >
                    Geri
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={summary.count === 0}
                    className="flex-1 rounded-xl bg-indigo-600 text-white py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    {summary.count} Kayıt Oluştur
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
