import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Award, TrendingUp, DollarSign, Target, ArrowUpRight,
  ArrowDownRight, Calendar, Download, Star, Zap, UserCheck,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'

type PerfTab = 'agencies' | 'staff' | 'comparison'

const tabs: { key: PerfTab; label: string; icon: typeof Users }[] = [
  { key: 'agencies', label: 'Acente Performansı', icon: Users },
  { key: 'staff', label: 'Çalışan Performansı', icon: UserCheck },
  { key: 'comparison', label: 'Karşılaştırma', icon: Target },
]

const agencyDetails = [
  {
    id: '1', name: 'ABC Trading LLC', region: 'Doğu ABD', contact: 'Robert Johnson',
    totalSales: 892450, target: 800000, orders: 28, delivered: 24, pending: 4,
    commission: 44622, paidCommission: 32282, pendingCommission: 12340,
    avgOrderValue: 31873, returnRate: 2.1, customerSatisfaction: 4.6,
    monthly: [
      { month: 'Tem', sales: 62000 }, { month: 'Ağu', sales: 58000 },
      { month: 'Eyl', sales: 78000 }, { month: 'Eki', sales: 85000 },
      { month: 'Kas', sales: 98000 }, { month: 'Ara', sales: 112000 },
    ],
    topProducts: ['El Dokuma Halı - Kayseri', 'İpek Halı - Hereke', 'Yün Halı - Uşak'],
    payments: [
      { date: '2026-01-15', amount: 8500, type: 'Komisyon Ödemesi' },
      { date: '2025-12-28', amount: 12400, type: 'Komisyon Ödemesi' },
      { date: '2025-12-15', amount: 11382, type: 'Komisyon Ödemesi' },
    ],
  },
  {
    id: '2', name: 'West Coast Carpets', region: 'Batı ABD', contact: 'Sarah Williams',
    totalSales: 654200, target: 700000, orders: 19, delivered: 16, pending: 3,
    commission: 29439, paidCommission: 21319, pendingCommission: 8120,
    avgOrderValue: 34431, returnRate: 3.4, customerSatisfaction: 4.3,
    monthly: [
      { month: 'Tem', sales: 48000 }, { month: 'Ağu', sales: 42000 },
      { month: 'Eyl', sales: 56000 }, { month: 'Eki', sales: 62000 },
      { month: 'Kas', sales: 72000 }, { month: 'Ara', sales: 78000 },
    ],
    topProducts: ['Makine Halısı - Modern', 'Patchwork Halı', 'Bambu Halı - Doğal'],
    payments: [
      { date: '2026-01-10', amount: 6200, type: 'Komisyon Ödemesi' },
      { date: '2025-12-20', amount: 8400, type: 'Komisyon Ödemesi' },
    ],
  },
  {
    id: '3', name: 'Southern Flooring Co.', region: 'Güney ABD', contact: 'Michael Brown',
    totalSales: 421800, target: 400000, orders: 14, delivered: 12, pending: 2,
    commission: 21090, paidCommission: 15420, pendingCommission: 5670,
    avgOrderValue: 30128, returnRate: 1.8, customerSatisfaction: 4.7,
    monthly: [
      { month: 'Tem', sales: 32000 }, { month: 'Ağu', sales: 28000 },
      { month: 'Eyl', sales: 38000 }, { month: 'Eki', sales: 42000 },
      { month: 'Kas', sales: 48000 }, { month: 'Ara', sales: 52000 },
    ],
    topProducts: ['Kilim - Antik Desen', 'El Dokuma Halı - Kayseri'],
    payments: [
      { date: '2026-01-05', amount: 5200, type: 'Komisyon Ödemesi' },
      { date: '2025-12-18', amount: 5670, type: 'Komisyon Ödemesi' },
    ],
  },
]

const staffDetails = [
  {
    name: 'Ali Çelik', role: 'Kıdemli Satış Müdürü', department: 'Satış',
    sales: 456000, target: 420000, orders: 32, customers: 18, newCustomers: 5,
    commission: 22800, avgDealSize: 14250, conversionRate: 78,
    monthly: [
      { month: 'Tem', sales: 35000 }, { month: 'Ağu', sales: 32000 },
      { month: 'Eyl', sales: 42000 }, { month: 'Eki', sales: 48000 },
      { month: 'Kas', sales: 52000 }, { month: 'Ara', sales: 58000 },
    ],
    skills: { satis: 92, musteri: 88, urun: 85, takip: 90, raporlama: 78 },
  },
  {
    name: 'Fatma Özkan', role: 'Satış Temsilcisi', department: 'Satış',
    sales: 328000, target: 320000, orders: 24, customers: 14, newCustomers: 4,
    commission: 16400, avgDealSize: 13667, conversionRate: 72,
    monthly: [
      { month: 'Tem', sales: 25000 }, { month: 'Ağu', sales: 22000 },
      { month: 'Eyl', sales: 30000 }, { month: 'Eki', sales: 35000 },
      { month: 'Kas', sales: 38000 }, { month: 'Ara', sales: 42000 },
    ],
    skills: { satis: 85, musteri: 90, urun: 82, takip: 85, raporlama: 88 },
  },
  {
    name: 'Hasan Demir', role: 'Satış Temsilcisi', department: 'Satış',
    sales: 287000, target: 300000, orders: 19, customers: 12, newCustomers: 3,
    commission: 14350, avgDealSize: 15105, conversionRate: 65,
    monthly: [
      { month: 'Tem', sales: 22000 }, { month: 'Ağu', sales: 20000 },
      { month: 'Eyl', sales: 28000 }, { month: 'Eki', sales: 30000 },
      { month: 'Kas', sales: 32000 }, { month: 'Ara', sales: 35000 },
    ],
    skills: { satis: 78, musteri: 80, urun: 90, takip: 72, raporlama: 75 },
  },
  {
    name: 'Zeynep Yıldız', role: 'Jr. Satış Temsilcisi', department: 'Satış',
    sales: 198000, target: 200000, orders: 15, customers: 10, newCustomers: 6,
    commission: 9900, avgDealSize: 13200, conversionRate: 60,
    monthly: [
      { month: 'Tem', sales: 15000 }, { month: 'Ağu', sales: 14000 },
      { month: 'Eyl', sales: 18000 }, { month: 'Eki', sales: 22000 },
      { month: 'Kas', sales: 25000 }, { month: 'Ara', sales: 28000 },
    ],
    skills: { satis: 70, musteri: 82, urun: 72, takip: 80, raporlama: 85 },
  },
]

const radarData = staffDetails.map(s => ({
  subject: s.name.split(' ')[0],
  satis: s.skills.satis,
  musteri: s.skills.musteri,
  urun: s.skills.urun,
  takip: s.skills.takip,
  raporlama: s.skills.raporlama,
}))

function formatCurrency(val: number): string {
  return '$' + val.toLocaleString('en-US')
}

export default function PerformancePage() {
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState<PerfTab>('agencies')
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null)

  const canViewAll = hasPermission('view_all_agencies')
  const canViewCost = hasPermission('view_cost_price')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Performans Merkezi</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Acente ve çalışan performans analizi</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary">
          <Download className="h-4 w-4" />
          Rapor İndir
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-secondary dark:bg-surface-dark-secondary rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-surface-dark text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Agencies Tab */}
      {activeTab === 'agencies' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="card p-5">
              <p className="text-sm text-gray-500 mb-1">Toplam Acente Satışı</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(agencyDetails.reduce((s, a) => s + a.totalSales, 0))}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500 mb-1">Toplam Komisyon</p>
              <p className="text-2xl font-bold text-brand-600">
                {formatCurrency(agencyDetails.reduce((s, a) => s + a.commission, 0))}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500 mb-1">Ödenen Komisyon</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(agencyDetails.reduce((s, a) => s + a.paidCommission, 0))}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-500 mb-1">Bekleyen Komisyon</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(agencyDetails.reduce((s, a) => s + a.pendingCommission, 0))}
              </p>
            </div>
          </div>

          {/* Agency Detail Cards */}
          {agencyDetails.map((agency) => (
            <div key={agency.id} className="card overflow-hidden">
              <div className="p-5 border-b border-border dark:border-border-dark">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{agency.name}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        (agency.totalSales / agency.target) >= 1
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                      }`}>
                        {(agency.totalSales / agency.target) >= 1 && <Star className="h-3 w-3" />}
                        %{Math.round((agency.totalSales / agency.target) * 100)} hedef
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{agency.region} | İletişim: {agency.contact}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(agency.customerSatisfaction) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                    <span className="text-sm font-medium text-gray-600 ml-1">{agency.customerSatisfaction}</span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-5">
                  <div>
                    <p className="text-xs text-gray-500">Satış</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(agency.totalSales)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hedef</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(agency.target)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sipariş</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{agency.orders} ({agency.delivered} teslim)</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ort. Sipariş</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(agency.avgOrderValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Komisyon</p>
                    <p className="text-sm font-bold text-brand-600">{formatCurrency(agency.commission)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ödenen</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(agency.paidCommission)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bekleyen</p>
                    <p className="text-sm font-bold text-orange-600">{formatCurrency(agency.pendingCommission)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Monthly Chart */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Aylık Satış Trendi</h4>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agency.monthly}>
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(val: number) => formatCurrency(val)} />
                          <Bar dataKey="sales" fill="#4c6ef5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Payments & Products */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Son Ödemeler</h4>
                      <div className="space-y-2">
                        {agency.payments.map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{p.date}</span>
                            <span className="font-medium text-green-600">{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">En Çok Satan Ürünler</h4>
                      <div className="space-y-2">
                        {agency.topProducts.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-white font-bold ${
                              i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-400'
                            }`} style={{ fontSize: '9px' }}>
                              {i + 1}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Hedef gerçekleşme</span>
                    <span className="font-bold">{Math.round((agency.totalSales / agency.target) * 100)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        agency.totalSales >= agency.target ? 'bg-green-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${Math.min(100, (agency.totalSales / agency.target) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && canViewCost && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {staffDetails.map((staff) => (
              <div key={staff.name} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{staff.name}</h3>
                      <p className="text-xs text-gray-500">{staff.role}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                    staff.sales >= staff.target
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                  }`}>
                    {staff.sales >= staff.target && <Award className="h-3 w-3" />}
                    %{Math.round((staff.sales / staff.target) * 100)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-lg bg-surface-secondary dark:bg-surface-dark-secondary p-2.5 text-center">
                    <p className="text-xs text-gray-500">Satış</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(staff.sales)}</p>
                  </div>
                  <div className="rounded-lg bg-surface-secondary dark:bg-surface-dark-secondary p-2.5 text-center">
                    <p className="text-xs text-gray-500">Sipariş</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{staff.orders}</p>
                  </div>
                  <div className="rounded-lg bg-surface-secondary dark:bg-surface-dark-secondary p-2.5 text-center">
                    <p className="text-xs text-gray-500">Komisyon</p>
                    <p className="text-sm font-bold text-brand-600">{formatCurrency(staff.commission)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                  <div>
                    <span className="text-gray-500">Müşteri: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{staff.customers}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Yeni: </span>
                    <span className="font-medium text-green-600">+{staff.newCustomers}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dönüşüm: </span>
                    <span className="font-medium text-gray-900 dark:text-white">%{staff.conversionRate}</span>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={staff.monthly}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Bar dataKey="sales" fill="#4c6ef5" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Progress */}
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${staff.sales >= staff.target ? 'bg-green-500' : 'bg-brand-500'}`}
                      style={{ width: `${Math.min(100, (staff.sales / staff.target) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Acente Satış Karşılaştırması</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agencyDetails.map(a => ({ name: a.name.split(' ')[0], satis: a.totalSales, hedef: a.target }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Legend />
                    <Bar dataKey="satis" name="Satış" fill="#4c6ef5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hedef" name="Hedef" fill="#e9ecef" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {canViewCost && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Çalışan Yetkinlik Radar</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { subject: 'Satış', Ali: 92, Fatma: 85, Hasan: 78, Zeynep: 70 },
                      { subject: 'Müşteri', Ali: 88, Fatma: 90, Hasan: 80, Zeynep: 82 },
                      { subject: 'Ürün Bilgisi', Ali: 85, Fatma: 82, Hasan: 90, Zeynep: 72 },
                      { subject: 'Takip', Ali: 90, Fatma: 85, Hasan: 72, Zeynep: 80 },
                      { subject: 'Raporlama', Ali: 78, Fatma: 88, Hasan: 75, Zeynep: 85 },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name="Ali" dataKey="Ali" stroke="#4c6ef5" fill="#4c6ef5" fillOpacity={0.2} />
                      <Radar name="Fatma" dataKey="Fatma" stroke="#40c057" fill="#40c057" fillOpacity={0.2} />
                      <Radar name="Hasan" dataKey="Hasan" stroke="#fab005" fill="#fab005" fillOpacity={0.2} />
                      <Radar name="Zeynep" dataKey="Zeynep" stroke="#e64980" fill="#e64980" fillOpacity={0.2} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Comparison table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-border dark:border-border-dark">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Acente Karşılaştırma Tablosu</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Acente</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Satış</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Hedef</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Başarı</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Sipariş</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Ort. Sipariş</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Komisyon</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">İade %</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Memnuniyet</th>
                </tr>
              </thead>
              <tbody>
                {agencyDetails.map((agency) => (
                  <tr key={agency.id} className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{agency.name}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(agency.totalSales)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(agency.target)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        agency.totalSales >= agency.target
                          ? 'bg-green-50 text-green-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}>
                        %{Math.round((agency.totalSales / agency.target) * 100)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{agency.orders}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(agency.avgOrderValue)}</td>
                    <td className="px-4 py-3 text-right text-brand-600 font-medium">{formatCurrency(agency.commission)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">%{agency.returnRate}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium">{agency.customerSatisfaction}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}
