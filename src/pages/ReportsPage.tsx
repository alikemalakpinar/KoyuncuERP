import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Download, Calendar, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, FileText, Users, Package,
  DollarSign, Target, Award, Zap, Filter,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
type ReportTab = 'summary' | 'sales_trends' | 'product_analysis' | 'agency_report' | 'pnl'

const periodLabels: Record<ReportPeriod, string> = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
  quarterly: 'Çeyreklik',
  yearly: 'Yıllık',
}

const reportTabs: { key: ReportTab; label: string; icon: typeof BarChart3 }[] = [
  { key: 'summary', label: 'Özet Rapor', icon: BarChart3 },
  { key: 'sales_trends', label: 'Satış Trendleri', icon: TrendingUp },
  { key: 'product_analysis', label: 'Ürün Analizi', icon: Package },
  { key: 'agency_report', label: 'Acente Raporu', icon: Users },
  { key: 'pnl', label: 'Kâr / Zarar', icon: DollarSign },
]

// Demo data
const monthlySales = [
  { month: 'Oca', satis: 285000, hedef: 300000 },
  { month: 'Şub', satis: 312000, hedef: 300000 },
  { month: 'Mar', satis: 298000, hedef: 310000 },
  { month: 'Nis', satis: 345000, hedef: 320000 },
  { month: 'May', satis: 378000, hedef: 340000 },
  { month: 'Haz', satis: 356000, hedef: 350000 },
  { month: 'Tem', satis: 290000, hedef: 330000 },
  { month: 'Ağu', satis: 268000, hedef: 310000 },
  { month: 'Eyl', satis: 342000, hedef: 340000 },
  { month: 'Eki', satis: 389000, hedef: 360000 },
  { month: 'Kas', satis: 415000, hedef: 380000 },
  { month: 'Ara', satis: 445000, hedef: 400000 },
]

const topProducts = [
  { name: 'El Dokuma Halı - Kayseri', category: 'El Dokuma', sold: 342, revenue: 838900, margin: 28.4, trend: 'up', stock: 85 },
  { name: 'İpek Halı - Hereke', category: 'İpek', sold: 128, revenue: 1139200, margin: 32.1, trend: 'up', stock: 23 },
  { name: 'Makine Halısı - Modern', category: 'Makine', sold: 856, revenue: 667680, margin: 22.5, trend: 'up', stock: 420 },
  { name: 'Kilim - Antik Desen', category: 'Kilim', sold: 215, revenue: 412800, margin: 26.8, trend: 'down', stock: 92 },
  { name: 'Yün Halı - Uşak', category: 'Yün', sold: 189, revenue: 657720, margin: 30.2, trend: 'up', stock: 56 },
  { name: 'Patchwork Halı', category: 'Patchwork', sold: 298, revenue: 423160, margin: 19.8, trend: 'down', stock: 134 },
  { name: 'Bambu Halı - Doğal', category: 'Bambu', sold: 167, revenue: 250500, margin: 24.1, trend: 'up', stock: 78 },
  { name: 'Akrilik Halı - Klasik', category: 'Akrilik', sold: 423, revenue: 338400, margin: 18.2, trend: 'stable', stock: 312 },
]

const categoryBreakdown = [
  { name: 'El Dokuma', value: 35, color: '#4c6ef5' },
  { name: 'Makine', value: 25, color: '#40c057' },
  { name: 'İpek', value: 15, color: '#fab005' },
  { name: 'Kilim', value: 12, color: '#e64980' },
  { name: 'Yün', value: 8, color: '#7950f2' },
  { name: 'Diğer', value: 5, color: '#868e96' },
]

const agencyPerformance = [
  { name: 'ABC Trading LLC', region: 'Doğu ABD', sales: 892450, target: 800000, orders: 28, avgOrderValue: 31873, commission: 44622, efficiency: 112, trend: [65, 72, 80, 75, 88, 92] },
  { name: 'West Coast Carpets', region: 'Batı ABD', sales: 654200, target: 700000, orders: 19, avgOrderValue: 34431, commission: 29439, efficiency: 93, trend: [50, 55, 62, 68, 58, 65] },
  { name: 'Southern Flooring Co.', region: 'Güney ABD', sales: 421800, target: 400000, orders: 14, avgOrderValue: 30128, commission: 21090, efficiency: 105, trend: [40, 45, 48, 52, 55, 58] },
  { name: 'Midwest Distributors', region: 'Orta ABD', sales: 318600, target: 350000, orders: 11, avgOrderValue: 28963, commission: 12744, efficiency: 91, trend: [30, 28, 35, 32, 38, 35] },
  { name: 'Texas Imports', region: 'Texas', sales: 245800, target: 250000, orders: 9, avgOrderValue: 27311, commission: 9832, efficiency: 98, trend: [20, 25, 22, 28, 30, 26] },
]

const staffPerformance = [
  { name: 'Ali Çelik', role: 'Satış Müdürü', sales: 456000, orders: 32, avgDeal: 14250, commission: 22800, target: 420000, achievement: 109 },
  { name: 'Fatma Özkan', role: 'Satış Temsilcisi', sales: 328000, orders: 24, avgDeal: 13667, commission: 16400, target: 320000, achievement: 103 },
  { name: 'Hasan Demir', role: 'Satış Temsilcisi', sales: 287000, orders: 19, avgDeal: 15105, commission: 14350, target: 300000, achievement: 96 },
  { name: 'Zeynep Yıldız', role: 'Jr. Satış', sales: 198000, orders: 15, avgDeal: 13200, commission: 9900, target: 200000, achievement: 99 },
]

const pnlData = {
  revenue: [
    { label: 'Yurt İçi Satışlar', amount: 3245000 },
    { label: 'Yurt Dışı Satışlar', amount: 1878000 },
    { label: 'Diğer Gelirler', amount: 45000 },
  ],
  cogs: [
    { label: 'Satılan Mal Maliyeti', amount: 2890000 },
    { label: 'Nakliye Giderleri', amount: 425000 },
  ],
  opex: [
    { label: 'Pazarlama ve Satış', amount: 312000 },
    { label: 'Genel Yönetim', amount: 245000 },
    { label: 'Komisyon Giderleri', amount: 198000 },
    { label: 'Personel Giderleri', amount: 456000 },
  ],
  other: [
    { label: 'Finansman Giderleri', amount: 78000 },
    { label: 'Kur Farkı (Net)', amount: -32000 },
  ],
}

function formatCurrency(val: number): string {
  return '$' + val.toLocaleString('en-US')
}

export default function ReportsPage() {
  const { hasPermission, user } = useAuth()
  const [period, setPeriod] = useState<ReportPeriod>('monthly')
  const [activeTab, setActiveTab] = useState<ReportTab>('summary')

  const canView = hasPermission('view_reports')
  const canViewCost = hasPermission('view_cost_price')

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Erişim Kısıtlı</h2>
          <p className="text-gray-500 mt-2">Rapor modülünü görüntüleme yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    )
  }

  const totalRevenue = pnlData.revenue.reduce((s, r) => s + r.amount, 0)
  const totalCogs = pnlData.cogs.reduce((s, r) => s + r.amount, 0)
  const grossProfit = totalRevenue - totalCogs
  const totalOpex = pnlData.opex.reduce((s, r) => s + r.amount, 0)
  const totalOther = pnlData.other.reduce((s, r) => s + r.amount, 0)
  const netProfit = grossProfit - totalOpex - totalOther

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Raporlar</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Detaylı performans ve finansal raporlar</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
          >
            {Object.entries(periodLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button className="flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
            <Download className="h-4 w-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-secondary dark:bg-surface-dark-secondary rounded-xl p-1 overflow-x-auto">
        {reportTabs.map((tab) => (
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

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Toplam Satış</span>
                <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$5,123,000</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +18.2% geçen yıla göre
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Sipariş Sayısı</span>
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2,847</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +12% geçen yıla göre
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Ort. Sipariş Değeri</span>
                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Target className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$1,799</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +5.5%
              </p>
            </div>
            {canViewCost && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Kâr Marjı</span>
                  <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">%25.6</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> +2.1 puan
                </p>
              </div>
            )}
          </div>

          {/* Sales vs Target Chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Satış vs Hedef ({periodLabels[period]})</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Legend />
                  <Bar dataKey="satis" name="Satış" fill="#4c6ef5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hedef" name="Hedef" fill="#e9ecef" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Sales Trends Tab */}
      {activeTab === 'sales_trends' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Satış Trendi</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Legend />
                  <Line type="monotone" dataKey="satis" name="Satış" stroke="#4c6ef5" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="hedef" name="Hedef" stroke="#e9ecef" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Kategori Dağılımı</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoryBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bölge Bazlı Satışlar</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agencyPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="region" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Bar dataKey="sales" name="Satış" fill="#4c6ef5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Analysis Tab */}
      {activeTab === 'product_analysis' && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-border dark:border-border-dark">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">En Çok Satan Ürünler</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Ürün</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Kategori</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Satılan</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Gelir</th>
                  {canViewCost && <th className="text-right px-4 py-3 font-medium text-gray-500">Marj %</th>}
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Stok</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={product.name} className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary/30">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                        index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{product.name}</td>
                    <td className="px-4 py-3 text-gray-500">{product.category}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">{product.sold}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{formatCurrency(product.revenue)}</td>
                    {canViewCost && (
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${product.margin > 25 ? 'text-green-600' : product.margin > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                          %{product.margin}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${product.stock < 50 ? 'text-red-600' : product.stock < 100 ? 'text-yellow-600' : 'text-gray-900 dark:text-white'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600 inline" />
                      ) : product.trend === 'down' ? (
                        <ArrowDownRight className="h-4 w-4 text-red-600 inline" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agency Report Tab */}
      {activeTab === 'agency_report' && (
        <div className="space-y-6">
          {/* Agency Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {agencyPerformance.map((agency) => (
              <div key={agency.name} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{agency.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{agency.region}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                    agency.efficiency >= 100
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                  }`}>
                    %{agency.efficiency} verimlilik
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Satış</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(agency.sales)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hedef</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(agency.target)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sipariş</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{agency.orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Komisyon</p>
                    <p className="text-sm font-bold text-brand-600">{formatCurrency(agency.commission)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Hedef gerçekleşme</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.round((agency.sales / agency.target) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        agency.sales >= agency.target ? 'bg-green-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${Math.min(100, (agency.sales / agency.target) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Staff Performance */}
          {canViewCost && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-border dark:border-border-dark">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Çalışan Performansı</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Çalışan</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Pozisyon</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Satış</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Sipariş</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Ort. Anlaşma</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Komisyon</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Hedef %</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPerformance.map((staff) => (
                    <tr key={staff.name} className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{staff.name}</td>
                      <td className="px-4 py-3 text-gray-500">{staff.role}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(staff.sales)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{staff.orders}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(staff.avgDeal)}</td>
                      <td className="px-4 py-3 text-right text-brand-600 font-medium">{formatCurrency(staff.commission)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                          staff.achievement >= 100
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        }`}>
                          {staff.achievement >= 100 && <Award className="h-3 w-3" />}
                          %{staff.achievement}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* P&L Tab */}
      {activeTab === 'pnl' && canViewCost && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Gelir / Gider Tablosu (2026)</h3>
            <div className="space-y-4">
              {/* Revenue */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">A. Gelirler</h4>
                {pnlData.revenue.map((item) => (
                  <div key={item.label} className="flex justify-between py-1.5 px-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-4 bg-green-50 dark:bg-green-900/10 rounded-lg mt-1 font-bold">
                  <span className="text-sm text-green-700 dark:text-green-400">Toplam Gelir</span>
                  <span className="text-sm text-green-700 dark:text-green-400">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>

              {/* COGS */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">B. Satışların Maliyeti</h4>
                {pnlData.cogs.map((item) => (
                  <div key={item.label} className="flex justify-between py-1.5 px-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="text-sm font-medium text-red-600">({formatCurrency(item.amount)})</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg mt-1 font-bold">
                  <span className="text-sm text-blue-700 dark:text-blue-400">Brüt Kâr</span>
                  <span className="text-sm text-blue-700 dark:text-blue-400">{formatCurrency(grossProfit)}</span>
                </div>
              </div>

              {/* OPEX */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">C. Faaliyet Giderleri</h4>
                {pnlData.opex.map((item) => (
                  <div key={item.label} className="flex justify-between py-1.5 px-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="text-sm font-medium text-red-600">({formatCurrency(item.amount)})</span>
                  </div>
                ))}
              </div>

              {/* Other */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">D. Diğer</h4>
                {pnlData.other.map((item) => (
                  <div key={item.label} className="flex justify-between py-1.5 px-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className={`text-sm font-medium ${item.amount < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.amount < 0 ? formatCurrency(Math.abs(item.amount)) : `(${formatCurrency(item.amount)})`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Net Profit */}
              <div className="flex justify-between py-3 px-4 bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 rounded-xl font-bold text-lg border-2 border-brand-200 dark:border-brand-800">
                <span className="text-brand-700 dark:text-brand-300">Net Kâr</span>
                <span className="text-brand-700 dark:text-brand-300">{formatCurrency(netProfit)}</span>
              </div>
              <p className="text-xs text-gray-500 text-right">Kâr marjı: %{((netProfit / totalRevenue) * 100).toFixed(1)}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
