import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight,
  Download, Filter, Calendar, CreditCard, Wallet, Building2, PiggyBank,
  ArrowLeftRight, ChevronDown, Search, Eye, FileText, Lock, RefreshCw,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import AgingReport from '../components/platinum/AgingReport'
import PeriodClosing from '../components/platinum/PeriodClosing'
// FxRevaluation kaldırıldı - Kur farkı işlemleri artık kullanılmıyor

type TabKey = 'overview' | 'ledger' | 'chart_of_accounts' | 'cash_flow' | 'aging' | 'bank'

const tabs: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: 'overview', label: 'Genel Bakış', icon: BookOpen },
  { key: 'ledger', label: 'Yevmiye Defteri', icon: FileText },
  { key: 'chart_of_accounts', label: 'Hesap Planı', icon: Building2 },
  { key: 'cash_flow', label: 'Nakit Akış', icon: ArrowLeftRight },
  { key: 'aging', label: 'Yaşlandırma', icon: Calendar },
  { key: 'bank', label: 'Banka Hesapları', icon: CreditCard },
]

// Demo data
const monthlyPL = [
  { month: 'Oca', gelir: 285000, gider: 198000, kar: 87000 },
  { month: 'Şub', gelir: 312000, gider: 215000, kar: 97000 },
  { month: 'Mar', gelir: 298000, gider: 208000, kar: 90000 },
  { month: 'Nis', gelir: 345000, gider: 232000, kar: 113000 },
  { month: 'May', gelir: 378000, gider: 255000, kar: 123000 },
  { month: 'Haz', gelir: 356000, gider: 245000, kar: 111000 },
  { month: 'Tem', gelir: 290000, gider: 205000, kar: 85000 },
  { month: 'Ağu', gelir: 268000, gider: 192000, kar: 76000 },
  { month: 'Eyl', gelir: 342000, gider: 230000, kar: 112000 },
  { month: 'Eki', gelir: 389000, gider: 260000, kar: 129000 },
  { month: 'Kas', gelir: 415000, gider: 278000, kar: 137000 },
  { month: 'Ara', gelir: 445000, gider: 295000, kar: 150000 },
]

const ledgerEntries = [
  { id: 1, date: '2026-01-28', no: 'YV-2026-0312', description: 'HomeStyle Inc. - Fatura Tahsilatı', account: '100 - Kasa', debit: 48500, credit: 0, type: 'tahsilat' },
  { id: 2, date: '2026-01-28', no: 'YV-2026-0312', description: 'HomeStyle Inc. - Fatura Tahsilatı', account: '120 - Alıcılar', debit: 0, credit: 48500, type: 'tahsilat' },
  { id: 3, date: '2026-01-27', no: 'YV-2026-0311', description: 'Anadolu Dokuma - Mal Alımı', account: '153 - Ticari Mallar', debit: 72300, credit: 0, type: 'alis' },
  { id: 4, date: '2026-01-27', no: 'YV-2026-0311', description: 'Anadolu Dokuma - Mal Alımı', account: '320 - Satıcılar', debit: 0, credit: 72300, type: 'alis' },
  { id: 5, date: '2026-01-26', no: 'YV-2026-0310', description: 'Pacific Rugs - Satış Faturası', account: '120 - Alıcılar', debit: 35200, credit: 0, type: 'satis' },
  { id: 6, date: '2026-01-26', no: 'YV-2026-0310', description: 'Pacific Rugs - Satış Faturası', account: '600 - Yurt İçi Satışlar', debit: 0, credit: 35200, type: 'satis' },
  { id: 7, date: '2026-01-25', no: 'YV-2026-0309', description: 'Nakliye Gideri - DHL Freight', account: '760 - Paz. Satış Dağ. Gid.', debit: 4200, credit: 0, type: 'gider' },
  { id: 8, date: '2026-01-25', no: 'YV-2026-0309', description: 'Nakliye Gideri - DHL Freight', account: '102 - Bankalar', debit: 0, credit: 4200, type: 'gider' },
  { id: 9, date: '2026-01-24', no: 'YV-2026-0308', description: 'ABC Trading - Komisyon Ödemesi', account: '760 - Paz. Satış Dağ. Gid.', debit: 12340, credit: 0, type: 'komisyon' },
  { id: 10, date: '2026-01-24', no: 'YV-2026-0308', description: 'ABC Trading - Komisyon Ödemesi', account: '102 - Bankalar', debit: 0, credit: 12340, type: 'komisyon' },
  { id: 11, date: '2026-01-23', no: 'YV-2026-0307', description: 'Luxury Floors NY - Tahsilat', account: '102 - Bankalar', debit: 72100, credit: 0, type: 'tahsilat' },
  { id: 12, date: '2026-01-23', no: 'YV-2026-0307', description: 'Luxury Floors NY - Tahsilat', account: '120 - Alıcılar', debit: 0, credit: 72100, type: 'tahsilat' },
]

const chartOfAccounts = [
  { code: '100', name: 'Kasa', group: '1 - Dönen Varlıklar', balance: 124500, type: 'B' as const },
  { code: '101', name: 'Alınan Çekler', group: '1 - Dönen Varlıklar', balance: 45200, type: 'B' as const },
  { code: '102', name: 'Bankalar', group: '1 - Dönen Varlıklar', balance: 892300, type: 'B' as const },
  { code: '120', name: 'Alıcılar', group: '1 - Dönen Varlıklar', balance: 456700, type: 'B' as const },
  { code: '121', name: 'Alacak Senetleri', group: '1 - Dönen Varlıklar', balance: 128900, type: 'B' as const },
  { code: '153', name: 'Ticari Mallar', group: '1 - Dönen Varlıklar', balance: 1245600, type: 'B' as const },
  { code: '254', name: 'Taşıtlar', group: '2 - Duran Varlıklar', balance: 185000, type: 'B' as const },
  { code: '255', name: 'Demirbaşlar', group: '2 - Duran Varlıklar', balance: 92000, type: 'B' as const },
  { code: '300', name: 'Banka Kredileri', group: '3 - Kısa Vadeli Yabancı Kaynaklar', balance: 320000, type: 'A' as const },
  { code: '320', name: 'Satıcılar', group: '3 - Kısa Vadeli Yabancı Kaynaklar', balance: 287600, type: 'A' as const },
  { code: '335', name: 'Personele Borçlar', group: '3 - Kısa Vadeli Yabancı Kaynaklar', balance: 45800, type: 'A' as const },
  { code: '360', name: 'Ödenecek Vergi', group: '3 - Kısa Vadeli Yabancı Kaynaklar', balance: 67200, type: 'A' as const },
  { code: '500', name: 'Sermaye', group: '5 - Özkaynaklar', balance: 1500000, type: 'A' as const },
  { code: '570', name: 'Geçmiş Yıl Kârları', group: '5 - Özkaynaklar', balance: 648200, type: 'A' as const },
  { code: '600', name: 'Yurt İçi Satışlar', group: '6 - Gelir Tablosu', balance: 3245000, type: 'G' as const },
  { code: '601', name: 'Yurt Dışı Satışlar', group: '6 - Gelir Tablosu', balance: 1878000, type: 'G' as const },
  { code: '621', name: 'Satılan Ticari Mal Maliyeti', group: '6 - Gelir Tablosu', balance: 2890000, type: 'GD' as const },
  { code: '760', name: 'Paz. Satış Dağ. Giderleri', group: '7 - Maliyet', balance: 425000, type: 'GD' as const },
  { code: '770', name: 'Genel Yönetim Giderleri', group: '7 - Maliyet', balance: 312000, type: 'GD' as const },
]

const cashFlowData = [
  { month: 'Oca', inflow: 310000, outflow: 245000 },
  { month: 'Şub', inflow: 340000, outflow: 268000 },
  { month: 'Mar', inflow: 295000, outflow: 252000 },
  { month: 'Nis', inflow: 365000, outflow: 275000 },
  { month: 'May', inflow: 398000, outflow: 310000 },
  { month: 'Haz', inflow: 375000, outflow: 298000 },
  { month: 'Tem', inflow: 310000, outflow: 265000 },
  { month: 'Ağu', inflow: 285000, outflow: 240000 },
  { month: 'Eyl', inflow: 360000, outflow: 285000 },
  { month: 'Eki', inflow: 410000, outflow: 322000 },
  { month: 'Kas', inflow: 435000, outflow: 340000 },
  { month: 'Ara', inflow: 468000, outflow: 358000 },
]

const agingData = [
  { customer: 'HomeStyle Inc.', current: 28500, d30: 12400, d60: 5200, d90: 2100, d90plus: 0, total: 48200, risk: 'low' },
  { customer: 'Luxury Floors NY', current: 45200, d30: 18700, d60: 8200, d90: 0, d90plus: 0, total: 72100, risk: 'low' },
  { customer: 'Pacific Rugs', current: 15800, d30: 8600, d60: 6400, d90: 3200, d90plus: 1400, total: 35400, risk: 'medium' },
  { customer: 'Desert Home Decor', current: 8200, d30: 4500, d60: 3800, d90: 2800, d90plus: 4200, total: 23500, risk: 'high' },
  { customer: 'Chicago Interiors', current: 32100, d30: 14200, d60: 0, d90: 0, d90plus: 0, total: 46300, risk: 'low' },
  { customer: 'Miami Carpet Co.', current: 0, d30: 5600, d60: 8200, d90: 6400, d90plus: 8900, total: 29100, risk: 'high' },
]

const bankAccounts = [
  { id: 1, bank: 'Ziraat Bankası', branch: 'Merter Şubesi', iban: 'TR12 0001 0012 3456 7890 1234 56', currency: 'TRY', balance: 2450000, lastTx: '2026-01-28' },
  { id: 2, bank: 'İş Bankası', branch: 'Laleli Şubesi', iban: 'TR34 0006 4000 0011 2233 4455 66', currency: 'TRY', balance: 1870000, lastTx: '2026-01-28' },
  { id: 3, bank: 'Garanti BBVA', branch: 'Beyazıt Şubesi', iban: 'TR56 0006 2000 0022 3344 5566 77', currency: 'USD', balance: 892300, lastTx: '2026-01-27' },
  { id: 4, bank: 'Yapı Kredi', branch: 'Kapalıçarşı Şubesi', iban: 'TR78 0006 7010 0033 4455 6677 88', currency: 'EUR', balance: 245600, lastTx: '2026-01-25' },
]

const expenseBreakdown = [
  { name: 'Mal Alımı', value: 2890000, color: '#4c6ef5' },
  { name: 'Nakliye', value: 425000, color: '#40c057' },
  { name: 'Yönetim', value: 312000, color: '#fab005' },
  { name: 'Komisyon', value: 198000, color: '#e64980' },
  { name: 'Vergi', value: 156000, color: '#7950f2' },
  { name: 'Diğer', value: 84000, color: '#868e96' },
]

function formatCurrency(val: number): string {
  return '$' + val.toLocaleString('en-US')
}

export default function AccountingPage() {
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [ledgerFilter, setLedgerFilter] = useState<string>('all')
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [dateRange, setDateRange] = useState('month')
  const [periodClosingOpen, setPeriodClosingOpen] = useState(false)

  const canViewAccounting = hasPermission('view_accounting')

  const filteredLedger = useMemo(() => {
    return ledgerEntries.filter((e) => {
      if (ledgerFilter !== 'all' && e.type !== ledgerFilter) return false
      if (ledgerSearch && !e.description.toLowerCase().includes(ledgerSearch.toLowerCase())) return false
      return true
    })
  }, [ledgerFilter, ledgerSearch])

  const totalAssets = useMemo(() =>
    chartOfAccounts.filter(a => a.type === 'B').reduce((s, a) => s + a.balance, 0),
    []
  )
  const totalLiabilities = useMemo(() =>
    chartOfAccounts.filter(a => a.type === 'A').reduce((s, a) => s + a.balance, 0),
    []
  )

  if (!canViewAccounting) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Erişim Kısıtlı</h2>
          <p className="text-gray-500 mt-2">Muhasebe modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Muhasebe</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Finansal yönetim ve raporlama</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
          >
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="quarter">Bu Çeyrek</option>
            <option value="year">Bu Yıl</option>
          </select>
          <button
            onClick={() => setPeriodClosingOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
          >
            <Lock className="h-4 w-4" />
            Dönem Kilitle
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
            <Download className="h-4 w-4" />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-secondary dark:bg-surface-dark-secondary rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-surface-dark text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Toplam Gelir (Yıl)</span>
                <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$5,123,000</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +18.2% geçen yıla göre
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Toplam Gider (Yıl)</span>
                <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$3,813,000</p>
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <ArrowDownRight className="h-3 w-3" /> +12.4% geçen yıla göre
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Net Kâr (Yıl)</span>
                <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-brand-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$1,310,000</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> Kâr marjı: %25.6
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Nakit Pozisyonu</span>
                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$1,016,800</p>
              <p className="text-xs text-gray-500 mt-1">Kasa + Bankalar</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card p-5 xl:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Aylık Gelir / Gider / Kâr</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Legend />
                    <Bar dataKey="gelir" name="Gelir" fill="#40c057" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gider" name="Gider" fill="#fa5252" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="kar" name="Kâr" fill="#4c6ef5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Gider Dağılımı</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                    >
                      {expenseBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5">
                {expenseBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mizan Summary */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bilanço Özeti</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Varlıklar</h4>
                <div className="space-y-2">
                  {chartOfAccounts.filter(a => a.type === 'B').map((acc) => (
                    <div key={acc.code} className="flex items-center justify-between py-1.5 border-b border-border/50 dark:border-border-dark/50 last:border-0">
                      <div>
                        <span className="text-xs font-mono text-gray-400 mr-2">{acc.code}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{acc.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(acc.balance)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t-2 border-gray-300 dark:border-gray-600">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Toplam Varlıklar</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(totalAssets)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Kaynaklar</h4>
                <div className="space-y-2">
                  {chartOfAccounts.filter(a => a.type === 'A').map((acc) => (
                    <div key={acc.code} className="flex items-center justify-between py-1.5 border-b border-border/50 dark:border-border-dark/50 last:border-0">
                      <div>
                        <span className="text-xs font-mono text-gray-400 mr-2">{acc.code}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{acc.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(acc.balance)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t-2 border-gray-300 dark:border-gray-600">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Toplam Kaynaklar</span>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="Yevmiye ara..."
                className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-10 pr-4 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <select
              value={ledgerFilter}
              onChange={(e) => setLedgerFilter(e.target.value)}
              className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
            >
              <option value="all">Tüm İşlemler</option>
              <option value="tahsilat">Tahsilatlar</option>
              <option value="satis">Satışlar</option>
              <option value="alis">Alışlar</option>
              <option value="gider">Giderler</option>
              <option value="komisyon">Komisyonlar</option>
            </select>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Tarih</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Fiş No</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Açıklama</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Hesap</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Borç</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Alacak</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary/30 dark:hover:bg-surface-dark-secondary/30">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.date}</td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-600">{entry.no}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{entry.description}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{entry.account}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface-secondary/50 dark:bg-surface-dark-secondary/50 font-bold">
                  <td colSpan={4} className="px-4 py-3 text-gray-900 dark:text-white">Toplam</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    {formatCurrency(filteredLedger.reduce((s, e) => s + e.debit, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    {formatCurrency(filteredLedger.reduce((s, e) => s + e.credit, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Chart of Accounts Tab */}
      {activeTab === 'chart_of_accounts' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Hesap Kodu</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Hesap Adı</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Hesap Grubu</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Tip</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Bakiye</th>
                </tr>
              </thead>
              <tbody>
                {chartOfAccounts.map((acc) => (
                  <tr key={acc.code} className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary/30 dark:hover:bg-surface-dark-secondary/30">
                    <td className="px-4 py-3 font-mono text-brand-600 font-medium">{acc.code}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{acc.name}</td>
                    <td className="px-4 py-3 text-gray-500">{acc.group}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        acc.type === 'B' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                        acc.type === 'A' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                        acc.type === 'G' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                      }`}>
                        {acc.type === 'B' ? 'Borç' : acc.type === 'A' ? 'Alacak' : acc.type === 'G' ? 'Gelir' : 'Gider'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(acc.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cash Flow Tab */}
      {activeTab === 'cash_flow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <p className="text-sm text-gray-500 mb-1">Toplam Giriş</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(cashFlowData.reduce((s, d) => s + d.inflow, 0))}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500 mb-1">Toplam Çıkış</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(cashFlowData.reduce((s, d) => s + d.outflow, 0))}</p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500 mb-1">Net Nakit Akış</p>
              <p className="text-xl font-bold text-brand-600">
                {formatCurrency(cashFlowData.reduce((s, d) => s + d.inflow - d.outflow, 0))}
              </p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Aylık Nakit Akış</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Legend />
                  <Area type="monotone" dataKey="inflow" name="Giriş" stroke="#40c057" fill="#40c057" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="outflow" name="Çıkış" stroke="#fa5252" fill="#fa5252" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Aging Tab – Platinum AgingReport */}
      {activeTab === 'aging' && <AgingReport />}

      {/* Bank Accounts Tab */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((acc) => (
              <div key={acc.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{acc.bank}</p>
                      <p className="text-xs text-gray-500">{acc.branch}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                    acc.currency === 'USD' ? 'bg-green-50 text-green-700' :
                    acc.currency === 'EUR' ? 'bg-blue-50 text-blue-700' :
                    'bg-orange-50 text-orange-700'
                  }`}>
                    {acc.currency}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono mb-2">{acc.iban}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Bakiye</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {acc.currency === 'TRY' ? '₺' : acc.currency === 'EUR' ? '€' : '$'}
                      {acc.balance.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">Son işlem: {acc.lastTx}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platinum Modals */}
      <PeriodClosing open={periodClosingOpen} onClose={() => setPeriodClosingOpen(false)} />
    </motion.div>
  )
}
