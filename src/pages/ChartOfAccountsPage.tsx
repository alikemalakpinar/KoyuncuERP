/**
 * Hesap Planı (Chart of Accounts) – Tree View
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpenCheck, Plus, Search, ChevronRight, ChevronDown, FolderTree,
} from 'lucide-react'
import ExportButton from '../components/ui/ExportButton'
import { useCoaTreeQuery, useCoaListQuery, useCreateCoaAccount } from '../hooks/useIpc'

const typeLabels: Record<string, string> = {
  ASSET: 'Aktif', LIABILITY: 'Pasif', EQUITY: 'Öz Kaynak',
  REVENUE: 'Gelir', EXPENSE: 'Gider',
}

const typeColors: Record<string, string> = {
  ASSET: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  LIABILITY: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  EQUITY: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  REVENUE: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  EXPENSE: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
}

export default function ChartOfAccountsPage() {
  const { data: tree = [], isLoading } = useCoaTreeQuery()
  const { data: flat = [] } = useCoaListQuery()
  const createAccount = useCreateCoaAccount()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({ code: '', name: '', type: 'ASSET', parentId: '', currency: 'TRY' })

  function toggleExpand(id: string) {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  async function handleCreate() {
    await createAccount.mutateAsync({ ...form, parentId: form.parentId || undefined })
    setShowForm(false)
    setForm({ code: '', name: '', type: 'ASSET', parentId: '', currency: 'TRY' })
  }

  const filteredTree = useMemo(() => {
    if (!search) return tree as any[]
    const q = search.toLowerCase()
    return (flat as any[]).filter((a: any) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q))
  }, [tree, flat, search])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hesap Planı</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Hiyerarşik hesap planı yönetimi</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hesap ara..." className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-10 pr-4 py-2 text-sm" />
        </div>
        <ExportButton data={flat as any[]} filename="hesap-plani" columns={[{ key: 'code', header: 'Kod' }, { key: 'name', header: 'Ad' }, { key: 'type', header: 'Tip' }]} />
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
          <Plus className="h-4 w-4" /> Yeni Hesap
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Kod (100.01)" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Hesap Adı" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm">
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm">
              <option value="">Üst Hesap Yok</option>
              {(flat as any[]).map((a: any) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm">
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <button onClick={handleCreate} disabled={!form.code || !form.name || createAccount.isPending} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
            {createAccount.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {/* Tree view */}
      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary overflow-hidden">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-gray-400">Yükleniyor...</div>
        ) : search ? (
          <div className="divide-y divide-border dark:divide-border-dark">
            {filteredTree.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">Sonuç bulunamadı</div>
            ) : filteredTree.map((acc: any) => (
              <div key={acc.id} className="flex items-center gap-3 px-4 py-3">
                <span className="font-mono text-xs text-gray-500 w-24">{acc.code}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{acc.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-lg ${typeColors[acc.type] || ''}`}>{typeLabels[acc.type] || acc.type}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border dark:divide-border-dark">
            {(filteredTree as any[]).length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">Henüz hesap eklenmemiş</div>
            ) : (filteredTree as any[]).map((node: any) => (
              <TreeNode key={node.id} node={node} depth={0} expanded={expanded} onToggle={toggleExpand} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function TreeNode({ node, depth, expanded, onToggle }: { node: any; depth: number; expanded: Set<string>; onToggle: (id: string) => void }) {
  const hasChildren = node.children?.length > 0
  const isExpanded = expanded.has(node.id)

  return (
    <>
      <div
        className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface-secondary/50 dark:hover:bg-surface-dark-tertiary/50 cursor-pointer"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        {hasChildren ? (
          isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        ) : (
          <div className="w-3.5 shrink-0" />
        )}
        <span className="font-mono text-xs text-gray-500 w-24 shrink-0">{node.code}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{node.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-lg ${typeColors[node.type] || ''}`}>{typeLabels[node.type] || node.type}</span>
      </div>
      {hasChildren && isExpanded && node.children.map((child: any) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
      ))}
    </>
  )
}
