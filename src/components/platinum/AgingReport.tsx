/**
 * Aging Report – Receivables aging matrix
 * Shows outstanding balances broken by: Not Due, 1-30, 31-60, 61-90, 90+ days
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Download, Search, AlertTriangle, TrendingUp } from 'lucide-react'

interface AgingBucket {
  accountId: string
  accountName: string
  accountCode: string
  notDue: string
  days1to30: string
  days31to60: string
  days61to90: string
  days90plus: string
  total: string
}

// Demo data
const demoAging: AgingBucket[] = [
  { accountId: '1', accountCode: 'C-001', accountName: 'HomeStyle Inc.', notDue: '45000.00', days1to30: '12500.00', days31to60: '8200.00', days61to90: '0.00', days90plus: '0.00', total: '65700.00' },
  { accountId: '2', accountCode: 'C-002', accountName: 'Desert Home Decor', notDue: '28000.00', days1to30: '15000.00', days31to60: '0.00', days61to90: '5400.00', days90plus: '3200.00', total: '51600.00' },
  { accountId: '3', accountCode: 'C-003', accountName: 'Chicago Interiors', notDue: '33500.00', days1to30: '0.00', days31to60: '0.00', days61to90: '0.00', days90plus: '0.00', total: '33500.00' },
  { accountId: '4', accountCode: 'C-004', accountName: 'Pacific Rugs LLC', notDue: '0.00', days1to30: '18900.00', days31to60: '12300.00', days61to90: '7800.00', days90plus: '4500.00', total: '43500.00' },
  { accountId: '5', accountCode: 'C-005', accountName: 'Manhattan Carpets', notDue: '22000.00', days1to30: '9500.00', days31to60: '6700.00', days61to90: '0.00', days90plus: '0.00', total: '38200.00' },
  { accountId: '6', accountCode: 'C-006', accountName: 'Dallas Décor Hub', notDue: '0.00', days1to30: '0.00', days31to60: '0.00', days61to90: '11200.00', days90plus: '8900.00', total: '20100.00' },
]

function fmt(v: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(parseFloat(v))
}

function sumCol(data: AgingBucket[], key: keyof AgingBucket): string {
  return data.reduce((s, r) => s + parseFloat(r[key] as string), 0).toFixed(2)
}

export default function AgingReport() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    demoAging.filter(r =>
      r.accountName.toLowerCase().includes(search.toLowerCase()) ||
      r.accountCode.toLowerCase().includes(search.toLowerCase())
    ), [search])

  const totals = useMemo(() => ({
    notDue: sumCol(filtered, 'notDue'),
    days1to30: sumCol(filtered, 'days1to30'),
    days31to60: sumCol(filtered, 'days31to60'),
    days61to90: sumCol(filtered, 'days61to90'),
    days90plus: sumCol(filtered, 'days90plus'),
    total: sumCol(filtered, 'total'),
  }), [filtered])

  const overdueTotal = parseFloat(totals.days1to30) + parseFloat(totals.days31to60) + parseFloat(totals.days61to90) + parseFloat(totals.days90plus)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
          <p className="text-xs text-gray-500">Toplam Alacak</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{fmt(totals.total)}</p>
        </div>
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
          <p className="text-xs text-gray-500">Vadesi Gelmemiş</p>
          <p className="text-xl font-bold text-green-600 mt-1">{fmt(totals.notDue)}</p>
        </div>
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-500">Vadesi Geçmiş</p>
            <AlertTriangle className="h-3 w-3 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-1">{fmt(overdueTotal.toFixed(2))}</p>
        </div>
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
          <p className="text-xs text-gray-500">90+ Gün</p>
          <p className="text-xl font-bold text-red-600 mt-1">{fmt(totals.days90plus)}</p>
        </div>
      </div>

      {/* Filter & Export */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-border dark:border-border-dark px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-surface-secondary transition-colors">
          <Download className="h-4 w-4" /> Excel
        </button>
      </div>

      {/* Aging Table */}
      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 dark:border-border-dark/50 bg-surface-secondary/30 dark:bg-surface-dark-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cari Kod</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cari Adı</th>
                <th className="text-right px-4 py-3 font-medium text-green-600">Vadesi Gelmemiş</th>
                <th className="text-right px-4 py-3 font-medium text-blue-600">1–30 Gün</th>
                <th className="text-right px-4 py-3 font-medium text-amber-600">31–60 Gün</th>
                <th className="text-right px-4 py-3 font-medium text-orange-600">61–90 Gün</th>
                <th className="text-right px-4 py-3 font-medium text-red-600">90+ Gün</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Toplam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
              {filtered.map(row => {
                const hasOverdue90 = parseFloat(row.days90plus) > 0
                return (
                  <tr key={row.accountId} className={`hover:bg-surface-secondary/20 dark:hover:bg-surface-dark-secondary/20 transition-colors ${hasOverdue90 ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.accountCode}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.accountName}</td>
                    <td className="px-4 py-3 text-right text-green-600">{parseFloat(row.notDue) > 0 ? fmt(row.notDue) : '–'}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{parseFloat(row.days1to30) > 0 ? fmt(row.days1to30) : '–'}</td>
                    <td className="px-4 py-3 text-right text-amber-600">{parseFloat(row.days31to60) > 0 ? fmt(row.days31to60) : '–'}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{parseFloat(row.days61to90) > 0 ? fmt(row.days61to90) : '–'}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">{parseFloat(row.days90plus) > 0 ? fmt(row.days90plus) : '–'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{fmt(row.total)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
                <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-200" colSpan={2}>TOPLAM</td>
                <td className="px-4 py-3 text-right font-bold text-green-600">{fmt(totals.notDue)}</td>
                <td className="px-4 py-3 text-right font-bold text-blue-600">{fmt(totals.days1to30)}</td>
                <td className="px-4 py-3 text-right font-bold text-amber-600">{fmt(totals.days31to60)}</td>
                <td className="px-4 py-3 text-right font-bold text-orange-600">{fmt(totals.days61to90)}</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">{fmt(totals.days90plus)}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white text-base">{fmt(totals.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Risk Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Vadesi Gelmemiş</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> 1–30 Gün</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> 31–60 Gün</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> 61–90 Gün</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> 90+ Gün (Kritik)</span>
      </div>
    </motion.div>
  )
}
