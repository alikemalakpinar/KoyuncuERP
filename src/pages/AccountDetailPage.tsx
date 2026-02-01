/**
 * Account Detail Page — Cari Detay
 *
 * Tabs: Genel Bilgi, Ekstre (Borç/Alacak Defteri), Siparişler, Faturalar, İletişim
 */

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Building2, Globe, Phone, Mail, MapPin,
  ShoppingCart, FileText, CreditCard, TrendingUp,
  AlertTriangle, Shield, Clock, ChevronRight,
  ArrowUpRight, ArrowDownRight, DollarSign, Users,
  UserCheck, Calendar, Hash, Eye,
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from 'recharts'
import { useAccountsQuery, useAccountHealthQuery } from '../hooks/useIpc'

// ── Tabs ───────────────────────────────────────────────────
const tabs = [
  { id: 'overview', label: 'Genel', icon: Building2 },
  { id: 'ledger', label: 'Ekstre', icon: FileText },
  { id: 'orders', label: 'Siparişler', icon: ShoppingCart },
  { id: 'invoices', label: 'Faturalar', icon: FileText },
] as const
type TabId = (typeof tabs)[number]['id']

// ── Demo Ledger Data (Borç/Alacak) ─────────────────────────
const demoLedger = [
  { id: 'l1', date: '2026-01-28', type: 'INVOICE' as const, ref: 'INV-2026-0198', desc: 'Satış Faturası', debit: 34200, credit: 0, balance: 48250 },
  { id: 'l2', date: '2026-01-22', type: 'PAYMENT' as const, ref: 'PAY-2026-0089', desc: 'Banka Havalesi (Garanti)', debit: 0, credit: 45000, balance: 14050 },
  { id: 'l3', date: '2026-01-15', type: 'INVOICE' as const, ref: 'INV-2026-0185', desc: 'Satış Faturası', debit: 28400, credit: 0, balance: 59050 },
  { id: 'l4', date: '2026-01-08', type: 'PAYMENT' as const, ref: 'PAY-2026-0076', desc: 'Banka Havalesi (Ziraat)', debit: 0, credit: 30000, balance: 30650 },
  { id: 'l5', date: '2025-12-28', type: 'INVOICE' as const, ref: 'INV-2026-0170', desc: 'Satış Faturası', debit: 42500, credit: 0, balance: 60650 },
  { id: 'l6', date: '2025-12-20', type: 'DEBIT_NOTE' as const, ref: 'DN-2025-0012', desc: 'Kur Farkı Borç Dekontu', debit: 1850, credit: 0, balance: 18150 },
  { id: 'l7', date: '2025-12-15', type: 'PAYMENT' as const, ref: 'PAY-2026-0065', desc: 'Çek Tahsilatı', debit: 0, credit: 25000, balance: 16300 },
  { id: 'l8', date: '2025-12-10', type: 'INVOICE' as const, ref: 'INV-2026-0158', desc: 'Satış Faturası', debit: 18200, credit: 0, balance: 41300 },
]

// ── Demo Orders ─────────────────────────────────────────────
const demoOrders = [
  { id: 'o1', orderNo: 'ORD-2026-0152', date: '2026-01-28', status: 'CONFIRMED', total: '$34,200', items: 6 },
  { id: 'o2', orderNo: 'ORD-2026-0140', date: '2026-01-15', status: 'SHIPPED', total: '$28,400', items: 4 },
  { id: 'o3', orderNo: 'ORD-2026-0128', date: '2025-12-28', status: 'DELIVERED', total: '$42,500', items: 8 },
  { id: 'o4', orderNo: 'ORD-2026-0115', date: '2025-12-10', status: 'DELIVERED', total: '$18,200', items: 3 },
  { id: 'o5', orderNo: 'ORD-2025-0098', date: '2025-11-20', status: 'DELIVERED', total: '$22,800', items: 5 },
]

// ── Demo Invoices ───────────────────────────────────────────
const demoInvoices = [
  { id: 'i1', invoiceNo: 'INV-2026-0198', date: '2026-01-28', dueDate: '2026-02-27', status: 'SENT', total: '$34,200' },
  { id: 'i2', invoiceNo: 'INV-2026-0185', date: '2026-01-15', dueDate: '2026-02-14', status: 'PAID', total: '$28,400' },
  { id: 'i3', invoiceNo: 'INV-2026-0170', date: '2025-12-28', dueDate: '2026-01-27', status: 'PAID', total: '$42,500' },
  { id: 'i4', invoiceNo: 'INV-2026-0158', date: '2025-12-10', dueDate: '2026-01-09', status: 'PAID', total: '$18,200' },
]

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  CONFIRMED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  IN_PRODUCTION: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  SHIPPED: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  DELIVERED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  SENT: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  PAID: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  OVERDUE: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak', CONFIRMED: 'Onaylı', IN_PRODUCTION: 'Üretimde',
  SHIPPED: 'Sevk Edildi', DELIVERED: 'Teslim', SENT: 'Gönderildi',
  PAID: 'Ödendi', OVERDUE: 'Vadesi Geçmiş',
}

const typeIcons: Record<string, typeof Building2> = {
  CUSTOMER: Building2, SUPPLIER: Globe, AGENCY: UserCheck, BOTH: Users,
}
const typeLabels: Record<string, string> = {
  CUSTOMER: 'Müşteri', SUPPLIER: 'Tedarikçi', AGENCY: 'Acente', BOTH: 'Müşteri/Tedarikçi',
}

// ── Monthly revenue chart ───────────────────────────────────
const monthlyRevenue = [
  { month: 'Ağu', revenue: 22000, collection: 18000 },
  { month: 'Eyl', revenue: 38000, collection: 32000 },
  { month: 'Eki', revenue: 28000, collection: 35000 },
  { month: 'Kas', revenue: 42000, collection: 25000 },
  { month: 'Ara', revenue: 62500, collection: 55000 },
  { month: 'Oca', revenue: 62600, collection: 75000 },
]

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const { data: accounts = [] } = useAccountsQuery()
  const { data: health } = useAccountHealthQuery(id ?? null)

  const account = useMemo(() => accounts.find((a: any) => a.id === id), [accounts, id])

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Building2 className="h-12 w-12 mb-3" />
        <p className="text-sm">Cari bulunamadı</p>
        <button onClick={() => navigate('/accounts')} className="mt-3 text-brand-600 text-sm font-medium">
          ← Carilere Dön
        </button>
      </div>
    )
  }

  const TypeIcon = typeIcons[account.type] || Building2
  const riskUsed = parseFloat(account.balance.replace(/,/g, ''))
  const riskLimit = parseFloat(account.riskLimit.replace(/,/g, ''))
  const riskPct = riskLimit > 0 ? Math.round((riskUsed / riskLimit) * 100) : 0
  const isRiskHigh = riskPct > 80

  const totalDebit = demoLedger.reduce((s, l) => s + l.debit, 0)
  const totalCredit = demoLedger.reduce((s, l) => s + l.credit, 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/accounts')} className="mt-1 rounded-xl p-2 text-gray-400 hover:text-gray-600 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/15">
              <TypeIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{account.name}</h1>
              <div className="flex items-center gap-2 text-[12px] text-gray-500">
                <span className="font-medium text-gray-400">{account.code}</span>
                <span>·</span>
                <span>{typeLabels[account.type]}</span>
                <span>·</span>
                <MapPin className="h-3 w-3" />
                <span>{account.city}, {account.country === 'US' ? 'ABD' : account.country}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Bakiye</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">${account.balance}</p>
          </div>
          <div className="h-8 w-px bg-border dark:bg-border-dark" />
          <div className="text-right">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Risk Limit</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">${account.riskLimit}</p>
          </div>
          <div className="h-8 w-px bg-border dark:bg-border-dark" />
          <div className="text-right">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Vade</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{account.paymentTermDays} gün</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border dark:border-border-dark">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="account-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-4">
              {/* KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Toplam Sipariş', value: String(demoOrders.length), icon: ShoppingCart, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/15' },
                  { label: 'Açık Bakiye', value: `$${account.balance}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15' },
                  { label: 'Son Sipariş', value: new Date(account.lastOrderDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }), icon: Calendar, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/15' },
                  { label: 'Risk Kullanım', value: `%${riskPct}`, icon: Shield, color: isRiskHigh ? 'text-red-600 bg-red-50 dark:bg-red-900/15' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/15' },
                ].map((kpi) => (
                  <div key={kpi.label} className="card p-4 flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${kpi.color}`}>
                      <kpi.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 uppercase">{kpi.label}</p>
                      <p className="text-[16px] font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue Chart */}
              <div className="card p-5">
                <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-4">Aylık Ciro & Tahsilat</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#868e96' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#868e96' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: 12, border: '1px solid #e9ecef', fontSize: 12 }} />
                      <Bar dataKey="revenue" name="Ciro" fill="#4c6ef5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="collection" name="Tahsilat" fill="#40c057" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Ledger */}
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border dark:border-border-dark">
                  <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Son Hareketler</h3>
                  <button onClick={() => setActiveTab('ledger')} className="text-[11px] text-brand-600 font-medium flex items-center gap-1">
                    Tümünü Gör <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <table className="w-full text-[12px]">
                  <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
                    {demoLedger.slice(0, 4).map((entry) => (
                      <tr key={entry.id} className="hover:bg-surface-secondary/40 dark:hover:bg-surface-dark-tertiary/40 transition-colors">
                        <td className="px-5 py-2.5 text-gray-400 tabular-nums">{new Date(entry.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-medium text-gray-900 dark:text-white">{entry.ref}</span>
                          <p className="text-[10px] text-gray-400">{entry.desc}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {entry.debit > 0 && <span className="text-red-500 font-medium">${entry.debit.toLocaleString()}</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {entry.credit > 0 && <span className="text-emerald-600 font-medium">${entry.credit.toLocaleString()}</span>}
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums font-semibold text-gray-900 dark:text-white">
                          ${entry.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-4">
              {/* Risk Limit */}
              <div className="card p-5">
                <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-3">Risk Durumu</h3>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-[11px] text-gray-500">Kullanılan: ${account.balance}</span>
                  <span className="text-[11px] text-gray-500">Limit: ${account.riskLimit}</span>
                </div>
                <div className="h-3 rounded-full bg-surface-secondary dark:bg-surface-dark-tertiary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(riskPct, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${isRiskHigh ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-brand-400 to-brand-600'}`}
                  />
                </div>
                <p className={`text-right text-[11px] font-bold mt-1 ${isRiskHigh ? 'text-red-500' : 'text-brand-600'}`}>
                  %{riskPct}
                </p>
                {isRiskHigh && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/10 px-3 py-2 border border-red-100 dark:border-red-800/20">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">Risk limiti kritik seviyede</span>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="card p-5">
                <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-3">İletişim</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: Phone, label: '+1 (212) 555-0198' },
                    { icon: Mail, label: 'info@homestyle-inc.com' },
                    { icon: Globe, label: 'www.homestyle-inc.com' },
                    { icon: MapPin, label: `${account.city}, ${account.country === 'US' ? 'ABD' : account.country}` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <item.icon className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-[12px] text-gray-600 dark:text-gray-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Health */}
              {health && (
                <div className="card p-5">
                  <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-3">Sağlık Skoru</h3>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={health.revenueHistory || monthlyRevenue}>
                        <defs>
                          <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4c6ef5" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#4c6ef5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="revenue" stroke="#4c6ef5" strokeWidth={1.5} fill="url(#healthGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Payment Terms */}
              <div className="card p-5">
                <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-3">Ödeme Koşulları</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-500">Vade Süresi</span>
                    <span className="font-medium text-gray-900 dark:text-white">{account.paymentTermDays} gün</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-500">Para Birimi</span>
                    <span className="font-medium text-gray-900 dark:text-white">USD</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-500">Son Sipariş</span>
                    <span className="font-medium text-gray-900 dark:text-white">{new Date(account.lastOrderDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-500">Durum</span>
                    <span className={`font-medium ${account.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {account.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'ledger' && (
          <motion.div key="ledger" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Ledger Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 text-center">
                <p className="text-[10px] font-medium text-gray-400 uppercase">Toplam Borç</p>
                <p className="text-lg font-bold text-red-500">${totalDebit.toLocaleString()}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-[10px] font-medium text-gray-400 uppercase">Toplam Alacak</p>
                <p className="text-lg font-bold text-emerald-600">${totalCredit.toLocaleString()}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-[10px] font-medium text-gray-400 uppercase">Bakiye</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">${account.balance}</p>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
                    <th className="text-left font-medium text-gray-400 px-5 py-2.5">Tarih</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Referans</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Açıklama</th>
                    <th className="text-right font-medium text-red-400 px-3 py-2.5">Borç</th>
                    <th className="text-right font-medium text-emerald-500 px-3 py-2.5">Alacak</th>
                    <th className="text-right font-medium text-gray-400 px-5 py-2.5">Bakiye</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
                  {demoLedger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-secondary/40 dark:hover:bg-surface-dark-tertiary/40 transition-colors">
                      <td className="px-5 py-2.5 text-gray-500 tabular-nums">
                        {new Date(entry.date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-brand-600 dark:text-brand-400">{entry.ref}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{entry.desc}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {entry.debit > 0 ? <span className="text-red-500 font-medium">${entry.debit.toLocaleString()}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {entry.credit > 0 ? <span className="text-emerald-600 font-medium">${entry.credit.toLocaleString()}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums font-semibold text-gray-900 dark:text-white">
                        ${entry.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
                    <th className="text-left font-medium text-gray-400 px-5 py-2.5">Sipariş No</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Tarih</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Durum</th>
                    <th className="text-right font-medium text-gray-400 px-3 py-2.5">Kalem</th>
                    <th className="text-right font-medium text-gray-400 px-5 py-2.5">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
                  {demoOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="hover:bg-surface-secondary/40 dark:hover:bg-surface-dark-tertiary/40 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-2.5 font-medium text-brand-600 dark:text-brand-400">{order.orderNo}</td>
                      <td className="px-3 py-2.5 text-gray-500 tabular-nums">{new Date(order.date).toLocaleDateString('tr-TR')}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusColors[order.status] ?? ''}`}>
                          {statusLabels[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">{order.items}</td>
                      <td className="px-5 py-2.5 text-right font-semibold text-gray-900 dark:text-white tabular-nums">{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'invoices' && (
          <motion.div key="invoices" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
                    <th className="text-left font-medium text-gray-400 px-5 py-2.5">Fatura No</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Tarih</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Vade</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Durum</th>
                    <th className="text-right font-medium text-gray-400 px-5 py-2.5">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
                  {demoInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-secondary/40 dark:hover:bg-surface-dark-tertiary/40 transition-colors">
                      <td className="px-5 py-2.5 font-medium text-brand-600 dark:text-brand-400">{inv.invoiceNo}</td>
                      <td className="px-3 py-2.5 text-gray-500 tabular-nums">{new Date(inv.date).toLocaleDateString('tr-TR')}</td>
                      <td className="px-3 py-2.5 text-gray-500 tabular-nums">{new Date(inv.dueDate).toLocaleDateString('tr-TR')}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusColors[inv.status] ?? ''}`}>
                          {statusLabels[inv.status] ?? inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right font-semibold text-gray-900 dark:text-white tabular-nums">{inv.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
