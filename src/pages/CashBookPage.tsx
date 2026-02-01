/**
 * Kasa Defteri Modülü
 *
 * - Nakit giriş / çıkış kayıtları
 * - Günlük kasa raporu
 * - Çoklu kasa desteği (TRY, USD, EUR)
 * - Kasa açma / kapama
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, Plus, Search, ArrowUpRight, ArrowDownRight,
  DollarSign, TrendingUp, Calendar, Clock, X, Lock,
  Unlock, Banknote, CreditCard, Loader2,
} from 'lucide-react'
import Pagination from '../components/ui/Pagination'
import ExportButton from '../components/ui/ExportButton'
import { useAuth } from '../contexts/AuthContext'
import { hasIpc, api } from '../lib/ipc'

// ── Types ──────────────────────────────────────────────────

type TransactionType = 'IN' | 'OUT'
type CashCategory = 'COLLECTION' | 'PAYMENT' | 'EXPENSE' | 'SALARY' | 'BANK_DEPOSIT' | 'BANK_WITHDRAW' | 'OTHER'

interface CashTransaction {
  id: string
  date: string
  time: string
  type: TransactionType
  category: CashCategory
  description: string
  accountName?: string
  referenceNo?: string
  amount: number
  currency: string
  createdBy: string
}

interface CashRegister {
  id: string
  name: string
  currency: string
  balance: number
  isOpen: boolean
  openedAt?: string
  openedBy?: string
}

// ── Constants ──────────────────────────────────────────────

const categoryLabels: Record<CashCategory, string> = {
  COLLECTION: 'Tahsilat', PAYMENT: 'Ödeme', EXPENSE: 'Masraf',
  SALARY: 'Maaş', BANK_DEPOSIT: 'Bankaya Yatırma', BANK_WITHDRAW: 'Bankadan Çekme', OTHER: 'Diğer',
}

const categoryColors: Record<CashCategory, string> = {
  COLLECTION: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  PAYMENT: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  EXPENSE: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  SALARY: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  BANK_DEPOSIT: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  BANK_WITHDRAW: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  OTHER: 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
}

// ── Demo Data ──────────────────────────────────────────────

const DEMO_REGISTERS: CashRegister[] = [
  { id: 'r1', name: 'TRY Kasa', currency: 'TRY', balance: 128450, isOpen: true, openedAt: '2026-02-01 09:00', openedBy: 'Ali Kemal Akpinar' },
  { id: 'r2', name: 'USD Kasa', currency: 'USD', balance: 45230, isOpen: true, openedAt: '2026-02-01 09:00', openedBy: 'Ali Kemal Akpinar' },
  { id: 'r3', name: 'EUR Kasa', currency: 'EUR', balance: 12800, isOpen: false },
]

const DEMO_TRANSACTIONS: CashTransaction[] = [
  { id: 't1', date: '2026-02-01', time: '09:15', type: 'IN', category: 'COLLECTION', description: 'HomeStyle Inc. nakit tahsilat', accountName: 'HomeStyle Inc.', referenceNo: 'TAH-001', amount: 15000, currency: 'USD', createdBy: 'Ali Kemal' },
  { id: 't2', date: '2026-02-01', time: '10:30', type: 'OUT', category: 'PAYMENT', description: 'Anatolian Textile hammadde ödemesi', accountName: 'Anatolian Textile Co.', referenceNo: 'ÖDM-001', amount: 85000, currency: 'TRY', createdBy: 'Fatma Özkan' },
  { id: 't3', date: '2026-02-01', time: '11:00', type: 'OUT', category: 'EXPENSE', description: 'Kargo masrafı - DHL Express', amount: 2400, currency: 'USD', createdBy: 'Hasan Demir' },
  { id: 't4', date: '2026-02-01', time: '12:15', type: 'IN', category: 'BANK_WITHDRAW', description: 'İş Bankası USD hesabından çekme', referenceNo: 'BNK-001', amount: 20000, currency: 'USD', createdBy: 'Ali Kemal' },
  { id: 't5', date: '2026-02-01', time: '13:45', type: 'OUT', category: 'BANK_DEPOSIT', description: 'Garanti BBVA TRY hesabına yatırma', referenceNo: 'BNK-002', amount: 50000, currency: 'TRY', createdBy: 'Ali Kemal' },
  { id: 't6', date: '2026-01-31', time: '16:00', type: 'IN', category: 'COLLECTION', description: 'West Coast Carpets nakit ödeme', accountName: 'West Coast Carpets', referenceNo: 'TAH-002', amount: 8500, currency: 'USD', createdBy: 'Zeynep Yıldız' },
  { id: 't7', date: '2026-01-31', time: '14:30', type: 'OUT', category: 'EXPENSE', description: 'Ofis kırtasiye + malzeme', amount: 3200, currency: 'TRY', createdBy: 'Fatma Özkan' },
  { id: 't8', date: '2026-01-31', time: '11:00', type: 'OUT', category: 'SALARY', description: 'Ocak ayı maaş ödemesi - Depo personeli', amount: 45000, currency: 'TRY', createdBy: 'Ali Kemal' },
  { id: 't9', date: '2026-01-31', time: '10:00', type: 'IN', category: 'COLLECTION', description: 'Southern Flooring Co. sipariş avansı', accountName: 'Southern Flooring Co.', referenceNo: 'TAH-003', amount: 12000, currency: 'USD', createdBy: 'Hasan Demir' },
  { id: 't10', date: '2026-01-30', time: '15:30', type: 'OUT', category: 'EXPENSE', description: 'Nakliye ücreti - İstanbul-Kayseri', amount: 8500, currency: 'TRY', createdBy: 'Mehmet Yılmaz' },
  { id: 't11', date: '2026-01-30', time: '09:45', type: 'IN', category: 'OTHER', description: 'Kur farkı düzeltme', amount: 1250, currency: 'USD', createdBy: 'Ali Kemal' },
  { id: 't12', date: '2026-01-29', time: '14:00', type: 'IN', category: 'COLLECTION', description: 'Midwest Distributors bakiye ödemesi', accountName: 'Midwest Distributors', referenceNo: 'TAH-004', amount: 5800, currency: 'USD', createdBy: 'Zeynep Yıldız' },
]

// ── Component ──────────────────────────────────────────────

export default function CashBookPage() {
  const { hasPermission } = useAuth()
  const [activeRegister, setActiveRegister] = useState('r2')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showNewTx, setShowNewTx] = useState(false)
  const [txType, setTxType] = useState<TransactionType>('IN')
  const [txAmount, setTxAmount] = useState('')
  const [txReason, setTxReason] = useState('')
  const [txSaving, setTxSaving] = useState(false)
  const [txError, setTxError] = useState('')

  const handleSaveTx = async () => {
    if (!txAmount || !txReason) { setTxError('Tutar ve açıklama zorunludur.'); return }
    setTxSaving(true); setTxError('')
    try {
      if (hasIpc()) {
        const res = await api.cashTransact({
          cashRegisterId: register.id,
          type: txType,
          amount: txAmount,
          reason: txReason,
        })
        if (res && !res.success) { setTxError(res.error || 'İşlem başarısız'); setTxSaving(false); return }
      }
      setShowNewTx(false); setTxAmount(''); setTxReason(''); setTxType('IN')
    } catch (err: any) { setTxError(err.message || 'Beklenmeyen hata') }
    setTxSaving(false)
  }

  const canEdit = hasPermission('view_accounting')
  const register = DEMO_REGISTERS.find((r) => r.id === activeRegister)!

  const filtered = useMemo(() => {
    return DEMO_TRANSACTIONS.filter((t) => {
      if (t.currency !== register.currency) return false
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false
      if (dateFilter && t.date !== dateFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          t.description.toLowerCase().includes(q) ||
          (t.accountName || '').toLowerCase().includes(q) ||
          (t.referenceNo || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, typeFilter, dateFilter, register.currency])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  // Daily summary
  const todayTx = DEMO_TRANSACTIONS.filter((t) => t.date === '2026-02-01' && t.currency === register.currency)
  const todayIn = todayTx.filter((t) => t.type === 'IN').reduce((s, t) => s + t.amount, 0)
  const todayOut = todayTx.filter((t) => t.type === 'OUT').reduce((s, t) => s + t.amount, 0)

  const currencySymbol = register.currency === 'TRY' ? '₺' : register.currency === 'EUR' ? '€' : '$'

  const exportColumns = [
    { key: 'date', header: 'Tarih' },
    { key: 'time', header: 'Saat' },
    { key: 'type', header: 'Tür', format: (v: TransactionType) => v === 'IN' ? 'Giriş' : 'Çıkış' },
    { key: 'category', header: 'Kategori', format: (v: CashCategory) => categoryLabels[v] },
    { key: 'description', header: 'Açıklama' },
    { key: 'accountName', header: 'Cari' },
    { key: 'amount', header: 'Tutar', format: (v: number) => v.toLocaleString('en-US') },
    { key: 'createdBy', header: 'İşlemi Yapan' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Kasa Defteri</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Nakit giriş/çıkış takibi ve günlük kasa raporu</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={exportColumns} filename={`kasa-${register.currency.toLowerCase()}`} />
          {canEdit && (
            <button
              onClick={() => setShowNewTx(true)}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Kasa İşlemi
            </button>
          )}
        </div>
      </div>

      {/* Register Tabs */}
      <div className="flex gap-3 mb-6">
        {DEMO_REGISTERS.map((r) => (
          <button
            key={r.id}
            onClick={() => { setActiveRegister(r.id); setPage(1) }}
            className={`flex-1 card p-4 transition-all ${
              activeRegister === r.id
                ? 'ring-2 ring-brand-500 border-brand-500'
                : 'hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className={`h-4 w-4 ${activeRegister === r.id ? 'text-brand-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{r.name}</span>
              </div>
              {r.isOpen ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-green-600">
                  <Unlock className="h-3 w-3" /> Açık
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                  <Lock className="h-3 w-3" /> Kapalı
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
              {r.currency === 'TRY' ? '₺' : r.currency === 'EUR' ? '€' : '$'}{r.balance.toLocaleString()}
            </p>
          </button>
        ))}
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <ArrowDownRight className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Bugün Giren</p>
            <p className="text-lg font-bold text-green-600 tabular-nums">{currencySymbol}{todayIn.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <ArrowUpRight className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Bugün Çıkan</p>
            <p className="text-lg font-bold text-red-600 tabular-nums">{currencySymbol}{todayOut.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Günlük Net</p>
            <p className={`text-lg font-bold tabular-nums ${todayIn - todayOut >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {todayIn - todayOut >= 0 ? '+' : ''}{currencySymbol}{(todayIn - todayOut).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Açıklama, cari veya referans ara..."
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1) }}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
        >
          <option value="ALL">Giriş + Çıkış</option>
          <option value="IN">Sadece Giriş</option>
          <option value="OUT">Sadece Çıkış</option>
        </select>
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400"
          >
            <X className="h-3 w-3" /> Tarihi Temizle
          </button>
        )}
      </div>

      {/* Transaction Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tarih / Saat</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Tür</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Kategori</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Açıklama</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cari</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Referans</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Tutar</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">İşlemi Yapan</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Wallet className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Kasa hareketi bulunamadı</p>
                    <p className="text-xs text-gray-400 mt-1">Filtre veya tarih kriterlerini değiştirin</p>
                  </td>
                </tr>
              ) : paginated.map((t) => (
                <tr key={t.id} className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-900 dark:text-white">{t.date}</p>
                    <p className="text-[10px] text-gray-400">{t.time}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {t.type === 'IN' ? (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-green-600">
                        <ArrowDownRight className="h-3.5 w-3.5" /> Giriş
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-red-600">
                        <ArrowUpRight className="h-3.5 w-3.5" /> Çıkış
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${categoryColors[t.category]}`}>
                      {categoryLabels[t.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-900 dark:text-white">{t.description}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.accountName || '—'}</td>
                  <td className="px-4 py-3">
                    {t.referenceNo ? (
                      <span className="font-mono text-[11px] text-brand-600">{t.referenceNo}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold tabular-nums ${t.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'IN' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* New Transaction Modal */}
      <AnimatePresence>
        {showNewTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowNewTx(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-surface-dark-secondary border border-border dark:border-border-dark shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kasa İşlemi</h2>
                <button onClick={() => setShowNewTx(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Type Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setTxType('IN')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      txType === 'IN'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                        : 'border-border dark:border-border-dark text-gray-500 hover:border-green-300'
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4" /> Kasa Giriş
                  </button>
                  <button
                    onClick={() => setTxType('OUT')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      txType === 'OUT'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                        : 'border-border dark:border-border-dark text-gray-500 hover:border-red-300'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" /> Kasa Çıkış
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tutar ({register.currency})</label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Açıklama</label>
                  <textarea
                    rows={2}
                    value={txReason}
                    onChange={(e) => setTxReason(e.target.value)}
                    placeholder="İşlem açıklaması..."
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                  />
                </div>

                {txError && (
                  <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg px-3 py-2">{txError}</p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button onClick={() => { setShowNewTx(false); setTxError('') }} className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  İptal
                </button>
                <button
                  onClick={handleSaveTx}
                  disabled={txSaving}
                  className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors disabled:opacity-50"
                >
                  {txSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
