/**
 * Stok Sayım & Düzeltme Modülü
 *
 * - Depo ve ürün bazlı stok listeleme
 * - Fiziksel sayım girişi
 * - Otomatik düzeltme (adjustment) oluşturma
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardCheck, Search, X, Package, Warehouse, AlertTriangle,
  Check, Minus, Plus, Filter,
} from 'lucide-react'
import Pagination from '../components/ui/Pagination'
import ExportButton from '../components/ui/ExportButton'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useWarehousesQuery } from '../hooks/useIpc'
import { ipcCall } from '../lib/ipc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ── Types ──────────────────────────────────────────────────

interface StockRow {
  id: string
  variantId: string
  variant: {
    sku: string
    size: string
    color: string | null
    product: { name: string }
  }
  warehouseId: string
  warehouse: { name: string }
  quantity: number
  reservedQuantity: number
}

const PAGE_SIZE = 20

export default function StockCountPage() {
  const [globalFilter, setGlobalFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [newQuantity, setNewQuantity] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [confirmAdjust, setConfirmAdjust] = useState<{ variantId: string; warehouseId: string; newQty: string; reason: string } | null>(null)

  const qc = useQueryClient()
  const { data: warehouses = [] } = useWarehousesQuery()

  // Fetch stocks
  const { data: stocks = [], isLoading } = useQuery({
    queryKey: ['stocks', warehouseFilter],
    queryFn: async () => {
      return ipcCall('inventory:stocks', { warehouseId: warehouseFilter || undefined })
    },
    staleTime: 30_000,
  })

  const adjustMutation = useMutation({
    mutationFn: async (data: { variantId: string; warehouseId: string; newQuantity: string; reason: string }) => {
      return ipcCall('inventory:adjust', data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stocks'] })
      setEditingRow(null)
      setNewQuantity('')
      setAdjustReason('')
    },
  })

  // Filter
  const filtered = useMemo(() => {
    if (!globalFilter) return stocks as StockRow[]
    const q = globalFilter.toLowerCase()
    return (stocks as StockRow[]).filter(s =>
      s.variant?.sku?.toLowerCase().includes(q) ||
      s.variant?.product?.name?.toLowerCase().includes(q) ||
      s.warehouse?.name?.toLowerCase().includes(q),
    )
  }, [stocks, globalFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Stats
  const stats = useMemo(() => {
    const all = stocks as StockRow[]
    const totalItems = all.length
    const totalQty = all.reduce((sum, s) => sum + (s.quantity || 0), 0)
    const lowStock = all.filter(s => s.quantity < 10).length
    const reserved = all.reduce((sum, s) => sum + (s.reservedQuantity || 0), 0)
    return { totalItems, totalQty, lowStock, reserved }
  }, [stocks])

  const handleStartEdit = (row: StockRow) => {
    setEditingRow(row.id)
    setNewQuantity(String(row.quantity))
    setAdjustReason('')
  }

  const handleSubmitAdjust = (row: StockRow) => {
    if (!adjustReason.trim()) return
    setConfirmAdjust({
      variantId: row.variantId,
      warehouseId: row.warehouseId,
      newQty: newQuantity,
      reason: adjustReason,
    })
  }

  const handleConfirmAdjust = async () => {
    if (!confirmAdjust) return
    await adjustMutation.mutateAsync({
      variantId: confirmAdjust.variantId,
      warehouseId: confirmAdjust.warehouseId,
      newQuantity: confirmAdjust.newQty,
      reason: confirmAdjust.reason,
    })
    setConfirmAdjust(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg">
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
            Stok Sayım & Düzeltme
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Fiziksel sayım sonuçlarını girin, sistem otomatik düzeltme kaydı oluşturur
          </p>
        </div>
        <ExportButton
          data={filtered}
          filename="stok-sayim"
          columns={[
            { key: 'variant.sku', header: 'SKU' },
            { key: 'variant.product.name', header: 'Ürün' },
            { key: 'warehouse.name', header: 'Depo' },
            { key: 'quantity', header: 'Miktar' },
            { key: 'reservedQuantity', header: 'Rezerve' },
          ]}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Toplam Kalem', value: stats.totalItems, icon: Package, color: 'from-blue-500 to-indigo-500' },
          { label: 'Toplam Stok', value: stats.totalQty.toLocaleString('tr-TR'), icon: Warehouse, color: 'from-emerald-500 to-green-500' },
          { label: 'Kritik Stok', value: stats.lowStock, icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
          { label: 'Rezerve', value: stats.reserved.toLocaleString('tr-TR'), icon: Filter, color: 'from-purple-500 to-violet-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${color} mb-2`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="SKU, ürün adı, depo ara..."
            value={globalFilter}
            onChange={(e) => { setGlobalFilter(e.target.value); setPage(1) }}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          {globalFilter && (
            <button onClick={() => setGlobalFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <select
          value={warehouseFilter}
          onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1) }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="">Tüm Depolar</option>
          {(warehouses as any[]).map((w: any) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <Package className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">Stok verisi bulunamadı</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Ürün</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Depo</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Sistem Stok</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Rezerve</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Kullanılabilir</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Sayım / Düzeltme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginated.map((row) => {
                const available = (row.quantity || 0) - (row.reservedQuantity || 0)
                const isEditing = editingRow === row.id
                const isLow = row.quantity < 10

                return (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`group transition-colors ${isEditing ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30'}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {row.variant?.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{row.variant?.product?.name}</div>
                      <div className="text-xs text-gray-500">{row.variant?.size} {row.variant?.color || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.warehouse?.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${isLow ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {row.quantity}
                      </span>
                      {isLow && <AlertTriangle className="inline ml-1 h-3.5 w-3.5 text-red-500" />}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{row.reservedQuantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{available}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            value={newQuantity}
                            onChange={(e) => setNewQuantity(e.target.value)}
                            className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            min="0"
                          />
                          <input
                            type="text"
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            placeholder="Neden..."
                            className="w-32 rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            onClick={() => handleSubmitAdjust(row)}
                            disabled={!adjustReason.trim() || newQuantity === String(row.quantity)}
                            className="rounded-lg bg-emerald-500 p-1.5 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setEditingRow(null); setNewQuantity(''); setAdjustReason('') }}
                            className="rounded-lg bg-gray-200 p-1.5 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleStartEdit(row)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            Düzelt
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmAdjust}
        onClose={() => setConfirmAdjust(null)}
        onConfirm={handleConfirmAdjust}
        title="Stok Düzeltme Onayı"
        message={confirmAdjust ? `Stok miktarı ${confirmAdjust.newQty} olarak güncellenecek. Neden: ${confirmAdjust.reason}` : ''}
        confirmLabel="Düzelt"
        variant="warning"
        loading={adjustMutation.isPending}
      />
    </div>
  )
}
