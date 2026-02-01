import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, TrendingUp, Truck, AlertCircle, ArrowUpRight,
  ArrowDownRight, ShoppingCart, Users, Package, Ship, Clock,
  CheckCircle, AlertTriangle, ArrowRight, Palette, FileText,
  CreditCard, Plus, Activity, XCircle, Sparkles,
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
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
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
      <Bar dataKey="v" fill={color} radius={[3, 3, 0, 0]} opacity={0.6} />
    </BarChart>
  </ResponsiveContainer>
)

const defaultChartData = [
  { v: 42 }, { v: 58 }, { v: 45 }, { v: 72 }, { v: 65 },
  { v: 80 }, { v: 78 }, { v: 92 }, { v: 88 }, { v: 95 },
  { v: 102 }, { v: 110 },
]

// ── Activity Feed ──────────────────────────────────────
const activityFeed = [
  { id: 'a1', icon: ShoppingCart, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/15', title: 'Yeni sipariş oluşturuldu', desc: 'ORD-2026-0152 — Dubai Interiors LLC ($78,400)', time: '3 dk önce', user: 'Ahmet K.' },
  { id: 'a2', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15', title: 'Tahsilat kaydedildi', desc: 'HomeStyle Inc. — $45,000 banka havalesi', time: '18 dk önce', user: 'Zeynep D.' },
  { id: 'a3', icon: Ship, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/15', title: 'Sevkiyat yola çıktı', desc: 'SHP-2026-0089 — Maersk Line, New York', time: '1 saat', user: 'Murat Y.' },
  { id: 'a4', icon: Palette, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/15', title: 'Numune onaylandı', desc: 'NUM-2026-0067 — HomeStyle Inc.', time: '2 saat', user: 'Elif A.' },
  { id: 'a5', icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/15', title: 'Fatura kesildi', desc: 'INV-2026-0198 — Berlin Teppich GmbH ($34,200)', time: '3 saat', user: 'Zeynep D.' },
]

// ── Alerts ───────────────────────────────────────────────
const alerts = [
  { id: 'al1', severity: 'critical' as const, icon: XCircle, title: 'Vadesi 30+ gün geçmiş', desc: 'Desert Home Decor — $33,984', action: 'Cariye Git', path: '/accounts' },
  { id: 'al2', severity: 'warning' as const, icon: AlertTriangle, title: 'Kritik stok seviyesi', desc: 'Bambu Halı Doğal: 12 adet', action: 'Stok Detay', path: '/stock-analysis' },
]

// ── Order Pipeline ───────────────────────────────────────
const orderPipeline = [
  { label: 'Teklif', count: 8, amount: '$124K', color: '#94a3b8' },
  { label: 'Onaylandı', count: 12, amount: '$286K', color: '#4c6ef5' },
  { label: 'Üretimde', count: 6, amount: '$178K', color: '#f59e0b' },
  { label: 'Sevkiyatta', count: 4, amount: '$95K', color: '#8b5cf6' },
  { label: 'Teslim', count: 22, amount: '$520K', color: '#22c55e' },
]
const pieData = orderPipeline.map(p => ({ name: p.label, value: p.count }))

// ── Top Customers ────────────────────────────────────────
const topCustomers = [
  { name: 'HomeStyle Inc.', city: 'New York', revenue: '$145,200', orders: 8, trend: '+23%' },
  { name: 'Dubai Interiors LLC', city: 'Dubai', revenue: '$128,400', orders: 6, trend: '+18%' },
  { name: 'Berlin Teppich GmbH', city: 'Berlin', revenue: '$98,700', orders: 5, trend: '+12%' },
  { name: 'London Carpets Ltd.', city: 'Londra', revenue: '$87,300', orders: 4, trend: '+8%' },
  { name: 'Luxury Floors NY', city: 'Los Angeles', revenue: '$76,500', orders: 3, trend: '-5%' },
]

// ── Upcoming ─────────────────────────────────────────────
const upcoming = [
  { label: 'SHP-2026-0089 ETA', detail: 'New York — 18 Şub', days: 18, icon: Ship },
  { label: 'SHP-2026-0088 ETA', detail: 'Los Angeles — 08 Şub', days: 8, icon: Ship },
  { label: 'Berlin sipariş teslim', detail: 'ORD-2026-0140', days: 5, icon: Package },
  { label: 'Komisyon ödeme', detail: 'ABC Trading LLC', days: 3, icon: CreditCard },
]

// ── Quick Actions ────────────────────────────────────────
const quickActions = [
  { label: 'Yeni Sipariş', icon: Plus, gradient: 'from-brand-500 to-brand-700', path: '/orders' },
  { label: 'Yeni Teklif', icon: FileText, gradient: 'from-blue-500 to-blue-700', path: '/quotations' },
  { label: 'Numune Gönder', icon: Palette, gradient: 'from-purple-500 to-purple-700', path: '/samples' },
  { label: 'Sevkiyat', icon: Ship, gradient: 'from-cyan-500 to-cyan-700', path: '/shipments' },
  { label: 'Tahsilat', icon: CreditCard, gradient: 'from-emerald-500 to-emerald-700', path: '/accounting' },
  { label: 'Rapor', icon: FileText, gradient: 'from-amber-500 to-amber-700', path: '/reports' },
]

export default function Dashboard() {
  const { data: kpis } = useDashboardKpisQuery()
  const { user } = useAuth()
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

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04 } },
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  }

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-5">
      {/* Hero Header with mesh gradient */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl bg-white dark:bg-surface-dark-secondary border border-border dark:border-border-dark p-6">
        <div className="mesh-gradient absolute inset-0 pointer-events-none" />
        <div className="dot-pattern absolute inset-0 pointer-events-none opacity-40" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-brand-500" />
              <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {greeting}, <span className="gradient-text">{user?.fullName?.split(' ')[0] ?? 'Kullanıcı'}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              İşte bugünkü iş durumunuzun özeti
            </p>
          </div>

          {/* Alert badges */}
          {alerts.length > 0 && (
            <div className="hidden lg:flex flex-col gap-1.5">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => navigate(alert.path)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-all hover:-translate-y-0.5 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/20'
                      : 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/20'
                  }`}
                >
                  <alert.icon className="h-3 w-3" />
                  <span>{alert.title}: {alert.desc}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Aylık Gelir" value={revenue} change={revenueChange} changeType="positive" icon={DollarSign} delay={0} chart={<MiniArea data={defaultChartData} color="#4c6ef5" />} />
        <KpiCard title="Tahsilat Oranı" value={collectionRate} change={collectionChange} changeType="positive" icon={TrendingUp} delay={1} chart={<MiniArea data={defaultChartData.slice(0, 8)} color="#40c057" />} />
        <KpiCard title="Bekleyen Sevkiyat" value={pendingShipments} change={shipmentNote} changeType="neutral" icon={Truck} delay={2} chart={<MiniBar data={defaultChartData.slice(0, 8)} color="#748ffc" />} />
        <KpiCard title="Vadesi Geçen" value={overdueAmount} change={overdueChange} changeType="negative" icon={AlertCircle} delay={3} chart={<MiniBar data={defaultChartData.slice(0, 8)} color="#fa5252" />} />
      </div>

      {/* Bento Grid: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Activity Feed — spans 5 */}
        <motion.div variants={fadeUp} className="lg:col-span-5 rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border dark:border-border-dark">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-brand-600" />
              <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white">Son Aktiviteler</h2>
            </div>
            <button onClick={() => navigate('/activity')} className="text-[11px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              Tümü <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-border/50 dark:divide-border-dark/50">
            {activityFeed.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-secondary/40 dark:hover:bg-surface-dark-tertiary/40 transition-colors"
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                  <p className="text-[10px] text-gray-400 truncate">{item.desc}</p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Order Pipeline — spans 4 */}
        <motion.div variants={fadeUp} className="lg:col-span-4 rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-5">
          <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-3">Sipariş Pipeline</h2>
          <div className="flex items-center justify-center mb-3">
            <div className="h-24 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={44} paddingAngle={3} strokeWidth={0}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={orderPipeline[i].color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-1.5">
            {orderPipeline.map((stage) => (
              <div key={stage.label} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-gray-500 dark:text-gray-400">{stage.label}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-gray-900 dark:text-white">{stage.count}</span>
                  <span className="text-gray-400 w-10 text-right">{stage.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions + Upcoming — spans 3 */}
        <div className="lg:col-span-3 space-y-3">
          {/* Quick Actions */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4">
            <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-3">Hızlı İşlemler</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-all hover:-translate-y-0.5 group"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${action.gradient} text-white shadow-sm group-hover:shadow-md transition-shadow`}>
                    <action.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Upcoming */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4">
            <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-2.5">Yaklaşan</h2>
            <div className="space-y-2">
              {upcoming.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-secondary dark:bg-surface-dark-tertiary">
                    <item.icon className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">{item.label}</p>
                    <p className="text-[10px] text-gray-400">{item.detail}</p>
                  </div>
                  <span className={`text-[10px] font-bold tabular-nums ${item.days <= 3 ? 'text-red-500' : item.days <= 7 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {item.days}g
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom: Top Customers */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border dark:border-border-dark">
          <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white">En İyi Müşteriler (Bu Ay)</h2>
          <button onClick={() => navigate('/accounts')} className="text-[11px] text-brand-600 hover:text-brand-700 font-medium">
            Tümü →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border/50 dark:border-border-dark/50">
                <th className="text-left font-medium text-gray-400 px-5 py-2">#</th>
                <th className="text-left font-medium text-gray-400 px-5 py-2">Müşteri</th>
                <th className="text-right font-medium text-gray-400 px-5 py-2">Ciro</th>
                <th className="text-right font-medium text-gray-400 px-5 py-2">Sipariş</th>
                <th className="text-right font-medium text-gray-400 px-5 py-2">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
              {topCustomers.map((c, i) => (
                <tr key={c.name} className="hover:bg-surface-secondary/40 dark:hover:bg-surface-dark-tertiary/40 transition-colors">
                  <td className="px-5 py-2">
                    <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600">{String(i + 1).padStart(2, '0')}</span>
                  </td>
                  <td className="px-5 py-2">
                    <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                    <p className="text-[10px] text-gray-400">{c.city}</p>
                  </td>
                  <td className="text-right px-5 py-2 font-semibold text-gray-900 dark:text-white tabular-nums">{c.revenue}</td>
                  <td className="text-right px-5 py-2 text-gray-500 tabular-nums">{c.orders}</td>
                  <td className="text-right px-5 py-2">
                    <span className={`inline-flex items-center gap-0.5 font-semibold ${c.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
                      {c.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {c.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
