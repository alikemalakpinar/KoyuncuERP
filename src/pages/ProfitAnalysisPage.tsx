import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { useProfitAnalysisQuery } from '../hooks/useIpc'

const statusLabels: Record<string, string> = {
  DELIVERED: 'Teslim Edildi',
  SHIPPED: 'Sevk Edildi',
  IN_PRODUCTION: 'Üretimde',
  CONFIRMED: 'Onaylandı',
}

const statusColors: Record<string, string> = {
  DELIVERED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  SHIPPED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  IN_PRODUCTION: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  CONFIRMED: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
}

type SortKey = 'netProfit' | 'netMargin' | 'sellingPrice'

export default function ProfitAnalysisPage() {
  const { data: orders = [] } = useProfitAnalysisQuery()
  const [sortKey, setSortKey] = useState<SortKey>('netProfit')
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = [...orders].sort((a, b) => {
    const av = parseFloat(a[sortKey].replace(/,/g, ''))
    const bv = parseFloat(b[sortKey].replace(/,/g, ''))
    return sortAsc ? av - bv : bv - av
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const totalNetProfit = orders.reduce(
    (sum: number, o: any) => sum + parseFloat(o.netProfit.replace(/,/g, '')),
    0,
  )
  const avgMargin =
    orders.reduce((sum: number, o: any) => sum + parseFloat(o.netMargin), 0) / orders.length

  // Chart data
  const chartData = orders.map((o: any) => ({
    name: o.orderNo.split('-').pop(),
    kar: parseFloat(o.netProfit.replace(/,/g, '')),
    marj: parseFloat(o.netMargin),
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
          Kar Analizi
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sipariş bazında maliyet ve karlılık takibi
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="kpi-card"
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-4 w-4" />
            Toplam Net Kar
          </div>
          <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            ${totalNetProfit.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="kpi-card"
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-4 w-4" />
            Ortalama Kar Marjı
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            %{avgMargin.toFixed(1)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="kpi-card"
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            <TrendingDown className="h-4 w-4" />
            Analiz Edilen Sipariş
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {orders.length}
          </p>
        </motion.div>
      </div>

      {/* Profit Chart */}
      <div className="card mb-6 p-5">
        <p className="mb-4 text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Sipariş Bazında Net Kar
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
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: '1px solid #e9ecef',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Kar']}
              />
              <Bar dataKey="kar" radius={[6, 6, 0, 0]}>
                {chartData.map((entry: any, idx: number) => (
                  <Cell
                    key={idx}
                    fill={entry.kar > 10000 ? '#40c057' : '#748ffc'}
                    opacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border dark:border-border-dark">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Sipariş
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Müşteri
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Durum
                </th>
                <th
                  className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('sellingPrice')}
                >
                  <span className="inline-flex items-center gap-1">
                    Satış <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Alış
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Navlun
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Gümrük
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Komisyon
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Toplam Maliyet
                </th>
                <th
                  className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('netProfit')}
                >
                  <span className="inline-flex items-center gap-1">
                    Net Kar <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('netMargin')}
                >
                  <span className="inline-flex items-center gap-1">
                    Marj <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((order) => (
                <tr
                  key={order.orderId}
                  className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-medium text-brand-600 dark:text-brand-400">
                    {order.orderNo}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {order.customer}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${statusColors[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                    ${order.sellingPrice}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                    ${order.purchaseCost}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                    ${order.freight}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                    ${order.customs}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                    ${order.agencyFee}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900 dark:text-white">
                    ${order.totalCost}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                    ${order.netProfit}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span
                      className={
                        parseFloat(order.netMargin) >= 23
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }
                    >
                      %{order.netMargin}
                    </span>
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
