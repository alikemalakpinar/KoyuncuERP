/**
 * İrsaliye (Waybill / Delivery Note) Modülü
 *
 * - Sevk irsaliyesi oluşturma
 * - Faturaya dönüştürme
 * - İrsaliye detay görüntüleme
 * - Alış / Satış irsaliyeleri
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, Plus, Search, FileText, Package, CheckCircle,
  Clock, ArrowUpRight, ArrowDownRight, Eye, Printer,
  ArrowRight, X, MapPin, Calendar, Hash, Building2, User,
} from 'lucide-react'
import Pagination from '../components/ui/Pagination'
import ExportButton from '../components/ui/ExportButton'
import { useAuth } from '../contexts/AuthContext'

// ── Types ──────────────────────────────────────────────────

type WaybillType = 'SALES' | 'PURCHASE' | 'TRANSFER' | 'RETURN'
type WaybillStatus = 'DRAFT' | 'DISPATCHED' | 'DELIVERED' | 'INVOICED' | 'CANCELLED'

interface WaybillItem {
  productName: string
  sku: string
  quantity: number
  unit: string
}

interface Waybill {
  id: string
  waybillNo: string
  type: WaybillType
  status: WaybillStatus
  accountId: string
  accountName: string
  date: string
  deliveryAddress: string
  driverName?: string
  vehiclePlate?: string
  invoiceNo?: string
  items: WaybillItem[]
  notes?: string
}

// ── Constants ──────────────────────────────────────────────

const typeLabels: Record<WaybillType, string> = {
  SALES: 'Satış İrsaliyesi', PURCHASE: 'Alış İrsaliyesi',
  TRANSFER: 'Transfer İrsaliyesi', RETURN: 'İade İrsaliyesi',
}
const typeColors: Record<WaybillType, string> = {
  SALES: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  PURCHASE: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  TRANSFER: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  RETURN: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
}

const statusLabels: Record<WaybillStatus, string> = {
  DRAFT: 'Taslak', DISPATCHED: 'Sevk Edildi', DELIVERED: 'Teslim Edildi',
  INVOICED: 'Faturalandı', CANCELLED: 'İptal',
}
const statusColors: Record<WaybillStatus, string> = {
  DRAFT: 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
  DISPATCHED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  DELIVERED: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  INVOICED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  CANCELLED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
}

// ── Demo Data ──────────────────────────────────────────────

const DEMO_WAYBILLS: Waybill[] = [
  {
    id: 'w1', waybillNo: 'İRS-2026-001', type: 'SALES', status: 'INVOICED', accountId: 'a1',
    accountName: 'HomeStyle Inc.', date: '2026-01-28', deliveryAddress: '100 5th Ave, New York, NY',
    driverName: 'Ahmet Yılmaz', vehiclePlate: '34 ABC 123', invoiceNo: 'FTR-2026-001',
    items: [
      { productName: 'Anatolia Red - 120x180', sku: 'ANT-RED-120', quantity: 24, unit: 'adet' },
      { productName: 'Cappadocia Blue - 200x300', sku: 'CAP-BLU-200', quantity: 12, unit: 'adet' },
    ],
  },
  {
    id: 'w2', waybillNo: 'İRS-2026-002', type: 'SALES', status: 'DISPATCHED', accountId: 'a2',
    accountName: 'West Coast Carpets', date: '2026-01-30', deliveryAddress: '456 Market St, Los Angeles, CA',
    driverName: 'Mehmet Kaya', vehiclePlate: '34 DEF 456',
    items: [
      { productName: 'Istanbul Gold - 160x230', sku: 'IST-GLD-160', quantity: 18, unit: 'adet' },
      { productName: 'Aegean Grey - 80x150', sku: 'AEG-GRY-80', quantity: 36, unit: 'adet' },
      { productName: 'Bodrum White - 120x180', sku: 'BDR-WHT-120', quantity: 8, unit: 'adet' },
    ],
  },
  {
    id: 'w3', waybillNo: 'İRS-2026-003', type: 'PURCHASE', status: 'DELIVERED', accountId: 'a3',
    accountName: 'Anatolian Textile Co.', date: '2026-01-25', deliveryAddress: 'Koyuncu Depo, Istanbul',
    items: [
      { productName: 'Hammadde - Yün Top', sku: 'HAM-YUN-01', quantity: 500, unit: 'kg' },
      { productName: 'Hammadde - İpek İplik', sku: 'HAM-IPK-01', quantity: 120, unit: 'kg' },
    ],
  },
  {
    id: 'w4', waybillNo: 'İRS-2026-004', type: 'SALES', status: 'DRAFT', accountId: 'a4',
    accountName: 'Southern Flooring Co.', date: '2026-02-01', deliveryAddress: '789 Peach St, Atlanta, GA',
    items: [
      { productName: 'Konya Multi - 200x300', sku: 'KNY-MLT-200', quantity: 15, unit: 'adet' },
    ],
  },
  {
    id: 'w5', waybillNo: 'İRS-2026-005', type: 'TRANSFER', status: 'DELIVERED', accountId: '',
    accountName: 'İç Transfer', date: '2026-01-22', deliveryAddress: 'USA Depo, New Jersey',
    items: [
      { productName: 'Anatolia Red - 80x150', sku: 'ANT-RED-80', quantity: 50, unit: 'adet' },
      { productName: 'Cappadocia Blue - 120x180', sku: 'CAP-BLU-120', quantity: 30, unit: 'adet' },
    ],
    notes: 'Konteyner: MSKU1234567 — Gemi: MSC ISTANBUL',
  },
  {
    id: 'w6', waybillNo: 'İRS-2026-006', type: 'RETURN', status: 'DELIVERED', accountId: 'a2',
    accountName: 'West Coast Carpets', date: '2026-01-20', deliveryAddress: 'Koyuncu Depo, Istanbul',
    items: [
      { productName: 'Istanbul Gold - 120x180', sku: 'IST-GLD-120', quantity: 3, unit: 'adet' },
    ],
    notes: 'Hasarlı ürün iadesi',
  },
  {
    id: 'w7', waybillNo: 'İRS-2026-007', type: 'SALES', status: 'DELIVERED', accountId: 'a6',
    accountName: 'Midwest Distributors', date: '2026-01-18', deliveryAddress: '321 Lake Shore Dr, Chicago, IL',
    driverName: 'Hasan Çelik', vehiclePlate: '34 GHI 789', invoiceNo: 'FTR-2026-003',
    items: [
      { productName: 'Aegean Grey - 160x230', sku: 'AEG-GRY-160', quantity: 20, unit: 'adet' },
    ],
  },
  {
    id: 'w8', waybillNo: 'İRS-2026-008', type: 'PURCHASE', status: 'DISPATCHED', accountId: 'a5',
    accountName: 'İpek İplik A.Ş.', date: '2026-01-29', deliveryAddress: 'Koyuncu Üretim, Kayseri',
    items: [
      { productName: 'Hammadde - Akrilik İplik', sku: 'HAM-AKR-01', quantity: 800, unit: 'kg' },
    ],
  },
]

// ── Component ──────────────────────────────────────────────

export default function WaybillsPage() {
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | WaybillType>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | WaybillStatus>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [detailId, setDetailId] = useState<string | null>(null)

  const canEdit = hasPermission('create_invoice')

  const filtered = useMemo(() => {
    return DEMO_WAYBILLS.filter((w) => {
      if (typeFilter !== 'ALL' && w.type !== typeFilter) return false
      if (statusFilter !== 'ALL' && w.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          w.waybillNo.toLowerCase().includes(q) ||
          w.accountName.toLowerCase().includes(q) ||
          w.items.some((i) => i.productName.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [search, typeFilter, statusFilter])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const detailWaybill = detailId ? DEMO_WAYBILLS.find((w) => w.id === detailId) : null

  // KPIs
  const totalSales = DEMO_WAYBILLS.filter((w) => w.type === 'SALES').length
  const pending = DEMO_WAYBILLS.filter((w) => w.status === 'DISPATCHED').length
  const notInvoiced = DEMO_WAYBILLS.filter((w) => w.type === 'SALES' && w.status === 'DELIVERED' && !w.invoiceNo).length
  const totalItems = DEMO_WAYBILLS.reduce((s, w) => s + w.items.reduce((ss, i) => ss + i.quantity, 0), 0)

  const exportColumns = [
    { key: 'waybillNo', header: 'İrsaliye No' },
    { key: 'type', header: 'Tür', format: (v: WaybillType) => typeLabels[v] },
    { key: 'status', header: 'Durum', format: (v: WaybillStatus) => statusLabels[v] },
    { key: 'accountName', header: 'Cari' },
    { key: 'date', header: 'Tarih' },
    { key: 'deliveryAddress', header: 'Teslimat Adresi' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">İrsaliyeler</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sevk irsaliyesi yönetimi ve faturaya dönüştürme</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={exportColumns} filename="irsaliyeler" />
          {canEdit && (
            <button className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
              <Plus className="h-4 w-4" />
              Yeni İrsaliye
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Satış İrsaliyeleri</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSales}</p>
          <p className="text-xs text-gray-500 mt-1">Bu ay</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Yolda</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
          <p className="text-xs text-gray-500 mt-1">Sevk edildi, teslim bekleniyor</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Faturalanmamış</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{notInvoiced}</p>
          <p className="text-xs text-gray-500 mt-1">Fatura kesilmesi bekleniyor</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Toplam Kalem</span>
            <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <Package className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">adet/kg sevk edildi</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="İrsaliye no, cari veya ürün ara..."
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1) }}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
        >
          <option value="ALL">Tüm Türler</option>
          {Object.entries(typeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1) }}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
        >
          <option value="ALL">Tüm Durumlar</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">İrsaliye No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tür</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cari</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tarih</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Ürünler</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Teslimat</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Durum</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Fatura</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Truck className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">İrsaliye bulunamadı</p>
                    <p className="text-xs text-gray-400 mt-1">Filtre kriterlerini değiştirin</p>
                  </td>
                </tr>
              ) : paginated.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors cursor-pointer"
                  onClick={() => setDetailId(w.id)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-gray-900 dark:text-white">{w.waybillNo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${typeColors[w.type]}`}>
                      {typeLabels[w.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white text-xs">{w.accountName}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{w.date}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {w.items.length} kalem, {w.items.reduce((s, i) => s + i.quantity, 0)} {w.items[0]?.unit || 'adet'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">{w.deliveryAddress}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${statusColors[w.status]}`}>
                      {statusLabels[w.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {w.invoiceNo ? (
                      <span className="text-xs font-mono text-indigo-600">{w.invoiceNo}</span>
                    ) : w.type === 'SALES' && (w.status === 'DELIVERED' || w.status === 'DISPATCHED') ? (
                      <button
                        onClick={(e) => { e.stopPropagation() }}
                        className="text-[11px] font-medium text-brand-600 hover:text-brand-800 transition-colors"
                      >
                        Faturala →
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-1">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDetailId(w.id) }}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Detail Slide-over */}
      <AnimatePresence>
        {detailWaybill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm"
            onClick={() => setDetailId(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="w-full max-w-lg bg-white dark:bg-surface-dark-secondary border-l border-border dark:border-border-dark overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{detailWaybill.waybillNo}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${typeColors[detailWaybill.type]}`}>
                        {typeLabels[detailWaybill.type]}
                      </span>
                      <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${statusColors[detailWaybill.status]}`}>
                        {statusLabels[detailWaybill.status]}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setDetailId(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Cari</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{detailWaybill.accountName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Tarih</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{detailWaybill.date}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 col-span-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Teslimat Adresi</p>
                      <p className="text-sm text-gray-900 dark:text-white">{detailWaybill.deliveryAddress}</p>
                    </div>
                  </div>
                  {detailWaybill.driverName && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Sürücü</p>
                        <p className="text-sm text-gray-900 dark:text-white">{detailWaybill.driverName}</p>
                      </div>
                    </div>
                  )}
                  {detailWaybill.vehiclePlate && (
                    <div className="flex items-start gap-2">
                      <Truck className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Araç Plaka</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">{detailWaybill.vehiclePlate}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items */}
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Kalemler</h3>
                <div className="space-y-2 mb-6">
                  {detailWaybill.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                        <p className="text-[11px] font-mono text-gray-400">{item.sku}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>

                {detailWaybill.notes && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/20 p-3 mb-6">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Not: {detailWaybill.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border dark:border-border-dark px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
                    <Printer className="h-4 w-4" />
                    Yazdır
                  </button>
                  {detailWaybill.type === 'SALES' && !detailWaybill.invoiceNo && (
                    <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
                      <FileText className="h-4 w-4" />
                      Faturaya Dönüştür
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
