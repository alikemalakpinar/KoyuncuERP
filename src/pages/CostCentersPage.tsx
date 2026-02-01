/**
 * Maliyet Merkezi Yönetimi – Tree View
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building, Plus, ChevronRight, ChevronDown,
} from 'lucide-react'
import ExportButton from '../components/ui/ExportButton'
import { useCostCentersTreeQuery, useCostCentersQuery, useCreateCostCenter } from '../hooks/useIpc'

export default function CostCentersPage() {
  const { data: tree = [], isLoading } = useCostCentersTreeQuery()
  const { data: flat = [] } = useCostCentersQuery()
  const createCC = useCreateCostCenter()
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({ code: '', name: '', parentId: '' })

  function toggleExpand(id: string) {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  async function handleCreate() {
    await createCC.mutateAsync({ ...form, parentId: form.parentId || undefined })
    setShowForm(false)
    setForm({ code: '', name: '', parentId: '' })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Maliyet Merkezleri</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Üretim, yönetim ve destek maliyet merkezleri</p>
        </div>
        <div className="flex gap-3">
          <ExportButton data={flat as any[]} filename="maliyet-merkezleri" columns={[{ key: 'code', header: 'Kod' }, { key: 'name', header: 'Ad' }]} />
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
            <Plus className="h-4 w-4" /> Yeni Merkez
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Kod (ör: PROD-01)" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ad (ör: Dokuma Hattı 1)" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
            <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm">
              <option value="">Üst Merkez Yok</option>
              {(flat as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} disabled={!form.code || !form.name || createCC.isPending} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
            {createCC.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary overflow-hidden">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-gray-400">Yükleniyor...</div>
        ) : (tree as any[]).length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400">Henüz maliyet merkezi eklenmemiş</div>
        ) : (
          <div className="divide-y divide-border dark:divide-border-dark">
            {(tree as any[]).map((node: any) => (
              <CostCenterNode key={node.id} node={node} depth={0} expanded={expanded} onToggle={toggleExpand} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function CostCenterNode({ node, depth, expanded, onToggle }: { node: any; depth: number; expanded: Set<string>; onToggle: (id: string) => void }) {
  const hasChildren = node.children?.length > 0
  const isExpanded = expanded.has(node.id)

  return (
    <>
      <div
        className="flex items-center gap-2 px-4 py-3 hover:bg-surface-secondary/50 dark:hover:bg-surface-dark-tertiary/50 cursor-pointer"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        {hasChildren ? (
          isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        ) : (
          <Building className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        )}
        <span className="font-mono text-xs text-gray-500 w-20 shrink-0">{node.code}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{node.name}</span>
      </div>
      {hasChildren && isExpanded && node.children.map((child: any) => (
        <CostCenterNode key={child.id} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
      ))}
    </>
  )
}
