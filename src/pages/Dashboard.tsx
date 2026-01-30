import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Truck,
  AlertCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import KpiCard from '../components/KpiCard'
import { useDashboardKpisQuery } from '../hooks/useIpc'

const MiniArea = ({ data, color }: { data: { v: number }[]; color: string }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={1.5}
        fill={`url(#grad-${color})`}
      />
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

export default function Dashboard() {
  const { data: kpis } = useDashboardKpisQuery()

  const revenue = kpis?.monthlyRevenue ?? '$284,520'
  const revenueChange = kpis?.revenueChange ?? '+12.5%'
  const collectionRate = kpis?.collectionRate ?? '%87.3'
  const collectionChange = kpis?.collectionChange ?? '+3.2%'
  const pendingShipments = kpis?.pendingShipments ?? '14'
  const shipmentNote = kpis?.shipmentNote ?? '3 acil'
  const overdueAmount = kpis?.overdueAmount ?? '$42,180'
  const overdueChange = kpis?.overdueChange ?? '-8.1%'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Gösterge Paneli
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Günlük iş performansınızın özeti
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Aylık Gelir"
          value={revenue}
          change={revenueChange}
          changeType="positive"
          icon={DollarSign}
          chart={<MiniArea data={defaultChartData} color="#4c6ef5" />}
        />
        <KpiCard
          title="Tahsilat Oranı"
          value={collectionRate}
          change={collectionChange}
          changeType="positive"
          icon={TrendingUp}
          chart={<MiniArea data={defaultChartData.slice(0, 8)} color="#40c057" />}
        />
        <KpiCard
          title="Bekleyen Sevkiyat"
          value={pendingShipments}
          change={shipmentNote}
          changeType="neutral"
          icon={Truck}
          chart={<MiniBar data={defaultChartData.slice(0, 8)} color="#748ffc" />}
        />
        <KpiCard
          title="Vadesi Geçen Alacaklar"
          value={overdueAmount}
          change={overdueChange}
          changeType="negative"
          icon={AlertCircle}
          chart={<MiniBar data={defaultChartData.slice(0, 8)} color="#fa5252" />}
        />
      </div>
    </motion.div>
  )
}
