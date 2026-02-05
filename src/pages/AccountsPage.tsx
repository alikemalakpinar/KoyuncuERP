import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Plus, TrendingUp, Clock, AlertTriangle,
  Shield, ChevronRight, X, Building2, DollarSign, UserCheck,
  Globe, Handshake, Link2,
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { useAccountsQuery, useAccountHealthQuery } from '../hooks/useIpc'
import AccountFormModal from '../components/modals/AccountFormModal'

const typeLabels: Record<string, string> = {
  CUSTOMER: 'Müşteri', SUPPLIER: 'Tedarikçi', AGENCY: 'Acente', BOTH: 'Müşteri/Tedarikçi',
}

const typeBadgeColors: Record<string, string> = {
  CUSTOMER: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  SUPPLIER: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  AGENCY: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  BOTH: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const typeIcons: Record<string, typeof Users> = {
  CUSTOMER: Building2, SUPPLIER: Globe, AGENCY: UserCheck, BOTH: Users,
}

export default function AccountsPage() {
  const { data: accounts = [] } = useAccountsQuery()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [agencyFilter, setAgencyFilter] = useState<string | null>(null)
  const [showNewAccountModal, setShowNewAccountModal] = useState(false)

  // Get list of agencies for filter dropdown
  const agencies = useMemo(() => {
    return accounts.filter((a: any) => a.type === 'AGENCY')
  }, [accounts])

  const filtered = useMemo(() => {
    let result = accounts
    if (typeFilter) result = result.filter((a: any) => a.type === typeFilter)
    if (agencyFilter) {
      result = result.filter((a: any) => {
        if (agencyFilter === '__none__') return !a.referredByAgency && a.type !== 'AGENCY'
        return a.referredByAgency?.account?.name === agencyFilter
      })
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((a: any) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q))
    }
    return result
  }, [accounts, typeFilter, agencyFilter, searchQuery])

  // KPIs
  const kpis = useMemo(() => {
    const total = accounts.length
    const customers = accounts.filter((a: any) => a.type === 'CUSTOMER' || a.type === 'BOTH').length
    const suppliers = accounts.filter((a: any) => a.type === 'SUPPLIER' || a.type === 'BOTH').length
    const agencyCount = accounts.filter((a: any) => a.type === 'AGENCY').length
    const withAgency = accounts.filter((a: any) => a.referredByAgency).length
    const directCustomers = accounts.filter((a: any) => (a.type === 'CUSTOMER' || a.type === 'BOTH') && !a.referredByAgency).length
    const totalBalance = accounts.reduce((s: number, a: any) => s + parseFloat((a.balance || '0').replace(/,/g, '')), 0)
    const overdueCount = accounts.filter((a: any) => parseFloat((a.balance || '0').replace(/,/g, '')) < 0).length
    return { total, customers, suppliers, agencies: agencyCount, withAgency, directCustomers, totalBalance, overdueCount }
  }, [accounts])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Cariler</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{accounts.length} kayıtlı hesap</p>
        </div>
        <button
          onClick={() => setShowNewAccountModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni Cari
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Toplam Cari', value: kpis.total, icon: Users, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
          { label: 'Müşteri', value: kpis.customers, icon: Building2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Acente', value: kpis.agencies, icon: UserCheck, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Acente ile Gelen', value: kpis.withAgency, icon: Handshake, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Direkt Müşteri', value: kpis.directCustomers, icon: Link2, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20' },
          { label: 'Toplam Bakiye', value: `$${(kpis.totalBalance / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          { label: 'Negatif Bakiye', value: kpis.overdueCount, icon: AlertTriangle, color: kpis.overdueCount > 0 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-600 bg-gray-50 dark:bg-gray-800' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${kpi.color}`}>
                <kpi.icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{kpi.label}</p>
                <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Type Filter Tabs + Agency Filter + Search */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-1">
          <button
            onClick={() => setTypeFilter(null)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
              !typeFilter ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Tümü ({accounts.length})
          </button>
          {['CUSTOMER', 'SUPPLIER', 'AGENCY', 'BOTH'].map((t) => {
            const count = accounts.filter((a: any) => a.type === t).length
            if (count === 0) return null
            const Icon = typeIcons[t]
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  typeFilter === t ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3" />
                {typeLabels[t]} ({count})
              </button>
            )
          })}
        </div>

        {/* Agency filter dropdown */}
        <div className="relative">
          <select
            value={agencyFilter ?? ''}
            onChange={(e) => setAgencyFilter(e.target.value || null)}
            className="appearance-none rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 pr-8 text-[12px] font-medium text-gray-600 dark:text-gray-300 outline-none cursor-pointer hover:border-brand-400 transition-colors"
          >
            <option value="">Tüm Acenteler</option>
            <option value="__none__">Acentesiz (Direkt)</option>
            {agencies.map((a: any) => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
          <UserCheck className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex-1 max-w-sm flex items-center gap-2 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ara (ad veya kod)..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Table */}
        <div className="flex-1 card overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-white dark:bg-surface-dark-secondary z-10">
                <tr className="border-b border-border dark:border-border-dark">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Kod</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Ünvan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Tür</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Getiren Acente</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Şehir</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Bakiye</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Risk Limiti</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Vade</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <Users className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cari hesap bulunamadı</p>
                      <p className="text-xs text-gray-400 mt-1">Arama veya filtre kriterlerini değiştirin</p>
                    </td>
                  </tr>
                ) : filtered.map((account: any) => {
                  const balanceNum = parseFloat((account.balance || '0').replace(/,/g, ''))
                  const limitNum = parseFloat((account.riskLimit || '1').replace(/,/g, ''))
                  const usagePercent = limitNum > 0 ? (balanceNum / limitNum) * 100 : 0
                  const agencyName = account.referredByAgency?.account?.name
                  return (
                    <tr
                      key={account.id}
                      onClick={() => setSelectedId(account.id)}
                      onDoubleClick={() => navigate(`/accounts/${account.id}`)}
                      className={`cursor-pointer border-b border-border/50 dark:border-border-dark/50 transition-colors hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary ${
                        selectedId === account.id ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400">{account.code}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{account.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${typeBadgeColors[account.type]}`}>
                          {typeLabels[account.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {account.type === 'AGENCY' ? (
                          <span className="text-[11px] text-gray-400 italic">Acente</span>
                        ) : agencyName ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:text-purple-300">
                            <UserCheck className="h-3 w-3" />
                            {agencyName}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Direkt</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{account.city}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        <span className={balanceNum < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>
                          ${account.balance}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-brand-500'}`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-400 tabular-nums">${account.riskLimit}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                        {account.paymentTermDays > 0 ? `${account.paymentTermDays} gün` : '–'}
                      </td>
                      <td className="px-4 py-1">
                        <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspector */}
        <AnimatePresence>
          {selectedId && (
            <AccountInspector
              accountId={selectedId}
              account={accounts.find((a: any) => a.id === selectedId)!}
              onClose={() => setSelectedId(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* New Account Modal */}
      <AccountFormModal
        open={showNewAccountModal}
        onClose={() => setShowNewAccountModal(false)}
      />
    </motion.div>
  )
}

function AccountInspector({ accountId, account, onClose }: {
  accountId: string; account: any; onClose: () => void
}) {
  const nav = useNavigate()
  const { data: health } = useAccountHealthQuery(accountId)

  if (!health) {
    return (
      <motion.aside
        initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-[360px] shrink-0 card flex items-center justify-center"
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </motion.aside>
    )
  }

  const chartData = health.monthlyRevenue.map((m: any) => ({ name: m.month, gelir: parseInt(m.amount) }))
  const riskColor = health.riskScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : health.riskScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
  const agencyName = account?.referredByAgency?.account?.name

  return (
    <motion.aside
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="w-[360px] shrink-0 card overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border dark:border-border-dark p-5">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Finansal Sağlık</p>
          <h2 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{account.name}</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[12px] text-gray-500 font-mono">{account.code}</span>
            <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-medium ${typeBadgeColors[account.type]}`}>
              {typeLabels[account.type]}
            </span>
          </div>
          {agencyName && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 px-2 py-1">
              <UserCheck className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span className="text-[11px] font-medium text-purple-700 dark:text-purple-300">
                Acente: {agencyName}
              </span>
            </div>
          )}
        </div>
        <button onClick={onClose} className="rounded-lg p-1 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 p-5">
        <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-3 w-3" /> 12 Aylık Gelir
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white tabular-nums">${health.totalRevenue12m}</p>
        </div>
        <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" /> Ort. Ödeme Vadesi
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            {health.avgPaymentDays} <span className="text-sm font-normal text-gray-400">gün</span>
          </p>
        </div>
        <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <AlertTriangle className="h-3 w-3" /> Vadesi Geçen
          </div>
          <p className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400 tabular-nums">${health.overdueAmount}</p>
        </div>
        <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <Shield className="h-3 w-3" /> Risk Skoru
          </div>
          <p className={`mt-1 text-lg font-semibold ${riskColor}`}>
            {health.riskScore}<span className="text-sm font-normal text-gray-400">/100</span>
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="px-5 pb-5">
        <p className="mb-3 text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Son 12 Ay Gelir</p>
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
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#868e96' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#868e96' }} axisLine={false} tickLine={false} width={45} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e9ecef', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Gelir']} />
              <Area type="monotone" dataKey="gelir" stroke="#4c6ef5" strokeWidth={2} fill="url(#grad-health)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Limit Bar */}
      <div className="border-t border-border dark:border-border-dark px-5 py-4">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-gray-500 dark:text-gray-400">Risk Limiti Kullanımı</span>
          <span className="font-medium text-gray-900 dark:text-white">${account.balance} / ${account.riskLimit}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-surface-secondary dark:bg-surface-dark-tertiary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((parseFloat((account.balance || '0').replace(/,/g, '')) / parseFloat((account.riskLimit || '1').replace(/,/g, ''))) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              parseFloat((account.balance || '0').replace(/,/g, '')) / parseFloat((account.riskLimit || '1').replace(/,/g, '')) > 0.8 ? 'bg-red-500' : 'bg-brand-500'
            }`}
          />
        </div>
      </div>

      {/* Detail Button */}
      <div className="border-t border-border dark:border-border-dark px-5 py-3">
        <button
          onClick={() => nav(`/accounts/${accountId}`)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Cari Detayına Git
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.aside>
  )
}
