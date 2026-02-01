/**
 * Satış İade (RMA) Modülü
 *
 * - İade listesi & duruma göre filtreleme
 * - İade oluşturma, onaylama, tamamlama, iptal
 * - Stok girişi + cari alacak kaydı + komisyon iptali
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw, Search, Filter, X, Eye, CheckCircle, Clock,
  AlertTriangle, Package, Ban, ChevronRight,
} from 'lucide-react'
import Pagination from '../components/ui/Pagination'
import ExportButton from '../components/ui/ExportButton'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useReturnsQuery, useApproveReturn, useCompleteReturn, useCancelReturn, useWarehousesQuery } from '../hooks/useIpc'

// ── Types ──────────────────────────────────────────────────

type ReturnStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'

interface ReturnItem {
  id: string
  variantId: string
  variant: { sku: string; size: string; color: string | null }
  quantity: string
  unitPrice: string
  totalPrice: string
}

interface SalesReturn {
  id: string
  returnNo: string
  orderId: string
  order: { orderNo: string }
  account: { name: string }
  reason: string
  status: ReturnStatus
  totalAmount: string
  currency: string
  isCancelled: boolean
  createdAt: string
  items: ReturnItem[]
}

const statusLabels: Record<ReturnStatus, string> = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal',
}

const statusColors: Record<ReturnStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  APPROVED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  COMPLETED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  CANCELLED: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
}

const statusDotColors: Record<ReturnStatus, string> = {
  PENDING: 'bg-amber-500',
  APPROVED: 'bg-blue-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
}

const PAGE_SIZE = 15

export default function ReturnsPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'complete' | 'cancel'; id: string } | null>(null)

  const { data: returns = [], isLoading } = useReturnsQuery(
    statusFilter ? { status: statusFilter } : undefined,
  )
  const { data: warehouses = [] } = useWarehousesQuery()
  const approveReturn = useApproveReturn()
  const completeReturn = useCompleteReturn()
  const cancelReturn = useCancelReturn()

  // Filter & paginate
  const filtered = useMemo(() => {
    if (!globalFilter) return returns as SalesReturn[]
    const q = globalFilter.toLowerCase()
    return (returns as SalesReturn[]).filter(r =>
      r.returnNo.toLowerCase().includes(q) ||
      r.order.orderNo.toLowerCase().includes(q) ||
      r.account.name.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q),
    )
  }, [returns, globalFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Status counts
  const statusCounts = useMemo(() => {
    const all = returns as SalesReturn[]
    return {
      all: all.length,
      PENDING: all.filter(r => r.status === 'PENDING').length,
      APPROVED: all.filter(r => r.status === 'APPROVED').length,
      COMPLETED: all.filter(r => r.status === 'COMPLETED').length,
    }
  }, [returns])

  const handleConfirm = async () => {
    if (!confirmAction) return
    if (confirmAction.type === 'approve') {
      await approveReturn.mutateAsync(confirmAction.id)
    } else if (confirmAction.type === 'complete') {
      const defaultWarehouse = (warehouses as any[])[0]?.id ?? ''
      await completeReturn.mutateAsync({ id: confirmAction.id, warehouseId: defaultWarehouse })
    } else if (confirmAction.type === 'cancel') {
      await cancelReturn.mutateAsync({ id: confirmAction.id })
    }
    setConfirmAction(null)
    setSelectedReturn(null)
  }

  const formatCurrency = (val: string | number, currency = 'USD') => {
    const num = typeof val === 'string' ? parseFloat(val) : val
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(num)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
              <RotateCcw className="h-5 w-5 text-white" />
            </div>
            Satış İadeleri
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            İade taleplerini yönetin, stok ve cari güncellemelerini takip edin
          </p>
        </div>
        <ExportButton
          data={filtered}
          filename="iadeler"
          columns={[
            { key: 'returnNo', header: 'İade No' },
            { key: 'order.orderNo', header: 'Sipariş No' },
            { key: 'account.name', header: 'Cari' },
            { key: 'status', header: 'Durum' },
            { key: 'totalAmount', header: 'Tutar' },
            { key: 'createdAt', header: 'Tarih' },
          ]}
        />
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: null, label: 'Tümü', count: statusCounts.all, icon: RotateCcw, color: 'from-gray-500 to-gray-600' },
          { key: 'PENDING', label: 'Beklemede', count: statusCounts.PENDING, icon: Clock, color: 'from-amber-500 to-orange-500' },
          { key: 'APPROVED', label: 'Onaylandı', count: statusCounts.APPROVED, icon: CheckCircle, color: 'from-blue-500 to-indigo-500' },
          { key: 'COMPLETED', label: 'Tamamlandı', count: statusCounts.COMPLETED, icon: Package, color: 'from-emerald-500 to-green-500' },
        ].map(({ key, label, count, icon: Icon, color }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setStatusFilter(key); setPage(1) }}
            className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${
              statusFilter === key
                ? 'ring-2 ring-brand-500 shadow-lg'
                : 'hover:shadow-md'
            } bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}
          >
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${color} mb-2`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{count}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
          </motion.button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="İade no, sipariş no, cari ara..."
            value={globalFilter}
            onChange={(e) => { setGlobalFilter(e.target.value); setPage(1) }}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
          {globalFilter && (
            <button onClick={() => setGlobalFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <RotateCcw className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">Henüz iade kaydı yok</p>
            <p className="text-xs mt-1">Siparişlerden iade başlatabilirsiniz</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">İade No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Sipariş</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Cari</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Neden</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Durum</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Tutar</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Tarih</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginated.map((ret) => (
                <motion.tr
                  key={ret.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {ret.returnNo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{ret.order.orderNo}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{ret.account.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{ret.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[ret.status]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDotColors[ret.status]}`} />
                      {statusLabels[ret.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(ret.totalAmount, ret.currency)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(ret.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedReturn(ret)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {ret.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => setConfirmAction({ type: 'approve', id: ret.id })}
                            className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Onayla"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'cancel', id: ret.id })}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="İptal Et"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {ret.status === 'APPROVED' && (
                        <button
                          onClick={() => setConfirmAction({ type: 'complete', id: ret.id })}
                          className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          title="Tamamla"
                        >
                          <Package className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      )}

      {/* Detail Slide-Over */}
      <AnimatePresence>
        {selectedReturn && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setSelectedReturn(null)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl dark:bg-gray-900"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    İade Detayı
                  </h2>
                  <button onClick={() => setSelectedReturn(null)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">İade No</div>
                      <div className="font-mono font-semibold text-brand-600 dark:text-brand-400">{selectedReturn.returnNo}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Sipariş No</div>
                      <div className="font-medium text-gray-900 dark:text-white">{selectedReturn.order.orderNo}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Cari</div>
                      <div className="font-medium text-gray-900 dark:text-white">{selectedReturn.account.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Durum</div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[selectedReturn.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDotColors[selectedReturn.status]}`} />
                        {statusLabels[selectedReturn.status]}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">İade Nedeni</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">{selectedReturn.reason}</div>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">İade Kalemleri</div>
                    <div className="space-y-2">
                      {selectedReturn.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.variant.sku}</div>
                            <div className="text-xs text-gray-500">{item.variant.size} {item.variant.color || ''}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.quantity} adet</div>
                            <div className="text-xs text-gray-500">{formatCurrency(item.totalPrice, selectedReturn.currency)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam İade Tutarı</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(selectedReturn.totalAmount, selectedReturn.currency)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {selectedReturn.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setConfirmAction({ type: 'approve', id: selectedReturn.id })}
                          className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'cancel', id: selectedReturn.id })}
                          className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-colors"
                        >
                          İptal Et
                        </button>
                      </>
                    )}
                    {selectedReturn.status === 'APPROVED' && (
                      <button
                        onClick={() => setConfirmAction({ type: 'complete', id: selectedReturn.id })}
                        className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                      >
                        Tamamla (Stok Giriş + Cari Alacak)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={
          confirmAction?.type === 'approve' ? 'İadeyi Onayla' :
          confirmAction?.type === 'complete' ? 'İadeyi Tamamla' :
          'İadeyi İptal Et'
        }
        message={
          confirmAction?.type === 'approve' ? 'Bu iadeyi onaylamak istediğinize emin misiniz?' :
          confirmAction?.type === 'complete' ? 'İade tamamlanacak: stok girişi yapılacak, cari alacaklandırılacak ve komisyon iptal edilecektir.' :
          'Bu iadeyi iptal etmek istediğinize emin misiniz?'
        }
        confirmLabel={
          confirmAction?.type === 'approve' ? 'Onayla' :
          confirmAction?.type === 'complete' ? 'Tamamla' :
          'İptal Et'
        }
        variant={confirmAction?.type === 'cancel' ? 'danger' : 'info'}
      />
    </div>
  )
}
