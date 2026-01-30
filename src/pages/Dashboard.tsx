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

const revenueData = [
  { v: 42 }, { v: 58 }, { v: 45 }, { v: 72 }, { v: 65 },
  { v: 80 }, { v: 78 }, { v: 92 }, { v: 88 }, { v: 95 },
  { v: 102 }, { v: 110 },
]

const collectionData = [
  { v: 65 }, { v: 72 }, { v: 80 }, { v: 75 }, { v: 85 },
  { v: 88 }, { v: 92 }, { v: 90 },
]

const shipmentData = [
  { v: 3 }, { v: 5 }, { v: 2 }, { v: 7 }, { v: 4 },
  { v: 6 }, { v: 8 }, { v: 5 },
]

const overdueData = [
  { v: 12 }, { v: 8 }, { v: 15 }, { v: 10 }, { v: 6 },
  { v: 9 }, { v: 4 }, { v: 7 },
]

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

export default function Dashboard() {
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
          value="$284,520"
          change="+12.5%"
          changeType="positive"
          icon={DollarSign}
          chart={<MiniArea data={revenueData} color="#4c6ef5" />}
        />
        <KpiCard
          title="Tahsilat Oranı"
          value="%87.3"
          change="+3.2%"
          changeType="positive"
          icon={TrendingUp}
          chart={<MiniArea data={collectionData} color="#40c057" />}
        />
        <KpiCard
          title="Bekleyen Sevkiyat"
          value="14"
          change="3 acil"
          changeType="neutral"
          icon={Truck}
          chart={<MiniBar data={shipmentData} color="#748ffc" />}
        />
        <KpiCard
          title="Vadesi Geçen Alacaklar"
          value="$42,180"
          change="-8.1%"
          changeType="negative"
          icon={AlertCircle}
          chart={<MiniBar data={overdueData} color="#fa5252" />}
        />
      </div>
    </motion.div>
  )
}
