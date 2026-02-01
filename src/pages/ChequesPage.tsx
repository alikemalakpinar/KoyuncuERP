/**
 * Çek / Senet Takip Modülü
 *
 * - Alınan / Verilen Çekler ve Senetler
 * - Vade takibi & hatırlatma
 * - Ciro / Tahsilat / İade işlemleri
 * - Vade takvimi görünümü
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileCheck, Plus, Search, Calendar, AlertTriangle, CheckCircle, Clock,
  ArrowRightLeft, Banknote, X, Building2, User, Hash,
  ChevronDown, RotateCcw, Send, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import Pagination from '../components/ui/Pagination'
import ExportButton from '../components/ui/ExportButton'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useAuth } from '../contexts/AuthContext'

// ── Types ──────────────────────────────────────────────────

type InstrumentType = 'CHEQUE' | 'PROMISSORY_NOTE'
type Direction = 'RECEIVED' | 'GIVEN'
type ChequeStatus = 'PORTFOLIO' | 'DEPOSITED' | 'ENDORSED' | 'COLLECTED' | 'BOUNCED' | 'RETURNED' | 'PAID' | 'OVERDUE'

interface Cheque {
  id: string
  type: InstrumentType
  direction: Direction
  serialNo: string
  accountId: string
  accountName: string
  bankName: string
  branchName: string
  amount: number
  currency: string
  issueDate: string
  dueDate: string
  status: ChequeStatus
  endorsedTo?: string
  notes?: string
}

// ── Constants ──────────────────────────────────────────────

const typeLabels: Record<InstrumentType, string> = { CHEQUE: 'Çek', PROMISSORY_NOTE: 'Senet' }
const directionLabels: Record<Direction, string> = { RECEIVED: 'Alınan', GIVEN: 'Verilen' }
const statusLabels: Record<ChequeStatus, string> = {
  PORTFOLIO: 'Portföyde', DEPOSITED: 'Bankada', ENDORSED: 'Ciro Edildi',
  COLLECTED: 'Tahsil Edildi', BOUNCED: 'Karşılıksız', RETURNED: 'İade Edildi',
  PAID: 'Ödendi', OVERDUE: 'Vadesi Geçmiş',
}
const statusColors: Record<ChequeStatus, string> = {
  PORTFOLIO: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  DEPOSITED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  ENDORSED: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  COLLECTED: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  BOUNCED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  RETURNED: 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
  PAID: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  OVERDUE: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
}

const directionBadge: Record<Direction, string> = {
  RECEIVED: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  GIVEN: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
}

// ── Demo Data ──────────────────────────────────────────────

const today = new Date()
const fmt = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

const DEMO_CHEQUES: Cheque[] = [
  { id: 'ch1', type: 'CHEQUE', direction: 'RECEIVED', serialNo: 'ÇK-2026-001', accountId: 'a1', accountName: 'HomeStyle Inc.', bankName: 'İş Bankası', branchName: 'Beyoğlu', amount: 45000, currency: 'USD', issueDate: '2026-01-05', dueDate: fmt(addDays(today, 15)), status: 'PORTFOLIO' },
  { id: 'ch2', type: 'CHEQUE', direction: 'RECEIVED', serialNo: 'ÇK-2026-002', accountId: 'a2', accountName: 'West Coast Carpets', bankName: 'Garanti BBVA', branchName: 'Şişli', amount: 78500, currency: 'USD', issueDate: '2026-01-10', dueDate: fmt(addDays(today, 30)), status: 'DEPOSITED' },
  { id: 'ch3', type: 'CHEQUE', direction: 'GIVEN', serialNo: 'ÇK-2026-003', accountId: 'a3', accountName: 'Anatolian Textile Co.', bankName: 'Yapı Kredi', branchName: 'Kadıköy', amount: 32000, currency: 'TRY', issueDate: '2026-01-08', dueDate: fmt(addDays(today, 7)), status: 'PAID' },
  { id: 'ch4', type: 'PROMISSORY_NOTE', direction: 'RECEIVED', serialNo: 'SN-2026-001', accountId: 'a4', accountName: 'Southern Flooring Co.', bankName: '—', branchName: '—', amount: 125000, currency: 'USD', issueDate: '2025-12-20', dueDate: fmt(addDays(today, 45)), status: 'PORTFOLIO' },
  { id: 'ch5', type: 'CHEQUE', direction: 'RECEIVED', serialNo: 'ÇK-2026-004', accountId: 'a2', accountName: 'West Coast Carpets', bankName: 'Ziraat Bankası', branchName: 'Merkez', amount: 56200, currency: 'USD', issueDate: '2025-11-15', dueDate: fmt(addDays(today, -5)), status: 'OVERDUE' },
  { id: 'ch6', type: 'PROMISSORY_NOTE', direction: 'GIVEN', serialNo: 'SN-2026-002', accountId: 'a5', accountName: 'İpek İplik A.Ş.', bankName: '—', branchName: '—', amount: 88000, currency: 'TRY', issueDate: '2026-01-02', dueDate: fmt(addDays(today, 60)), status: 'PORTFOLIO' },
  { id: 'ch7', type: 'CHEQUE', direction: 'RECEIVED', serialNo: 'ÇK-2026-005', accountId: 'a1', accountName: 'HomeStyle Inc.', bankName: 'Akbank', branchName: 'Levent', amount: 34800, currency: 'USD', issueDate: '2025-12-01', dueDate: '2026-01-15', status: 'COLLECTED' },
  { id: 'ch8', type: 'CHEQUE', direction: 'RECEIVED', serialNo: 'ÇK-2026-006', accountId: 'a6', accountName: 'Midwest Distributors', bankName: 'Halkbank', branchName: 'Ankara', amount: 22500, currency: 'USD', issueDate: '2026-01-12', dueDate: fmt(addDays(today, -2)), status: 'BOUNCED', notes: 'Karşılıksız - müşteriye bildirildi' },
  { id: 'ch9', type: 'CHEQUE', direction: 'RECEIVED', serialNo: 'ÇK-2026-007', accountId: 'a4', accountName: 'Southern Flooring Co.', bankName: 'İş Bankası', branchName: 'Taksim', amount: 67000, currency: 'USD', issueDate: '2026-01-15', dueDate: fmt(addDays(today, 20)), status: 'ENDORSED', endorsedTo: 'Anatolian Textile Co.' },
  { id: 'ch10', type: 'PROMISSORY_NOTE', direction: 'RECEIVED', serialNo: 'SN-2026-003', accountId: 'a1', accountName: 'HomeStyle Inc.', bankName: '—', branchName: '—', amount: 95000, currency: 'USD', issueDate: '2026-01-18', dueDate: fmt(addDays(today, 90)), status: 'PORTFOLIO' },
]

// ── Component ──────────────────────────────────────────────

export default function ChequesPage() {
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | InstrumentType>('ALL')
  const [dirFilter, setDirFilter] = useState<'ALL' | Direction>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ChequeStatus>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string } | null>(null)

  const canEdit = hasPermission('view_accounting')

  const filtered = useMemo(() => {
    return DEMO_CHEQUES.filter((c) => {
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false
      if (dirFilter !== 'ALL' && c.direction !== dirFilter) return false
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          c.serialNo.toLowerCase().includes(q) ||
          c.accountName.toLowerCase().includes(q) ||
          c.bankName.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, typeFilter, dirFilter, statusFilter])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  // KPI calculations
  const receivedInPortfolio = DEMO_CHEQUES.filter((c) => c.direction === 'RECEIVED' && ['PORTFOLIO', 'DEPOSITED'].includes(c.status))
  const totalPortfolio = receivedInPortfolio.reduce((s, c) => s + c.amount, 0)
  const overdue = DEMO_CHEQUES.filter((c) => c.status === 'OVERDUE' || c.status === 'BOUNCED')
  const totalOverdue = overdue.reduce((s, c) => s + c.amount, 0)
  const upcoming7 = DEMO_CHEQUES.filter((c) => {
    if (!['PORTFOLIO', 'DEPOSITED'].includes(c.status)) return false
    const due = new Date(c.dueDate)
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  })
  const givenPending = DEMO_CHEQUES.filter((c) => c.direction === 'GIVEN' && ['PORTFOLIO'].includes(c.status))
  const totalGiven = givenPending.reduce((s, c) => s + c.amount, 0)

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedIds(next)
  }
  const toggleAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginated.map((c) => c.id)))
    }
  }

  const exportColumns = [
    { key: 'serialNo', header: 'Seri No' },
    { key: 'type', header: 'Tür', format: (v: InstrumentType) => typeLabels[v] },
    { key: 'direction', header: 'Yön', format: (v: Direction) => directionLabels[v] },
    { key: 'accountName', header: 'Cari' },
    { key: 'bankName', header: 'Banka' },
    { key: 'amount', header: 'Tutar', format: (v: number) => v.toLocaleString('en-US') },
    { key: 'currency', header: 'Döviz' },
    { key: 'dueDate', header: 'Vade Tarihi' },
    { key: 'status', header: 'Durum', format: (v: ChequeStatus) => statusLabels[v] },
  ]

  const daysUntilDue = (dueDate: string) => {
    const diff = (new Date(dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return Math.ceil(diff)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Çek / Senet Takibi</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Alınan ve verilen çek/senet yönetimi, vade takibi</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={exportColumns} filename="cek-senet" />
          {canEdit && (
            <button
              onClick={() => setConfirmAction({ id: '', action: 'create' })}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Yeni Çek/Senet
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Portföy (Alınan)</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Banknote className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalPortfolio.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{receivedInPortfolio.length} adet çek/senet</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Bu Hafta Vadesi Gelen</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcoming7.length}</p>
          <p className="text-xs text-amber-600 mt-1">${upcoming7.reduce((s, c) => s + c.amount, 0).toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Vadesi Geçen / Karşılıksız</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">${totalOverdue.toLocaleString()}</p>
          <p className="text-xs text-red-500 mt-1">{overdue.length} adet</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Verilen (Bekleyen)</span>
            <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <Send className="h-4 w-4 text-rose-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalGiven.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{givenPending.length} adet</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Seri no, cari veya banka ara..."
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1) }}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
        >
          <option value="ALL">Tümü (Çek+Senet)</option>
          <option value="CHEQUE">Çek</option>
          <option value="PROMISSORY_NOTE">Senet</option>
        </select>

        {/* Direction filter */}
        <select
          value={dirFilter}
          onChange={(e) => { setDirFilter(e.target.value as any); setPage(1) }}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
        >
          <option value="ALL">Alınan + Verilen</option>
          <option value="RECEIVED">Alınan</option>
          <option value="GIVEN">Verilen</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1) }}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
        >
          <option value="ALL">Tüm Durumlar</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-center gap-3 rounded-xl bg-brand-50 dark:bg-brand-900/15 border border-brand-200 dark:border-brand-800/30 px-4 py-2.5"
          >
            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">{selectedIds.size} seçili</span>
            <button onClick={() => setConfirmAction({ id: [...selectedIds].join(','), action: 'endorse' })} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors">
              <ArrowRightLeft className="h-3 w-3" /> Ciro Et
            </button>
            <button onClick={() => setConfirmAction({ id: [...selectedIds].join(','), action: 'collect' })} className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800 transition-colors">
              <CheckCircle className="h-3 w-3" /> Tahsil Edildi
            </button>
            <button onClick={() => setConfirmAction({ id: [...selectedIds].join(','), action: 'return' })} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors">
              <RotateCcw className="h-3 w-3" /> İade
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700">
              Seçimi Temizle
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.size === paginated.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Seri No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tür</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Yön</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cari</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Banka</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Tutar</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Vade</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Durum</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <FileCheck className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Çek/senet bulunamadı</p>
                    <p className="text-xs text-gray-400 mt-1">Filtre kriterlerini değiştirin veya yeni kayıt ekleyin</p>
                  </td>
                </tr>
              ) : paginated.map((c) => {
                const days = daysUntilDue(c.dueDate)
                const isUrgent = days >= 0 && days <= 7 && ['PORTFOLIO', 'DEPOSITED'].includes(c.status)
                return (
                  <tr
                    key={c.id}
                    className={`border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors ${
                      c.status === 'BOUNCED' ? 'bg-red-50/30 dark:bg-red-900/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-gray-900 dark:text-white">{c.serialNo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{typeLabels[c.type]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium ${directionBadge[c.direction]}`}>
                        {c.direction === 'RECEIVED' ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        {directionLabels[c.direction]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white text-xs">{c.accountName}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.bankName !== '—' ? c.bankName : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                        {c.currency === 'TRY' ? '₺' : '$'}{c.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{c.dueDate}</span>
                        {['PORTFOLIO', 'DEPOSITED'].includes(c.status) && (
                          <p className={`text-[10px] mt-0.5 font-medium ${
                            days < 0 ? 'text-red-600' : days <= 7 ? 'text-amber-600' : 'text-gray-400'
                          }`}>
                            {days < 0 ? `${Math.abs(days)} gün geçti` : days === 0 ? 'Bugün' : `${days} gün kaldı`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${statusColors[c.status]}`}>
                        {statusLabels[c.status]}
                      </span>
                      {c.endorsedTo && (
                        <p className="text-[10px] text-purple-500 mt-0.5">→ {c.endorsedTo}</p>
                      )}
                    </td>
                    <td className="px-4 py-1">
                      {canEdit && ['PORTFOLIO', 'DEPOSITED'].includes(c.status) && (
                        <button onClick={() => setConfirmAction({ id: c.id, action: 'action' })} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
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

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => setConfirmAction(null)}
        title="İşlemi Onayla"
        message="Bu çek/senet üzerinde işlem yapmak istediğinizden emin misiniz?"
        variant="warning"
        confirmLabel="Onayla"
      />
    </motion.div>
  )
}
