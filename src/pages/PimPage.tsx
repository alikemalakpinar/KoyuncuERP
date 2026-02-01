/**
 * PIM – Product Information Management
 *
 * Tabs: Attributes | Categories | Units of Measure | Dimensions & Variants
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Tags, FolderTree, Ruler, Grid3X3, Plus, Search, ChevronRight,
  ArrowRightLeft, Settings2, Hash, Type, ToggleLeft,
} from 'lucide-react'
import Pagination from '../components/ui/Pagination'
import ExportButton from '../components/ui/ExportButton'
import {
  usePimAttributesQuery, useCreatePimAttribute,
  usePimCategoriesQuery, useCreatePimCategory,
  usePimUomQuery, useCreatePimUom, useAddPimUomConversion, usePimUomConversionsQuery,
  usePimDimensionsQuery, useCreatePimDimension, useAddPimDimensionValue, useGeneratePimVariants,
} from '../hooks/useIpc'

type PimTab = 'attributes' | 'categories' | 'uom' | 'dimensions'

const tabs: { key: PimTab; label: string; icon: typeof Tags }[] = [
  { key: 'attributes', label: 'Özellikler', icon: Tags },
  { key: 'categories', label: 'Kategoriler', icon: FolderTree },
  { key: 'uom', label: 'Ölçü Birimleri', icon: Ruler },
  { key: 'dimensions', label: 'Boyutlar & Varyant', icon: Grid3X3 },
]

const dataTypeIcons: Record<string, typeof Type> = {
  TEXT: Type,
  NUMBER: Hash,
  BOOLEAN: ToggleLeft,
  SELECT: Settings2,
}

export default function PimPage() {
  const [activeTab, setActiveTab] = useState<PimTab>('attributes')

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ürün Bilgi Yönetimi (PIM)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Özellikler, kategoriler, birimler ve varyant yönetimi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-surface-secondary dark:bg-surface-dark-secondary p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white dark:bg-surface-dark-tertiary text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'attributes' && <AttributesTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'uom' && <UomTab />}
      {activeTab === 'dimensions' && <DimensionsTab />}
    </motion.div>
  )
}

// ── Attributes Tab ──────────────────────────────────────────

function AttributesTab() {
  const { data: attributes = [], isLoading } = usePimAttributesQuery()
  const createAttr = useCreatePimAttribute()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', dataType: 'TEXT', unit: '', isRequired: false, isFilterable: true, options: '' })
  const [page, setPage] = useState(1)
  const pageSize = 20

  const filtered = useMemo(() => {
    if (!search) return attributes as any[]
    const q = search.toLowerCase()
    return (attributes as any[]).filter((a: any) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q))
  }, [attributes, search])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  async function handleCreate() {
    await createAttr.mutateAsync({
      ...form,
      options: form.options ? form.options.split(',').map((s: string) => s.trim()) : [],
    })
    setShowForm(false)
    setForm({ code: '', name: '', dataType: 'TEXT', unit: '', isRequired: false, isFilterable: true, options: '' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Özellik ara..." className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-10 pr-4 py-2 text-sm" />
        </div>
        <ExportButton data={filtered} filename="pim-attributes" columns={[{ key: 'code', header: 'Kod' }, { key: 'name', header: 'Ad' }, { key: 'dataType', header: 'Tip' }, { key: 'unit', header: 'Birim' }]} />
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
          <Plus className="h-4 w-4" /> Yeni Özellik
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Kod (ör: WEIGHT)" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ad (ör: Ağırlık)" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
            <select value={form.dataType} onChange={(e) => setForm({ ...form, dataType: e.target.value })} className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm">
              <option value="TEXT">Metin</option>
              <option value="NUMBER">Sayı</option>
              <option value="BOOLEAN">Evet/Hayır</option>
              <option value="SELECT">Seçim Listesi</option>
            </select>
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Birim (ör: kg)" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
          </div>
          {form.dataType === 'SELECT' && (
            <input value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder="Seçenekler (virgülle ayırın)" className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
          )}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} className="rounded" /> Zorunlu
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" checked={form.isFilterable} onChange={(e) => setForm({ ...form, isFilterable: e.target.checked })} className="rounded" /> Filtrelenebilir
            </label>
            <button onClick={handleCreate} disabled={!form.code || !form.name || createAttr.isPending} className="ml-auto rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
              {createAttr.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border dark:border-border-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-secondary dark:bg-surface-dark-secondary">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Kod</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Ad</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Tip</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Birim</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Zorunlu</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Filtre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border-dark">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Henüz özellik eklenmemiş</td></tr>
            ) : paged.map((attr: any) => {
              const Icon = dataTypeIcons[attr.dataType] || Type
              return (
                <tr key={attr.id} className="hover:bg-surface-secondary/50 dark:hover:bg-surface-dark-secondary/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{attr.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{attr.name}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400"><Icon className="h-3.5 w-3.5" />{attr.dataType}</span></td>
                  <td className="px-4 py-3 text-gray-500">{attr.unit || '—'}</td>
                  <td className="px-4 py-3 text-center">{attr.isRequired ? <span className="text-brand-600">Evet</span> : <span className="text-gray-400">Hayır</span>}</td>
                  <td className="px-4 py-3 text-center">{attr.isFilterable ? <span className="text-brand-600">Evet</span> : <span className="text-gray-400">Hayır</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      )}
    </div>
  )
}

// ── Categories Tab ──────────────────────────────────────────

function CategoriesTab() {
  const { data: categories = [], isLoading } = usePimCategoriesQuery()
  const createCat = useCreatePimCategory()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', parentId: '' })

  async function handleCreate() {
    await createCat.mutateAsync({ ...form, parentId: form.parentId || undefined })
    setShowForm(false)
    setForm({ code: '', name: '', parentId: '' })
  }

  const roots = (categories as any[]).filter((c: any) => !c.parentId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{(categories as any[]).length} kategori</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
          <Plus className="h-4 w-4" /> Yeni Kategori
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Kod" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ad" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
            <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm">
              <option value="">Üst Kategori Yok</option>
              {(categories as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} disabled={!form.code || !form.name || createCat.isPending} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
            {createCat.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary divide-y divide-border dark:divide-border-dark">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-gray-400">Yükleniyor...</div>
        ) : roots.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400">Henüz kategori eklenmemiş</div>
        ) : roots.map((cat: any) => (
          <div key={cat.id} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-brand-500" />
              <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
              <span className="text-xs text-gray-400 font-mono">{cat.code}</span>
            </div>
            {cat.children?.length > 0 && (
              <div className="ml-6 mt-2 space-y-1">
                {cat.children.map((child: any) => (
                  <div key={child.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <ChevronRight className="h-3 w-3" />
                    {child.name}
                    <span className="text-xs font-mono text-gray-400">{child.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── UoM Tab ─────────────────────────────────────────────────

function UomTab() {
  const { data: units = [], isLoading } = usePimUomQuery()
  const { data: conversions = [] } = usePimUomConversionsQuery()
  const createUom = useCreatePimUom()
  const addConversion = useAddPimUomConversion()
  const [showUomForm, setShowUomForm] = useState(false)
  const [showConvForm, setShowConvForm] = useState(false)
  const [uomForm, setUomForm] = useState({ code: '', name: '', category: 'WEIGHT', isBase: false })
  const [convForm, setConvForm] = useState({ fromUomId: '', toUomId: '', factor: '' })

  async function handleCreateUom() {
    await createUom.mutateAsync(uomForm)
    setShowUomForm(false)
    setUomForm({ code: '', name: '', category: 'WEIGHT', isBase: false })
  }

  async function handleCreateConv() {
    await addConversion.mutateAsync({ ...convForm, factor: parseFloat(convForm.factor) })
    setShowConvForm(false)
    setConvForm({ fromUomId: '', toUomId: '', factor: '' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">{(units as any[]).length} birim, {(conversions as any[]).length} dönüşüm</p>
        <button onClick={() => setShowConvForm(!showConvForm)} className="flex items-center gap-2 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
          <ArrowRightLeft className="h-4 w-4" /> Dönüşüm Ekle
        </button>
        <button onClick={() => setShowUomForm(!showUomForm)} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
          <Plus className="h-4 w-4" /> Yeni Birim
        </button>
      </div>

      {showUomForm && (
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <input value={uomForm.code} onChange={(e) => setUomForm({ ...uomForm, code: e.target.value })} placeholder="Kod (ör: KG)" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
            <input value={uomForm.name} onChange={(e) => setUomForm({ ...uomForm, name: e.target.value })} placeholder="Ad (ör: Kilogram)" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
            <select value={uomForm.category} onChange={(e) => setUomForm({ ...uomForm, category: e.target.value })} className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm">
              <option value="WEIGHT">Ağırlık</option>
              <option value="LENGTH">Uzunluk</option>
              <option value="AREA">Alan</option>
              <option value="VOLUME">Hacim</option>
              <option value="COUNT">Adet</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" checked={uomForm.isBase} onChange={(e) => setUomForm({ ...uomForm, isBase: e.target.checked })} className="rounded" /> Temel Birim
            </label>
          </div>
          <button onClick={handleCreateUom} disabled={!uomForm.code || !uomForm.name || createUom.isPending} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
            {createUom.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {showConvForm && (
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <select value={convForm.fromUomId} onChange={(e) => setConvForm({ ...convForm, fromUomId: e.target.value })} className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm">
              <option value="">Kaynak Birim</option>
              {(units as any[]).map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
            </select>
            <select value={convForm.toUomId} onChange={(e) => setConvForm({ ...convForm, toUomId: e.target.value })} className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm">
              <option value="">Hedef Birim</option>
              {(units as any[]).map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
            </select>
            <input value={convForm.factor} onChange={(e) => setConvForm({ ...convForm, factor: e.target.value })} placeholder="Çarpan (ör: 1000)" type="number" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
          </div>
          <button onClick={handleCreateConv} disabled={!convForm.fromUomId || !convForm.toUomId || !convForm.factor || addConversion.isPending} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
            {addConversion.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Units list */}
        <div className="rounded-2xl border border-border dark:border-border-dark overflow-hidden">
          <div className="bg-surface-secondary dark:bg-surface-dark-secondary px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Birimler</div>
          <div className="divide-y divide-border dark:divide-border-dark">
            {isLoading ? (
              <div className="px-4 py-6 text-center text-gray-400">Yükleniyor...</div>
            ) : (units as any[]).length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400">Henüz birim eklenmemiş</div>
            ) : (units as any[]).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{u.name}</span>
                  <span className="ml-2 text-xs font-mono text-gray-400">{u.code}</span>
                </div>
                <span className="text-xs text-gray-500 rounded-lg bg-surface-secondary dark:bg-surface-dark-tertiary px-2 py-1">{u.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversions list */}
        <div className="rounded-2xl border border-border dark:border-border-dark overflow-hidden">
          <div className="bg-surface-secondary dark:bg-surface-dark-secondary px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Dönüşümler</div>
          <div className="divide-y divide-border dark:divide-border-dark">
            {(conversions as any[]).length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400">Henüz dönüşüm eklenmemiş</div>
            ) : (conversions as any[]).map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                <span className="font-medium text-gray-900 dark:text-white">{c.fromUom?.name || '?'}</span>
                <ArrowRightLeft className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">{c.toUom?.name || '?'}</span>
                <span className="ml-auto text-xs font-mono text-brand-600">x{String(c.factor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dimensions Tab ──────────────────────────────────────────

function DimensionsTab() {
  const { data: dimensions = [], isLoading } = usePimDimensionsQuery()
  const createDim = useCreatePimDimension()
  const addValue = useAddPimDimensionValue()
  const generateVariants = useGeneratePimVariants()
  const [showDimForm, setShowDimForm] = useState(false)
  const [dimForm, setDimForm] = useState({ code: '', name: '' })
  const [newValueForm, setNewValueForm] = useState<Record<string, { code: string; label: string }>>({})
  const [selectedAxes, setSelectedAxes] = useState<Record<string, string[]>>({})
  const [generatedCombinations, setGeneratedCombinations] = useState<Record<string, string>[]>([])

  async function handleCreateDim() {
    await createDim.mutateAsync(dimForm)
    setShowDimForm(false)
    setDimForm({ code: '', name: '' })
  }

  async function handleAddValue(dimensionId: string) {
    const f = newValueForm[dimensionId]
    if (!f?.code || !f?.label) return
    await addValue.mutateAsync({ dimensionId, ...f })
    setNewValueForm({ ...newValueForm, [dimensionId]: { code: '', label: '' } })
  }

  async function handleGenerate() {
    const result = await generateVariants.mutateAsync(selectedAxes)
    setGeneratedCombinations(result as Record<string, string>[])
  }

  function toggleAxisValue(dimCode: string, valLabel: string) {
    const current = selectedAxes[dimCode] || []
    const next = current.includes(valLabel)
      ? current.filter((v) => v !== valLabel)
      : [...current, valLabel]
    setSelectedAxes({ ...selectedAxes, [dimCode]: next })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{(dimensions as any[]).length} boyut tanımlı</p>
        <button onClick={() => setShowDimForm(!showDimForm)} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
          <Plus className="h-4 w-4" /> Yeni Boyut
        </button>
      </div>

      {showDimForm && (
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={dimForm.code} onChange={(e) => setDimForm({ ...dimForm, code: e.target.value })} placeholder="Kod (ör: SIZE)" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
            <input value={dimForm.name} onChange={(e) => setDimForm({ ...dimForm, name: e.target.value })} placeholder="Ad (ör: Boyut)" className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm" />
          </div>
          <button onClick={handleCreateDim} disabled={!dimForm.code || !dimForm.name || createDim.isPending} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
            {createDim.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {/* Dimension cards with values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 text-center text-gray-400 py-8">Yükleniyor...</div>
        ) : (dimensions as any[]).map((dim: any) => (
          <div key={dim.id} className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{dim.name}</h3>
                <p className="text-xs font-mono text-gray-400">{dim.code}</p>
              </div>
              <span className="text-xs text-gray-500">{dim.values?.length || 0} değer</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dim.values?.map((v: any) => {
                const isSelected = (selectedAxes[dim.code] || []).includes(v.label)
                return (
                  <button key={v.id} onClick={() => toggleAxisValue(dim.code, v.label)} className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${isSelected ? 'bg-brand-600 text-white' : 'bg-surface-secondary dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'}`}>
                    {v.label}
                  </button>
                )
              })}
            </div>
            {/* Add value inline */}
            <div className="flex gap-2">
              <input
                value={newValueForm[dim.id]?.code || ''}
                onChange={(e) => setNewValueForm({ ...newValueForm, [dim.id]: { ...newValueForm[dim.id], code: e.target.value, label: newValueForm[dim.id]?.label || '' } })}
                placeholder="Kod"
                className="flex-1 rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-2.5 py-1.5 text-xs"
              />
              <input
                value={newValueForm[dim.id]?.label || ''}
                onChange={(e) => setNewValueForm({ ...newValueForm, [dim.id]: { ...newValueForm[dim.id], label: e.target.value, code: newValueForm[dim.id]?.code || '' } })}
                placeholder="Etiket"
                className="flex-1 rounded-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-2.5 py-1.5 text-xs"
              />
              <button onClick={() => handleAddValue(dim.id)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Variant Generator */}
      {Object.values(selectedAxes).some((v) => v.length > 0) && (
        <div className="rounded-2xl border border-brand-200 dark:border-brand-800/30 bg-brand-50/50 dark:bg-brand-900/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-brand-700 dark:text-brand-300">Varyant Üretici</h3>
            <button onClick={handleGenerate} disabled={generateVariants.isPending} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
              {generateVariants.isPending ? 'Üretiliyor...' : `${Object.values(selectedAxes).reduce((acc, v) => acc * Math.max(v.length, 1), 1)} Varyant Üret`}
            </button>
          </div>
          {generatedCombinations.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary">
              <table className="w-full text-xs">
                <thead className="bg-surface-secondary dark:bg-surface-dark-tertiary sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                    {Object.keys(generatedCombinations[0] || {}).map((k) => (
                      <th key={k} className="px-3 py-2 text-left font-medium text-gray-500">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-border-dark">
                  {generatedCombinations.map((combo, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      {Object.values(combo).map((v, j) => (
                        <td key={j} className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
