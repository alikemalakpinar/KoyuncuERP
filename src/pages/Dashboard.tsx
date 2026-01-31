import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, TrendingUp, Truck, AlertCircle, ArrowUpRight,
  ArrowDownRight, ShoppingCart, Users, Package, Ship, Clock,
  CheckCircle, AlertTriangle, ArrowRight, Palette, FileText,
  CreditCard, Plus, Activity, Eye, XCircle,
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell,
} from 'recharts'
import KpiCard from '../components/KpiCard'
import { useDashboardKpisQuery } from '../hooks/useIpc'
import { useAuth } from '../contexts/AuthContext'

const MiniArea = ({ data, color }: { data: { v: number }[]; color: string }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#grad-${color})`} />
    </AreaChart>
  </ResponsiveContainer>
)

const MiniBar = ({ data, color }: { data: { v: number }[]; color: string }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} opacity={0.7} />
    </BarChart>
  </ResponsiveContainer>
)

const defaultChartData = [
  { v: 42 }, { v: 58 }, { v: 45 }, { v: 72 }, { v: 65 },
  { v: 80 }, { v: 78 }, { v: 92 }, { v: 88 }, { v: 95 },
  { v: 102 }, { v: 110 },
]

// ── Activity Feed Data ──────────────────────────────────────
const activityFeed = [
  { id: 'a1', type: 'order' as const, icon: ShoppingCart, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20', title: 'Yeni sipariş oluşturuldu', desc: 'ORD-2026-0152 — Dubai Interiors LLC ($78,400)', time: '3 dk önce', user: 'Ahmet Koyuncu' },
  { id: 'a2', type: 'payment' as const, icon: CreditCard, color: 'text-green-600 bg-green-50 dark:bg-green-900/20', title: 'Tahsilat kaydedildi', desc: 'HomeStyle Inc. — $45,000 banka havalesi', time: '18 dk önce', user: 'Zeynep Demir' },
  { id: 'a3', type: 'shipment' as const, icon: Ship, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', title: 'Sevkiyat yola çıktı', desc: 'SHP-2026-0089 — Maersk Line, New York', time: '1 saat önce', user: 'Murat Yılmaz' },
  { id: 'a4', type: 'sample' as const, icon: Palette, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', title: 'Numune onaylandı', desc: 'NUM-2026-0067 — HomeStyle Inc. toplu siparişe dönecek', time: '2 saat önce', user: 'Elif Aktaş' },
  { id: 'a5', type: 'invoice' as const, icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', title: 'Fatura kesildi', desc: 'INV-2026-0198 — Berlin Teppich GmbH ($34,200)', time: '3 saat önce', user: 'Zeynep Demir' },
  { id: 'a6', type: 'account' as const, icon: Users, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20', title: 'Yeni cari eklendi', desc: 'Pacific Rugs — San Francisco, ABD', time: '5 saat önce', user: 'Ahmet Koyuncu' },
]

// ── Alerts ───────────────────────────────────────────────────
const alerts = [
  { id: 'al1', severity: 'critical' as const, icon: XCircle, title: 'Vadesi 30+ gün geçmiş', desc: 'Desert Home Decor — $33,984', action: 'Cariye Git', path: '/accounts' },
  { id: 'al2', severity: 'warning' as const, icon: AlertTriangle, title: 'Kritik stok seviyesi', desc: 'Bambu Halı Doğal: 12 adet (min: 25)', action: 'Stok Detay', path: '/stock-analysis' },
  { id: 'al3', severity: 'warning' as const, icon: Clock, title: 'Onay bekleyen komisyon', desc: 'ABC Trading LLC — $12,340', action: 'Komisyonlar', path: '/commissions' },
]

// ── Order Pipeline ───────────────────────────────────────────
const orderPipeline = [
  { label: 'Teklif', count: 8, amount: '$124K', color: '#94a3b8' },
  { label: 'Onaylandı', count: 12, amount: '$286K', color: '#4c6ef5' },
  { label: 'Üretimde', count: 6, amount: '$178K', color: '#f59e0b' },
  { label: 'Sevkiyatta', count: 4, amount: '$95K', color: '#8b5cf6' },
  { label: 'Teslim', count: 22, amount: '$520K', color: '#22c55e' },
]

const pieData = orderPipeline.map(p => ({ name: p.label, value: p.count }))

// ── Top Customers ────────────────────────────────────────────
const topCustomers = [
  { name: 'HomeStyle Inc.', city: 'New York', revenue: '$145,200', orders: 8, trend: '+23%' },
  { name: 'Dubai Interiors LLC', city: 'Dubai', revenue: '$128,400', orders: 6, trend: '+18%' },
  { name: 'Berlin Teppich GmbH', city: 'Berlin', revenue: '$98,700', orders: 5, trend: '+12%' },
  { name: 'London Carpets Ltd.', city: 'Londra', revenue: '$87,300', orders: 4, trend: '+8%' },
  { name: 'Luxury Floors NY', city: 'Los Angeles', revenue: '$76,500', orders: 3, trend: '-5%' },
]

// ── Upcoming ─────────────────────────────────────────────────
const upcoming = [
  { label: 'SHP-2026-0089 ETA', detail: 'New York — 18 Şub', days: 18, icon: Ship },
  { label: 'SHP-2026-0088 ETA', detail: 'Los Angeles — 08 Şub', days: 8, icon: Ship },
  { label: 'Berlin sipariş teslim', detail: 'ORD-2026-0140', days: 5, icon: Package },
  { label: 'Komisyon ödeme', detail: 'ABC Trading LLC', days: 3, icon: CreditCard },
]

export default function Dashboard() {
  const { data: kpis } = useDashboardKpisQuery()
  const { user, role, hasPermission } = useAuth()
  const navigate = useNavigate()

  const revenue = kpis?.monthlyRevenue ?? '$284,520'
  const revenueChange = kpis?.revenueChange ?? '+12.5%'
  const collectionRate = kpis?.collectionRate ?? '%87.3'
  const collectionChange = kpis?.collectionChange ?? '+3.2%'
  const pendingShipments = kpis?.pendingShipments ?? '14'
  const shipmentNote = kpis?.shipmentNote ?? '3 acil'
  const overdueAmount = kpis?.overdueAmount ?? '$42,180'
  const overdueChange = kpis?.overdueChange ?? '-8.1%'

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Günaydın'
    if (h < 18) return 'İyi günler'
    return 'İyi akşamlar'
  })()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {greeting}, {user?.fullName?.split(' ')[0] ?? 'Kullanıcı'}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            İşte bugünkü iş durumunuzun özeti
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${
                alert.severity === 'critical'
                  ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30'
                  : 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30'
              }`}
            >
              <alert.icon className={`h-4 w-4 shrink-0 ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-semibold ${alert.severity === 'critical' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {alert.title}
                </span>
                <span className="text-xs text-gray-500 ml-2">{alert.desc}</span>
              </div>
              <button
                onClick={() => navigate(alert.path)}
                className={`shrink-0 text-[11px] font-medium rounded-lg px-2.5 py-1 transition-colors ${
                  alert.severity === 'critical'
                    ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20'
                    : 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                }`}
              >
                {alert.action} →
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Aylık Gelir" value={revenue} change={revenueChange} changeType="positive" icon={DollarSign} chart={<MiniArea data={defaultChartData} color="#4c6ef5" />} />
        <KpiCard title="Tahsilat Oranı" value={collectionRate} change={collectionChange} changeType="positive" icon={TrendingUp} chart={<MiniArea data={defaultChartData.slice(0, 8)} color="#40c057" />} />
        <KpiCard title="Bekleyen Sevkiyat" value={pendingShipments} change={shipmentNote} changeType="neutral" icon={Truck} chart={<MiniBar data={defaultChartData.slice(0, 8)} color="#748ffc" />} />
        <KpiCard title="Vadesi Geçen" value={overdueAmount} change={overdueChange} changeType="negative" icon={AlertCircle} chart={<MiniBar data={defaultChartData.slice(0, 8)} color="#fa5252" />} />
      </div>

      {/* Main Grid: Activity + Pipeline + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Feed */}
        <div className="lg:col-span-2 rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border dark:border-border-dark">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Son Aktiviteler</h2>
            </div>
            <button onClick={() => navigate('/activity')} className="text-[11px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              Tümünü Gör <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-border/50 dark:divide-border-dark/50">
            {activityFeed.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 px-5 py-3 hover:bg-surface-secondary/30 dark:hover:bg-surface-dark-secondary/30 transition-colors"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 dark:text-white">{item.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{item.desc}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-gray-400">{item.time}</p>
                  <p className="text-[10px] text-gray-400">{item.user}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Pipeline + Upcoming */}
        <div className="space-y-4">
          {/* Order Pipeline */}
          <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Sipariş Pipeline</h2>
            <div className="flex items-center justify-center mb-4">
              <div className="h-28 w-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} strokeWidth={0}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={orderPipeline[i].color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-2">
              {orderPipeline.map((stage) => (
                <div key={stage.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-gray-600 dark:text-gray-400">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{stage.count}</span>
                    <span className="text-gray-400 w-12 text-right">{stage.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Yaklaşan</h2>
            <div className="space-y-2.5">
              {upcoming.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary dark:bg-surface-dark-secondary">
                    <item.icon className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-gray-900 dark:text-white truncate">{item.label}</p>
                    <p className="text-[10px] text-gray-500">{item.detail}</p>
                  </div>
                  <span className={`text-[11px] font-semibold ${item.days <= 3 ? 'text-red-500' : item.days <= 7 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {item.days} gün
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Customers + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Customers */}
        <div className="lg:col-span-2 rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border dark:border-border-dark">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">En İyi Müşteriler (Bu Ay)</h2>
            <button onClick={() => navigate('/accounts')} className="text-[11px] text-brand-600 hover:text-brand-700 font-medium">
              Tümü →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 dark:border-border-dark/50">
                  <th className="text-left font-medium text-gray-400 px-5 py-2.5">Müşteri</th>
                  <th className="text-right font-medium text-gray-400 px-5 py-2.5">Ciro</th>
                  <th className="text-right font-medium text-gray-400 px-5 py-2.5">Sipariş</th>
                  <th className="text-right font-medium text-gray-400 px-5 py-2.5">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
                {topCustomers.map((c, i) => (
                  <tr key={c.name} className="hover:bg-surface-secondary/30 dark:hover:bg-surface-dark-secondary/30 transition-colors">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 text-[10px] font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                          <p className="text-[10px] text-gray-400">{c.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-5 py-2.5 font-semibold text-gray-900 dark:text-white">{c.revenue}</td>
                    <td className="text-right px-5 py-2.5 text-gray-500">{c.orders}</td>
                    <td className="text-right px-5 py-2.5">
                      <span className={`inline-flex items-center gap-0.5 font-medium ${c.trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                        {c.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {c.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Yeni Sipariş', icon: Plus, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20', path: '/orders' },
              { label: 'Yeni Teklif', icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', path: '/quotations' },
              { label: 'Numune Gönder', icon: Palette, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', path: '/samples' },
              { label: 'Sevkiyat Oluştur', icon: Ship, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20', path: '/shipments' },
              { label: 'Tahsilat Kaydet', icon: CreditCard, color: 'text-green-600 bg-green-50 dark:bg-green-900/20', path: '/accounting' },
              { label: 'Rapor Oluştur', icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', path: '/reports' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/50 dark:border-border-dark/50 p-3 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all group"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
