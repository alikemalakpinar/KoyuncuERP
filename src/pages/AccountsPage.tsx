import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Plus,
  TrendingUp,
  Clock,
  AlertTriangle,
  Shield,
  ChevronRight,
  X,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useAccounts, useAccountHealth } from '../hooks/useAnalytics'

const typeLabels: Record<string, string> = {
  CUSTOMER: 'Müşteri',
  SUPPLIER: 'Tedarikçi',
  AGENCY: 'Acente',
  BOTH: 'Müşteri/Tedarikçi',
}

const typeBadgeColors: Record<string, string> = {
  CUSTOMER: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  SUPPLIER: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  AGENCY: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  BOTH: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export default function AccountsPage() {
  const accounts = useAccounts()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-full gap-4"
    >
      {/* Left: Account List */}
      <div className="flex flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Cariler
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {accounts.length} kayıtlı hesap
            </p>
          </div>
          <button className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Yeni Cari
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ara (ad veya kod)..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900 dark:text-white"
          />
        </div>

        {/* Table */}
        <div className="card flex-1 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border dark:border-border-dark">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Kod
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Ünvan
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Tür
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    Şehir
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                    Bakiye
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                    Vade
                  </th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account) => (
                  <tr
                    key={account.id}
                    onClick={() => setSelectedId(account.id)}
                    className={`cursor-pointer border-b border-border/50 dark:border-border-dark/50 transition-colors hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary ${
                      selectedId === account.id
                        ? 'bg-brand-50/50 dark:bg-brand-900/10'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400">
                      {account.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {account.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${typeBadgeColors[account.type]}`}
                      >
                        {typeLabels[account.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {account.city}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      <span
                        className={
                          account.balance.startsWith('-')
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-white'
                        }
                      >
                        ${account.balance}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {account.paymentTermDays > 0
                        ? `${account.paymentTermDays} gün`
                        : '–'}
                    </td>
                    <td className="px-4 py-1">
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right: Inspector Side Panel – Financial Health */}
      <AnimatePresence>
        {selectedId && (
          <AccountInspector
            accountId={selectedId}
            account={accounts.find((a) => a.id === selectedId)!}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AccountInspector({
  accountId,
  account,
  onClose,
}: {
  accountId: string
  account: ReturnType<typeof useAccounts>[0]
  onClose: () => void
}) {
  const health = useAccountHealth(accountId)

  const chartData = health.monthlyRevenue.map((m) => ({
    name: m.month,
    gelir: parseInt(m.amount),
  }))

  const riskColor =
    health.riskScore >= 70
      ? 'text-emerald-600 dark:text-emerald-400'
      : health.riskScore >= 40
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'

  return (
    <motion.aside
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="w-[360px] shrink-0 card overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border dark:border-border-dark p-5">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            Finansal Sağlık
          </p>
          <h2 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {account.name}
          </h2>
          <p className="text-[12px] text-gray-500 font-mono">{account.code}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 p-5">
        <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-3 w-3" />
            12 Aylık Gelir
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
            ${health.totalRevenue12m}
          </p>
        </div>

        <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            Ort. Ödeme Vadesi
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            {health.avgPaymentDays}{' '}
            <span className="text-sm font-normal text-gray-400">gün</span>
          </p>
        </div>

        <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <AlertTriangle className="h-3 w-3" />
            Vadesi Geçen
          </div>
          <p className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400 tabular-nums">
            ${health.overdueAmount}
          </p>
        </div>

        <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <Shield className="h-3 w-3" />
            Risk Skoru
          </div>
          <p className={`mt-1 text-lg font-semibold ${riskColor}`}>
            {health.riskScore}
            <span className="text-sm font-normal text-gray-400">/100</span>
          </p>
        </div>
      </div>

      {/* 12-Month Revenue Chart */}
      <div className="px-5 pb-5">
        <p className="mb-3 text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Son 12 Ay Gelir Grafiği
        </p>
        <div className="h-44 rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad-health" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4c6ef5" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#4c6ef5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#868e96' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#868e96' }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: '1px solid #e9ecef',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Gelir']}
              />
              <Area
                type="monotone"
                dataKey="gelir"
                stroke="#4c6ef5"
                strokeWidth={2}
                fill="url(#grad-health)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Limit Bar */}
      <div className="border-t border-border dark:border-border-dark px-5 py-4">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-gray-500 dark:text-gray-400">Risk Limiti Kullanımı</span>
          <span className="font-medium text-gray-900 dark:text-white">
            ${account.balance} / ${account.riskLimit}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-surface-secondary dark:bg-surface-dark-tertiary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(
                (parseFloat(account.balance.replace(/,/g, '')) /
                  parseFloat(account.riskLimit.replace(/,/g, ''))) *
                  100,
                100,
              )}%`,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              parseFloat(account.balance.replace(/,/g, '')) /
                parseFloat(account.riskLimit.replace(/,/g, '')) >
              0.8
                ? 'bg-red-500'
                : 'bg-brand-500'
            }`}
          />
        </div>
      </div>
    </motion.aside>
  )
}
