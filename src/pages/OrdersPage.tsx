import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, flexRender, createColumnHelper, type SortingState,
} from '@tanstack/react-table'
import {
  Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Eye,
  ChevronRight, ShoppingCart, DollarSign, Clock, Truck, CheckCircle,
  AlertTriangle, FileText, TrendingUp,
} from 'lucide-react'
import { useOrdersQuery, useUpdateOrderStatus } from '../hooks/useIpc'

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak', CONFIRMED: 'Onaylandı', IN_PRODUCTION: 'Üretimde',
  READY: 'Hazır', PARTIALLY_SHIPPED: 'Kısmi Sevk', SHIPPED: 'Sevk Edildi',
  DELIVERED: 'Teslim Edildi', CANCELLED: 'İptal',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  CONFIRMED: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  IN_PRODUCTION: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  READY: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',
  PARTIALLY_SHIPPED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
  SHIPPED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  DELIVERED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  CANCELLED: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
}

const statusDotColors: Record<string, string> = {
  DRAFT: 'bg-gray-400', CONFIRMED: 'bg-purple-500', IN_PRODUCTION: 'bg-amber-500',
  READY: 'bg-cyan-500', PARTIALLY_SHIPPED: 'bg-indigo-500', SHIPPED: 'bg-blue-500',
  DELIVERED: 'bg-emerald-500', CANCELLED: 'bg-red-500',
}

const statusFlow = ['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED']

type OrderRow = {
  id: string; orderNo: string; account: {
    id: string; code: string; name: string
    referredByAgency?: { id: string; account: { id: string; name: string } } | null
  }
  status: string; currency: string; totalAmount: string; vatAmount: string; grandTotal: string
  agencyCommissionRate: string
  agencyStaff: { name: string; agency: { account: { name: string } } } | null
  items: any[]; createdAt: string
}

const columnHelper = createColumnHelper<OrderRow>()

export default function OrdersPage() {
  const navigate = useNavigate()
  const { data: orders = [], isLoading } = useOrdersQuery()
  const updateStatus = useUpdateOrderStatus()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)

  const filtered = useMemo(() => {
    if (!statusFilter) return orders
    return orders.filter((o: any) => o.status === statusFilter)
  }, [orders, statusFilter])

  // KPIs
  const kpis = useMemo(() => {
    const total = orders.length
    const totalAmount = orders.reduce((s: number, o: any) => s + parseFloat(o.grandTotal || '0'), 0)
    const active = orders.filter((o: any) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length
    const delivered = orders.filter((o: any) => o.status === 'DELIVERED').length
    const inProduction = orders.filter((o: any) => o.status === 'IN_PRODUCTION').length
    const shipped = orders.filter((o: any) => ['SHIPPED', 'PARTIALLY_SHIPPED'].includes(o.status)).length
    return { total, totalAmount, active, delivered, inProduction, shipped }
  }, [orders])

  // Status distribution for pipeline
  const statusDist = useMemo(() => {
    const dist: Record<string, number> = {}
    orders.forEach((o: any) => { dist[o.status] = (dist[o.status] || 0) + 1 })
    return statusFlow.map(s => ({ status: s, count: dist[s] || 0 }))
  }, [orders])

  const columns = useMemo(
    () => [
      columnHelper.accessor('orderNo', {
        header: 'Sipariş No',
        cell: (info) => (
          <span className="font-mono font-medium text-brand-600 dark:text-brand-400">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor((row) => row.account.name, {
        id: 'customer',
        header: 'Müşteri',
        cell: (info) => {
          const agencyName = info.row.original.account.referredByAgency?.account?.name
          return (
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{info.getValue()}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-gray-400 font-mono">{info.row.original.account.code}</span>
                {agencyName && (
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0 text-[10px] font-medium bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300">
                    {agencyName}
                  </span>
                )}
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor('status', {
        header: 'Durum',
        cell: (info) => (
          <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${statusColors[info.getValue()]}`}>
            {statusLabels[info.getValue()]}
          </span>
        ),
      }),
      columnHelper.accessor('grandTotal', {
        header: 'Tutar',
        cell: (info) => (
          <span className="tabular-nums font-medium text-gray-900 dark:text-white">${info.getValue()}</span>
        ),
      }),
      columnHelper.accessor((row) => row.agencyStaff?.agency?.account?.name ?? row.account.referredByAgency?.account?.name ?? '–', {
        id: 'agency',
        header: 'Acente / Temsilci',
        cell: (info) => {
          const staff = info.row.original.agencyStaff
          const referral = info.row.original.account.referredByAgency?.account?.name
          if (staff) {
            return (
              <div>
                <p className="text-[12px] font-medium text-purple-700 dark:text-purple-300">{staff.agency.account.name}</p>
                <p className="text-[11px] text-gray-400">{staff.name}</p>
              </div>
            )
          }
          if (referral) {
            return <span className="text-[12px] text-gray-500 dark:text-gray-400">{referral}</span>
          }
          return <span className="text-[11px] text-gray-400">Direkt</span>
        },
      }),
      columnHelper.accessor((row) => row.items?.length ?? 0, {
        id: 'lineCount',
        header: 'Kalem',
        cell: (info) => <span className="text-gray-500 dark:text-gray-400">{info.getValue()}</span>,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Tarih',
        cell: (info) => (
          <span className="text-gray-500 dark:text-gray-400 tabular-nums">
            {new Date(info.getValue()).toLocaleDateString('tr-TR')}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        cell: (info) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/orders/${info.row.original.id}`) }}
              className="rounded-lg p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              title="Detay"
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedOrder(info.row.original) }}
              className="rounded-lg p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              title="Hızlı Bakış"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        ),
      }),
    ],
    [navigate],
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleNextStatus = (order: OrderRow) => {
    const currentIdx = statusFlow.indexOf(order.status)
    if (currentIdx < 0 || currentIdx >= statusFlow.length - 1) return
    updateStatus.mutate({ id: order.id, status: statusFlow[currentIdx + 1] })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Siparişler</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{orders.length} sipariş kaydı</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Toplam Sipariş', value: kpis.total, icon: ShoppingCart, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
          { label: 'Toplam Tutar', value: `$${(kpis.totalAmount / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          { label: 'Aktif Sipariş', value: kpis.active, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Üretimde', value: kpis.inProduction, icon: TrendingUp, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Teslim Edildi', value: kpis.delivered, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
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

      {/* Status Pipeline Bar */}
      <div className="mb-4 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-3">
        <div className="flex items-center gap-1">
          {statusDist.map((s, i) => (
            <button
              key={s.status}
              onClick={() => setStatusFilter(statusFilter === s.status ? null : s.status)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors ${
                statusFilter === s.status
                  ? statusColors[s.status]
                  : 'text-gray-500 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${statusDotColors[s.status]}`} />
              <span className="hidden sm:inline">{statusLabels[s.status]}</span>
              <span className="font-bold">{s.count}</span>
            </button>
          ))}
          {statusFilter && (
            <button onClick={() => setStatusFilter(null)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-4 min-h-0">
        <div className="flex flex-1 flex-col min-w-0">
          {/* Search */}
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Sipariş no, müşteri veya acente ara..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900 dark:text-white"
            />
          </div>

          {/* Table */}
          <div className="card flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)]">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 bg-white dark:bg-surface-dark-secondary z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b border-border dark:border-border-dark">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                            className={`px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 ${
                              header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : ''
                            }`}
                          >
                            <span className="inline-flex items-center gap-1">
                              {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3" />}
                              {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3" />}
                              {header.column.getCanSort() && !header.column.getIsSorted() && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                            </span>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedOrder(row.original)}
                        className={`cursor-pointer border-b border-border/50 dark:border-border-dark/50 transition-colors hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary ${
                          selectedOrder?.id === row.original.id ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {table.getRowModel().rows.length === 0 && (
                      <tr>
                        <td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-gray-400">
                          Sonuç bulunamadı
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Inspector */}
        <AnimatePresence>
          {selectedOrder && (
            <OrderInspector order={selectedOrder} onClose={() => setSelectedOrder(null)} onNextStatus={() => handleNextStatus(selectedOrder)} onDetail={() => navigate(`/orders/${selectedOrder.id}`)} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function OrderInspector({ order, onClose, onNextStatus, onDetail }: {
  order: OrderRow; onClose: () => void; onNextStatus: () => void; onDetail: () => void
}) {
  const currentIdx = statusFlow.indexOf(order.status)
  const nextStatus = currentIdx >= 0 && currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null

  return (
    <motion.aside
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="w-[360px] shrink-0 card overflow-y-auto"
    >
      <div className="flex items-start justify-between border-b border-border dark:border-border-dark p-5">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Sipariş Detayı</p>
          <h2 className="mt-1 text-base font-semibold font-mono text-brand-600 dark:text-brand-400">{order.orderNo}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onDetail} className="rounded-lg p-1 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors text-gray-400 hover:text-brand-600" title="Tam Sayfa Detay">
            <FileText className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Status Flow */}
      <div className="p-5 border-b border-border dark:border-border-dark">
        <div className="flex items-center gap-1.5 mb-3">
          {statusFlow.map((s, i) => {
            const idx = statusFlow.indexOf(order.status)
            const isActive = i === idx
            const isDone = i < idx
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  isActive ? 'bg-brand-600 ring-2 ring-brand-200 dark:ring-brand-800' : isDone ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
                {i < statusFlow.length - 1 && <div className={`h-0.5 w-4 rounded ${isDone ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className={`inline-flex rounded-lg px-2.5 py-1 text-[12px] font-medium ${statusColors[order.status]}`}>
            {statusLabels[order.status]}
          </span>
          {nextStatus && (
            <button onClick={onNextStatus} className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-brand-700 transition-colors">
              {statusLabels[nextStatus]} <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Customer */}
      <div className="p-5 border-b border-border dark:border-border-dark">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Müşteri</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{order.account.name}</p>
        <p className="text-[12px] text-gray-500 font-mono">{order.account.code}</p>
        {order.account.referredByAgency && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1.5">
            <span className="text-[11px] text-purple-600 dark:text-purple-400">Müşterinin Acentesi:</span>
            <span className="text-[12px] font-medium text-purple-700 dark:text-purple-300">{order.account.referredByAgency.account.name}</span>
          </div>
        )}
        {order.agencyStaff && (
          <div className="mt-2 rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
            <p className="text-[11px] font-medium text-gray-400">Sipariş Temsilcisi</p>
            <p className="text-[13px] text-gray-900 dark:text-white">{order.agencyStaff.agency.account.name}</p>
            <p className="text-[12px] text-gray-500">Temsilci: {order.agencyStaff.name}</p>
          </div>
        )}
      </div>

      {/* Lines */}
      <div className="p-5 border-b border-border dark:border-border-dark">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Sipariş Kalemleri</p>
        <div className="space-y-2">
          {order.items?.map((item: any) => (
            <div key={item.id} className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
              <p className="text-[13px] font-medium text-gray-900 dark:text-white">{item.productName}</p>
              <div className="mt-1 flex items-center justify-between text-[12px] text-gray-500">
                <span>{item.quantity} {item.unit} x ${item.unitPrice}</span>
                <span className="font-medium text-gray-900 dark:text-white tabular-nums">${item.totalPrice}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="p-5">
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Ara Toplam</span>
            <span className="tabular-nums text-gray-900 dark:text-white">${order.totalAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">KDV</span>
            <span className="tabular-nums text-gray-900 dark:text-white">${order.vatAmount}</span>
          </div>
          <div className="flex justify-between border-t border-border dark:border-border-dark pt-2">
            <span className="font-medium text-gray-900 dark:text-white">Genel Toplam</span>
            <span className="font-semibold tabular-nums text-gray-900 dark:text-white">${order.grandTotal}</span>
          </div>
          {parseFloat(String(order.agencyCommissionRate || '0').replace(/,/g, '')) > 0 && (
            <div className="flex justify-between text-[12px]">
              <span className="text-gray-400">Komisyon Oranı</span>
              <span className="text-gray-500">%{order.agencyCommissionRate}</span>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
