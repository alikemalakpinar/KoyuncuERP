import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Eye,
  ChevronRight,
} from 'lucide-react'
import { useOrdersQuery, useUpdateOrderStatus } from '../hooks/useIpc'

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  CONFIRMED: 'Onaylandı',
  IN_PRODUCTION: 'Üretimde',
  READY: 'Hazır',
  PARTIALLY_SHIPPED: 'Kısmi Sevk',
  SHIPPED: 'Sevk Edildi',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal',
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

const statusFlow = ['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED']

type OrderRow = {
  id: string
  orderNo: string
  account: { id: string; code: string; name: string }
  status: string
  currency: string
  totalAmount: string
  vatAmount: string
  grandTotal: string
  agencyCommissionRate: string
  agencyStaff: { name: string; agency: { account: { name: string } } } | null
  items: any[]
  createdAt: string
}

const columnHelper = createColumnHelper<OrderRow>()

export default function OrdersPage() {
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

  const columns = useMemo(
    () => [
      columnHelper.accessor('orderNo', {
        header: 'Sipariş No',
        cell: (info) => (
          <span className="font-mono font-medium text-brand-600 dark:text-brand-400">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.account.name, {
        id: 'customer',
        header: 'Müşteri',
        cell: (info) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{info.getValue()}</p>
            <p className="text-[11px] text-gray-400 font-mono">{info.row.original.account.code}</p>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Durum',
        cell: (info) => (
          <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${statusColors[info.getValue()]}`}
          >
            {statusLabels[info.getValue()]}
          </span>
        ),
      }),
      columnHelper.accessor('grandTotal', {
        header: 'Tutar',
        cell: (info) => (
          <span className="tabular-nums font-medium text-gray-900 dark:text-white">
            ${info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor(
        (row) => row.agencyStaff?.agency?.account?.name ?? '–',
        {
          id: 'agency',
          header: 'Acente',
          cell: (info) => (
            <span className="text-gray-600 dark:text-gray-400">{info.getValue()}</span>
          ),
        },
      ),
      columnHelper.accessor(
        (row) => row.items?.length ?? 0,
        {
          id: 'lineCount',
          header: 'Kalem',
          cell: (info) => (
            <span className="text-gray-500 dark:text-gray-400">{info.getValue()}</span>
          ),
        },
      ),
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
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedOrder(info.row.original)
            }}
            className="rounded-lg p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      }),
    ],
    [],
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
    const nextStatus = statusFlow[currentIdx + 1]
    updateStatus.mutate({ id: order.id, status: nextStatus })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-full gap-4"
    >
      <div className="flex flex-1 flex-col min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Siparişler</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {orders.length} sipariş kaydı
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Sipariş no, müşteri veya acente ara..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-gray-400 mr-1" />
            {statusFilter ? (
              <button
                onClick={() => setStatusFilter(null)}
                className="flex items-center gap-1 rounded-lg bg-brand-50 dark:bg-brand-900/20 px-2 py-1 text-[11px] font-medium text-brand-700 dark:text-brand-300"
              >
                {statusLabels[statusFilter]}
                <X className="h-3 w-3" />
              </button>
            ) : (
              ['CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="rounded-lg px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-surface-secondary dark:text-gray-400 dark:hover:bg-surface-dark-secondary transition-colors"
                >
                  {statusLabels[s]}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Table */}
        <div className="card flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-260px)]">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-white dark:bg-surface-dark-secondary z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-border dark:border-border-dark">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className={`px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 ${
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200'
                              : ''
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {!header.isPlaceholder &&
                              flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3" />}
                            {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3" />}
                            {header.column.getCanSort() && !header.column.getIsSorted() && (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
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
          <OrderInspector
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onNextStatus={() => handleNextStatus(selectedOrder)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function OrderInspector({
  order,
  onClose,
  onNextStatus,
}: {
  order: OrderRow
  onClose: () => void
  onNextStatus: () => void
}) {
  const currentIdx = statusFlow.indexOf(order.status)
  const nextStatus =
    currentIdx >= 0 && currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null

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
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            Sipariş Detayı
          </p>
          <h2 className="mt-1 text-base font-semibold font-mono text-brand-600 dark:text-brand-400">
            {order.orderNo}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
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
                <div
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    isActive
                      ? 'bg-brand-600 ring-2 ring-brand-200 dark:ring-brand-800'
                      : isDone
                        ? 'bg-emerald-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
                {i < statusFlow.length - 1 && (
                  <div className={`h-0.5 w-4 rounded ${isDone ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className={`inline-flex rounded-lg px-2.5 py-1 text-[12px] font-medium ${statusColors[order.status]}`}>
            {statusLabels[order.status]}
          </span>
          {nextStatus && (
            <button
              onClick={onNextStatus}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-brand-700 transition-colors"
            >
              {statusLabels[nextStatus]}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Customer */}
      <div className="p-5 border-b border-border dark:border-border-dark">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Müşteri</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{order.account.name}</p>
        <p className="text-[12px] text-gray-500 font-mono">{order.account.code}</p>
        {order.agencyStaff && (
          <div className="mt-3 rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
            <p className="text-[11px] font-medium text-gray-400">Acente</p>
            <p className="text-[13px] text-gray-900 dark:text-white">
              {order.agencyStaff.agency.account.name}
            </p>
            <p className="text-[12px] text-gray-500">Temsilci: {order.agencyStaff.name}</p>
          </div>
        )}
      </div>

      {/* Lines */}
      <div className="p-5 border-b border-border dark:border-border-dark">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">
          Sipariş Kalemleri
        </p>
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
