/**
 * Üretim (Manufacturing) – BOM & Work Orders
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Factory, Plus, Search, ClipboardList, Layers, ChevronRight,
  Play, Square, Check, X, Package, Truck,
} from 'lucide-react'
import Pagination from '../components/ui/Pagination'
import ExportButton from '../components/ui/ExportButton'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import {
  useBomListQuery, useCreateBom, useBomCostQuery,
  useWorkOrdersQuery, useCreateWorkOrder, useWorkOrderAction,
} from '../hooks/useIpc'
import { useWarehousesQuery } from '../hooks/useIpc'

type MfgTab = 'bom' | 'workorders'

const woStatusLabels: Record<string, string> = {
  DRAFT: 'Taslak', RELEASED: 'Serbest', IN_PROGRESS: 'Üretimde',
  COMPLETED: 'Tamamlandı', CANCELLED: 'İptal',
}

const woStatusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  RELEASED: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  IN_PROGRESS: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  COMPLETED: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  CANCELLED: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
}

export default function ManufacturingPage() {
  const [activeTab, setActiveTab] = useState<MfgTab>('workorders')

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Üretim Yönetimi (MES)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Reçeteler (BOM) ve iş emirleri</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-2xl bg-surface-secondary dark:bg-surface-dark-secondary p-1">
        <button onClick={() => setActiveTab('workorders')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === 'workorders' ? 'bg-white dark:bg-surface-dark-tertiary text-brand-700 dark:text-brand-300 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
          <ClipboardList className="h-4 w-4" /> İş Emirleri
        </button>
        <button onClick={() => setActiveTab('bom')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === 'bom' ? 'bg-white dark:bg-surface-dark-tertiary text-brand-700 dark:text-brand-300 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
          <Layers className="h-4 w-4" /> Reçeteler (BOM)
        </button>
      </div>

      {activeTab === 'workorders' && <WorkOrdersTab />}
      {activeTab === 'bom' && <BomTab />}
    </motion.div>
  )
}

// ── Work Orders Tab ─────────────────────────────────────────

function WorkOrdersTab() {
  const { data: orders = [], isLoading } = useWorkOrdersQuery()
  const { data: warehouses = [] } = useWarehousesQuery()
  const woAction = useWorkOrderAction()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState<{ action: string; id: string; label: string } | null>(null)
  const pageSize = 15

  const filtered = useMemo(() => {
    let list = orders as any[]
    if (statusFilter) list = list.filter((o: any) => o.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((o: any) => o.workOrderNo?.toLowerCase().includes(q))
    }
    return list
  }, [orders, search, statusFilter])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const defaultWarehouseId = (warehouses as any[])[0]?.id || ''

  async function handleAction(action: string, id: string) {
    if (action === 'consume') {
      await woAction.mutateAsync({ action, workOrderId: id, warehouseId: defaultWarehouseId })
    } else if (action === 'complete') {
      await woAction.mutateAsync({ action, workOrderId: id, warehouseId: defaultWarehouseId, producedQty: 1 })
    } else {
      await woAction.mutateAsync({ action, id })
    }
    setConfirmAction(null)
  }

  function getActions(status: string): { action: string; label: string; icon: typeof Play }[] {
    switch (status) {
      case 'DRAFT': return [{ action: 'release', label: 'Serbest Bırak', icon: ChevronRight }, { action: 'cancel', label: 'İptal', icon: X }]
      case 'RELEASED': return [{ action: 'start', label: 'Başlat', icon: Play }, { action: 'cancel', label: 'İptal', icon: X }]
      case 'IN_PROGRESS': return [{ action: 'consume', label: 'Malzeme Çık', icon: Package }, { action: 'complete', label: 'Tamamla', icon: Check }, { action: 'cancel', label: 'İptal', icon: X }]
      default: return []
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İş emri ara..." className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-10 pr-4 py-2 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm">
          <option value="">Tüm Durumlar</option>
          {Object.entries(woStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <ExportButton data={filtered} filename="is-emirleri" columns={[{ key: 'workOrderNo', header: 'İş Emri No' }, { key: 'status', header: 'Durum' }, { key: 'plannedQty', header: 'Planlanan' }]} />
      </div>

      <div className="rounded-2xl border border-border dark:border-border-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-secondary dark:bg-surface-dark-secondary">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">İş Emri No</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Durum</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Planlanan</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Üretilen</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Fire</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Planlanan Başlangıç</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border-dark">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">İş emri bulunamadı</td></tr>
            ) : paged.map((wo: any) => (
              <tr key={wo.id} className="hover:bg-surface-secondary/50 dark:hover:bg-surface-dark-secondary/50">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{wo.workOrderNo}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${woStatusColors[wo.status] || ''}`}>
                    {woStatusLabels[wo.status] || wo.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">{wo.plannedQty}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">{wo.producedQty || 0}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-500">{wo.wasteQty || 0}</td>
                <td className="px-4 py-3 text-gray-500">{wo.plannedStart ? new Date(wo.plannedStart).toLocaleDateString('tr-TR') : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {getActions(wo.status).map((a) => (
                      <button key={a.action} onClick={() => setConfirmAction({ action: a.action, id: wo.id, label: a.label })} title={a.label} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
                        <a.icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.label || ''}
        message={`Bu iş emri üzerinde "${confirmAction?.label}" işlemini uygulamak istediğinize emin misiniz?`}
        confirmLabel={confirmAction?.label || 'Onayla'}
        onConfirm={() => confirmAction && handleAction(confirmAction.action, confirmAction.id)}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  )
}

// ── BOM Tab ─────────────────────────────────────────────────

function BomTab() {
  const { data: boms = [], isLoading } = useBomListQuery()
  const [selectedBomId, setSelectedBomId] = useState<string | null>(null)
  const { data: bomCost } = useBomCostQuery(selectedBomId)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return boms as any[]
    const q = search.toLowerCase()
    return (boms as any[]).filter((b: any) => b.name?.toLowerCase().includes(q) || b.code?.toLowerCase().includes(q))
  }, [boms, search])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="BOM ara..." className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-10 pr-4 py-2 text-sm" />
        </div>
        <ExportButton data={filtered} filename="receteler" columns={[{ key: 'code', header: 'Kod' }, { key: 'name', header: 'Ad' }]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* BOM List */}
        <div className="lg:col-span-2 rounded-2xl border border-border dark:border-border-dark overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary dark:bg-surface-dark-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Kod</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Ad</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Kalem Sayısı</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border-dark">
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Reçete bulunamadı</td></tr>
              ) : filtered.map((bom: any) => (
                <tr
                  key={bom.id}
                  onClick={() => setSelectedBomId(bom.id)}
                  className={`cursor-pointer hover:bg-surface-secondary/50 dark:hover:bg-surface-dark-secondary/50 ${selectedBomId === bom.id ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{bom.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{bom.name}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{bom.items?.length || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-lg ${bom.isActive ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-gray-100 text-gray-500'}`}>
                      {bom.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cost Breakdown */}
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">Maliyet Analizi</h3>
          {!selectedBomId ? (
            <p className="text-sm text-gray-400">Maliyet görmek için bir reçete seçin</p>
          ) : !bomCost ? (
            <p className="text-sm text-gray-400">Yükleniyor...</p>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Malzeme</span>
                  <span className="font-mono font-medium text-gray-900 dark:text-white">{(bomCost as any).materialCost} TL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">İşçilik</span>
                  <span className="font-mono font-medium text-gray-900 dark:text-white">{(bomCost as any).laborCost} TL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Genel Gider</span>
                  <span className="font-mono font-medium text-gray-900 dark:text-white">{(bomCost as any).overheadCost} TL</span>
                </div>
                <div className="border-t border-border dark:border-border-dark pt-2 flex justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">Toplam Maliyet</span>
                  <span className="font-mono font-bold text-brand-600">{(bomCost as any).totalCost} TL</span>
                </div>
              </div>
              {(bomCost as any).breakdown?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Malzeme Detay</p>
                  {(bomCost as any).breakdown.map((b: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{b.productName} x{b.qty}</span>
                      <span className="font-mono">{b.lineCost} TL</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
