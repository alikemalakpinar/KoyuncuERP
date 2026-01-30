import { motion } from 'framer-motion'
import {
  Handshake,
  DollarSign,
  Clock,
  Users,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useAgencyPerformance } from '../hooks/useAnalytics'

export default function AgencyCommissionsPage() {
  const agencies = useAgencyPerformance()

  const totalCommission = agencies.reduce(
    (sum, a) => sum + parseFloat(a.commission.replace(/,/g, '')),
    0,
  )
  const totalPending = agencies.reduce(
    (sum, a) => sum + parseFloat(a.pendingCommission.replace(/,/g, '')),
    0,
  )
  const totalOrders = agencies.reduce((sum, a) => sum + a.orderCount, 0)

  const chartData = agencies.map((a) => ({
    name: a.name.split(' ')[0],
    satis: parseFloat(a.totalSales.replace(/,/g, '')) / 1000,
    komisyon: parseFloat(a.commission.replace(/,/g, '')) / 1000,
  }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Acente Hakedisleri
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Acente komisyon takibi ve performans analizi
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="kpi-card"
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            <Handshake className="h-4 w-4" />
            Aktif Acente
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {agencies.length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="kpi-card"
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            <DollarSign className="h-4 w-4" />
            Toplam Komisyon
          </div>
          <p className="mt-2 text-2xl font-semibold text-brand-600 dark:text-brand-400 tabular-nums">
            ${totalCommission.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="kpi-card"
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            Bekleyen Hakediş
          </div>
          <p className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
            ${totalPending.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="kpi-card"
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            <Users className="h-4 w-4" />
            Toplam Sipariş
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {totalOrders}
          </p>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="card mb-6 p-5">
        <p className="mb-4 text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Acente Satış vs Komisyon (x$1000)
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#868e96' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#868e96' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}k`}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: '1px solid #e9ecef',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(1)}k`,
                  name === 'satis' ? 'Satış' : 'Komisyon',
                ]}
              />
              <Bar dataKey="satis" fill="#748ffc" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Bar dataKey="komisyon" fill="#40c057" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agency Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border dark:border-border-dark">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Acente
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Bölge
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Sipariş
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Toplam Satış
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Oran
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Komisyon
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Bekleyen
                </th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((agency) => (
                <tr
                  key={agency.id}
                  className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {agency.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {agency.region}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                    {agency.orderCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                    ${agency.totalSales}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                    %{agency.commissionRate}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-brand-600 dark:text-brand-400">
                    ${agency.commission}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-amber-600 dark:text-amber-400">
                    ${agency.pendingCommission}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
