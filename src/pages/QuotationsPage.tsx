import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Plus, Search, Calendar, ChevronRight,
  CheckCircle, Clock, XCircle, Send, Copy,
  Building2, DollarSign, ArrowRight,
} from 'lucide-react'

type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'

interface Quotation {
  id: string
  quotationNo: string
  customer: string
  customerCity: string
  agency: string | null
  items: number
  currency: string
  totalAmount: number
  status: QuotationStatus
  validUntil: string
  createdAt: string
  convertedOrderNo: string | null
}

const statusConfig: Record<QuotationStatus, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Taslak', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock },
  sent: { label: 'Gönderildi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Send },
  accepted: { label: 'Kabul Edildi', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  expired: { label: 'Süresi Doldu', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  converted: { label: 'Siparişe Dönüştü', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', icon: ArrowRight },
}

const demoQuotations: Quotation[] = [
  { id: 'q1', quotationNo: 'TEK-2026-0034', customer: 'HomeStyle Inc.', customerCity: 'New York', agency: 'ABC Trading LLC', items: 5, currency: 'USD', totalAmount: 48500, status: 'sent', validUntil: '15 Şub 2026', createdAt: '25 Oca 2026', convertedOrderNo: null },
  { id: 'q2', quotationNo: 'TEK-2026-0033', customer: 'Luxury Floors NY', customerCity: 'Los Angeles', agency: 'West Coast Carpets', items: 8, currency: 'USD', totalAmount: 92300, status: 'accepted', validUntil: '10 Şub 2026', createdAt: '20 Oca 2026', convertedOrderNo: null },
  { id: 'q3', quotationNo: 'TEK-2026-0032', customer: 'Pacific Rugs', customerCity: 'San Francisco', agency: null, items: 3, currency: 'USD', totalAmount: 18700, status: 'converted', validUntil: '05 Şub 2026', createdAt: '15 Oca 2026', convertedOrderNo: 'ORD-2026-0147' },
  { id: 'q4', quotationNo: 'TEK-2026-0031', customer: 'Desert Home Decor', customerCity: 'Phoenix', agency: 'Southern Flooring Co.', items: 12, currency: 'USD', totalAmount: 156800, status: 'draft', validUntil: '20 Şub 2026', createdAt: '28 Oca 2026', convertedOrderNo: null },
  { id: 'q5', quotationNo: 'TEK-2026-0030', customer: 'Chicago Interiors', customerCity: 'Chicago', agency: 'Midwest Distributors', items: 4, currency: 'EUR', totalAmount: 34200, status: 'rejected', validUntil: '01 Şub 2026', createdAt: '10 Oca 2026', convertedOrderNo: null },
  { id: 'q6', quotationNo: 'TEK-2026-0029', customer: 'Atlanta Furnishing', customerCity: 'Atlanta', agency: 'ABC Trading LLC', items: 6, currency: 'USD', totalAmount: 67100, status: 'expired', validUntil: '20 Oca 2026', createdAt: '05 Oca 2026', convertedOrderNo: null },
]

export default function QuotationsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = demoQuotations.filter((q) => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return q.quotationNo.toLowerCase().includes(s) || q.customer.toLowerCase().includes(s)
    }
    return true
  })

  const stats = {
    total: demoQuotations.length,
    draft: demoQuotations.filter(q => q.status === 'draft').length,
    sent: demoQuotations.filter(q => q.status === 'sent').length,
    accepted: demoQuotations.filter(q => q.status === 'accepted').length,
    converted: demoQuotations.filter(q => q.status === 'converted').length,
    rejected: demoQuotations.filter(q => q.status === 'rejected').length,
    totalValue: demoQuotations.reduce((s, q) => s + q.totalAmount, 0),
    openValue: demoQuotations.filter(q => q.status === 'sent' || q.status === 'accepted').reduce((s, q) => s + q.totalAmount, 0),
    conversionRate: (() => {
      const decided = demoQuotations.filter(q => ['accepted', 'rejected', 'converted'].includes(q.status)).length
      const won = demoQuotations.filter(q => ['accepted', 'converted'].includes(q.status)).length
      return decided > 0 ? Math.round((won / decided) * 100) : 0
    })(),
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Proforma & Teklifler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Müşterilere gönderilen teklif ve proformaları yönetin</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Yeni Teklif
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Toplam Teklif', value: stats.total, icon: FileText, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
          { label: 'Gönderilen', value: stats.sent, icon: Send, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Kabul Edilen', value: stats.accepted, icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          { label: 'Siparişe Dönen', value: stats.converted, icon: ArrowRight, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Açık Tutar', value: `$${(stats.openValue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Dönüşüm Oranı', value: `%${stats.conversionRate}`, icon: CheckCircle, color: stats.conversionRate >= 50 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${kpi.color}`}>
                <kpi.icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{kpi.label}</p>
                <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">Teklif Dönüşüm Hunisi</p>
        <div className="flex items-center gap-2">
          {[
            { label: 'Taslak', count: stats.draft, color: 'bg-gray-400' },
            { label: 'Gönderildi', count: stats.sent, color: 'bg-blue-500' },
            { label: 'Kabul', count: stats.accepted, color: 'bg-green-500' },
            { label: 'Sipariş', count: stats.converted, color: 'bg-brand-600' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-gray-500">{step.label}</span>
                  <span className="text-[12px] font-bold text-gray-900 dark:text-white">{step.count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className={`h-full rounded-full ${step.color}`} style={{ width: `${stats.total > 0 ? (step.count / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
              {i < 3 && <ChevronRight className="h-4 w-4 text-gray-300 mx-1 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Teklif no veya müşteri ara..."
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'draft', 'sent', 'accepted', 'rejected', 'converted'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {s === 'all' ? 'Tümü' : statusConfig[s as QuotationStatus]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Teklif No</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Müşteri</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Getiren Acente</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">Kalem</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500">Tutar</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">Durum</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Geçerlilik</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Teklif bulunamadı</p>
                </td>
              </tr>
            ) : (
              filtered.map((q) => {
                const st = statusConfig[q.status]
                return (
                  <tr key={q.id} className="border-b border-border/50 dark:border-border-dark/50 last:border-0 hover:bg-surface-secondary/30 dark:hover:bg-surface-dark-secondary/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-gray-900 dark:text-white">{q.quotationNo}</span>
                      <p className="text-[11px] text-gray-400">{q.createdAt}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{q.customer}</p>
                          <p className="text-[11px] text-gray-400">{q.customerCity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400 text-xs">{q.agency || '—'}</td>
                    <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-300">{q.items}</td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-900 dark:text-white tabular-nums">
                      {q.currency === 'EUR' ? '€' : '$'}{q.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium ${st.color}`}>
                        <st.icon className="h-3 w-3" /> {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {q.validUntil}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {q.status === 'accepted' && (
                          <button className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Siparişe Dönüştür">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {q.status === 'draft' && (
                          <button className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Gönder">
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Kopyala">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Detay">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
