/**
 * Inventory Page — Product catalog with KPI cards, grid/list view, collection & material filters
 */

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import {
  Package, Search, Plus, ArrowUpDown, ArrowUp, ArrowDown,
  Box, LayoutGrid, List, AlertTriangle, DollarSign, Layers,
  TrendingUp, Eye, Star, Filter, Tag,
} from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer } from 'recharts'
import { useProductsQuery } from '../hooks/useIpc'

const materialLabels: Record<string, string> = {
  WOOL: 'Yün', ACRYLIC: 'Akrilik', POLYESTER: 'Polyester', COTTON: 'Pamuk',
  SILK: 'İpek', VISCOSE: 'Viskon', BAMBOO: 'Bambu', BLEND: 'Karışım', OTHER: 'Diğer',
}

const materialColors: Record<string, string> = {
  WOOL: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  ACRYLIC: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  POLYESTER: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  COTTON: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  SILK: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  VISCOSE: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',
  BAMBOO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  BLEND: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
  OTHER: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const columnHelper = createColumnHelper<any>()

export default function InventoryPage() {
  const navigate = useNavigate()
  const { data: products = [], isLoading } = useProductsQuery()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [materialFilter, setMaterialFilter] = useState<string>('')
  const [collectionFilter, setCollectionFilter] = useState<string>('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Alt+N shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'n') { e.preventDefault(); navigate('/inventory/new') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  // Flatten product data
  const tableData = useMemo(() => {
    let data = products
    if (materialFilter) data = data.filter((p: any) => p.material === materialFilter)
    if (collectionFilter) data = data.filter((p: any) => p.collection === collectionFilter)
    return data.map((p: any) => {
      const totalStock = (p.variants || []).reduce((sum: number, v: any) =>
        sum + (v.stocks || []).reduce((s: number, st: any) => s + (st.quantity || 0), 0), 0)
      const trStock = (p.variants || []).reduce((sum: number, v: any) => {
        const s = (v.stocks || []).find((st: any) => st.warehouse?.code === 'TR_MAIN')
        return sum + (s?.quantity || 0)
      }, 0)
      const usaStock = (p.variants || []).reduce((sum: number, v: any) => {
        const s = (v.stocks || []).find((st: any) => st.warehouse?.code === 'USA_NJ')
        return sum + (s?.quantity || 0)
      }, 0)
      const variantCount = (p.variants || []).length
      const prices = (p.variants || []).map((v: any) => parseFloat(v.listPrice || '0'))
      const costs = (p.variants || []).map((v: any) => parseFloat(v.baseCost || '0'))
      const avgPrice = variantCount > 0 ? (prices.reduce((a: number, b: number) => a + b, 0) / variantCount).toFixed(2) : '0.00'
      const avgCost = variantCount > 0 ? (costs.reduce((a: number, b: number) => a + b, 0) / variantCount).toFixed(2) : '0.00'
      const avgMargin = parseFloat(avgPrice) > 0 ? ((parseFloat(avgPrice) - parseFloat(avgCost)) / parseFloat(avgPrice) * 100).toFixed(1) : '0.0'
      const stockValue = (p.variants || []).reduce((sum: number, v: any) => {
        const qty = (v.stocks || []).reduce((s: number, st: any) => s + (st.quantity || 0), 0)
        return sum + qty * parseFloat(v.listPrice || '0')
      }, 0)
      return { ...p, totalStock, trStock, usaStock, variantCount, avgPrice, avgCost, avgMargin, stockValue }
    })
  }, [products, materialFilter, collectionFilter])

  // KPI calculations
  const kpis = useMemo(() => {
    const totalProducts = tableData.length
    const totalVariants = tableData.reduce((s: number, p: any) => s + p.variantCount, 0)
    const totalStock = tableData.reduce((s: number, p: any) => s + p.totalStock, 0)
    const totalValue = tableData.reduce((s: number, p: any) => s + p.stockValue, 0)
    const lowStockCount = tableData.filter((p: any) => p.totalStock < 20).length
    return { totalProducts, totalVariants, totalStock, totalValue, lowStockCount }
  }, [tableData])

  // Mini chart data per product (stock distribution)
  const stockChartData = useMemo(() => {
    return tableData.map((p: any) => ({ name: p.code, tr: p.trStock, usa: p.usaStock }))
  }, [tableData])

  const materials = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p: any) => set.add(p.material))
    return Array.from(set).sort()
  }, [products])

  const collections = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p: any) => { if (p.collection) set.add(p.collection) })
    return Array.from(set).sort()
  }, [products])

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'thumbnail',
        header: '',
        size: 48,
        cell: ({ row }) => (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
            row.original.material === 'SILK' ? 'from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30' :
            row.original.material === 'WOOL' ? 'from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/30' :
            'from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/30'
          }`}>
            <Package className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
        ),
      }),
      columnHelper.accessor('code', {
        header: 'Kod',
        size: 100,
        cell: (info) => (
          <span className="font-mono text-[12px] text-gray-500 dark:text-gray-400">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Ürün Adı',
        size: 200,
        cell: (info) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{info.getValue()}</p>
            <p className="text-[11px] text-gray-500">{info.row.original.collection}</p>
          </div>
        ),
      }),
      columnHelper.accessor('material', {
        header: 'Malzeme',
        size: 100,
        cell: (info) => (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${materialColors[info.getValue()] || 'bg-gray-100 text-gray-600'}`}>
            {materialLabels[info.getValue()] || info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('variantCount', {
        header: 'Varyant',
        size: 80,
        cell: (info) => (
          <span className="text-gray-600 dark:text-gray-400">{info.getValue()} boy</span>
        ),
      }),
      columnHelper.accessor('trStock', {
        header: 'TR Stok',
        size: 80,
        cell: (info) => (
          <span className="tabular-nums font-medium text-gray-900 dark:text-white">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('usaStock', {
        header: 'USA Stok',
        size: 80,
        cell: (info) => (
          <span className="tabular-nums font-medium text-gray-900 dark:text-white">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('totalStock', {
        header: 'Toplam',
        size: 80,
        cell: (info) => {
          const v = info.getValue()
          return (
            <div className="flex items-center gap-1.5">
              <span className={`tabular-nums font-semibold ${v < 20 ? 'text-red-600 dark:text-red-400' : v < 50 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                {v}
              </span>
              {v < 20 && <AlertTriangle className="h-3 w-3 text-red-500" />}
            </div>
          )
        },
      }),
      columnHelper.accessor('avgMargin', {
        header: 'Marj',
        size: 70,
        cell: (info) => (
          <span className="tabular-nums font-medium text-green-600 dark:text-green-400">%{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('avgPrice', {
        header: 'Ort. Fiyat',
        size: 100,
        cell: (info) => (
          <span className="tabular-nums font-medium text-gray-900 dark:text-white">
            ${parseFloat(info.getValue()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        size: 40,
        cell: ({ row }) => (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/inventory/${row.original.id}`) }}
            className="rounded-lg p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      }),
    ],
    [navigate],
  )

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Ürün Kataloğu</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {tableData.length} ürün · {kpis.totalVariants} varyant · Toplam {kpis.totalStock.toLocaleString()} adet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border dark:border-border-dark p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={() => navigate('/inventory/new')}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Yeni Ürün
            <kbd className="ml-1 rounded border border-white/20 px-1 py-0.5 text-[10px] opacity-60">Alt+N</kbd>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Toplam Ürün', value: kpis.totalProducts, icon: Package, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
          { label: 'Toplam Varyant', value: kpis.totalVariants, icon: Layers, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Toplam Stok', value: kpis.totalStock.toLocaleString(), icon: Box, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20' },
          { label: 'Stok Değeri', value: `$${(kpis.totalValue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          { label: 'Düşük Stok', value: kpis.lowStockCount, icon: AlertTriangle, color: kpis.lowStockCount > 0 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-600 bg-gray-50 dark:bg-gray-800' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${kpi.color}`}>
                <kpi.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">{kpi.label}</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Ürün adı veya kodu ile ara..."
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-9 pr-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>

        {/* Material filter */}
        <div className="flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-gray-400" />
          <button
            onClick={() => setMaterialFilter('')}
            className={`rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
              !materialFilter ? 'bg-brand-600 text-white' : 'bg-surface-secondary dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Tümü
          </button>
          {materials.map((m) => (
            <button
              key={m}
              onClick={() => setMaterialFilter(materialFilter === m ? '' : m)}
              className={`rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                materialFilter === m ? 'bg-brand-600 text-white' : 'bg-surface-secondary dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {materialLabels[m] || m}
            </button>
          ))}
        </div>

        {/* Collection filter */}
        {collections.length > 1 && (
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-2.5 py-1.5 text-[12px] text-gray-700 dark:text-gray-300 outline-none"
            >
              <option value="">Tüm Koleksiyonlar</option>
              {collections.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              </div>
            ) : tableData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Box className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm font-medium">Henüz ürün eklenmemiş</p>
                <p className="mt-1 text-[12px]">Yeni ürün ekleyerek kataloğunuzu oluşturun</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-border dark:border-border-dark">
                        {hg.headers.map((header) => (
                          <th key={header.id} className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400" style={{ width: header.getSize() }}>
                            {header.isPlaceholder ? null : (
                              <button className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={header.column.getToggleSortingHandler()}>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getIsSorted() === 'asc' ? <ArrowUp className="h-3 w-3" /> :
                                 header.column.getIsSorted() === 'desc' ? <ArrowDown className="h-3 w-3" /> :
                                 header.column.getCanSort() ? <ArrowUpDown className="h-3 w-3 opacity-30" /> : null}
                              </button>
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => navigate(`/inventory/${row.original.id}`)}
                        className="border-b border-border/50 dark:border-border-dark/50 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-colors cursor-pointer"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tableData.map((product: any) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/inventory/${product.id}`)}
                className="card cursor-pointer overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Product image / placeholder */}
                <div className={`h-36 flex items-center justify-center bg-gradient-to-br ${
                  product.material === 'SILK' ? 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10' :
                  product.material === 'WOOL' ? 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10' :
                  product.material === 'COTTON' ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10' :
                  'from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/10'
                } relative`}>
                  <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 group-hover:scale-110 transition-transform" />
                  <span className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${materialColors[product.material] || ''}`}>
                    {materialLabels[product.material]}
                  </span>
                  {product.totalStock < 20 && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                      <AlertTriangle className="h-3 w-3" /> Düşük Stok
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{product.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{product.collection} · <span className="font-mono">{product.code}</span></p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="text-center rounded-lg bg-surface-secondary dark:bg-surface-dark-tertiary py-1.5">
                      <p className="text-[10px] text-gray-400">Stok</p>
                      <p className={`text-sm font-bold ${product.totalStock < 20 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{product.totalStock}</p>
                    </div>
                    <div className="text-center rounded-lg bg-surface-secondary dark:bg-surface-dark-tertiary py-1.5">
                      <p className="text-[10px] text-gray-400">Varyant</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{product.variantCount}</p>
                    </div>
                    <div className="text-center rounded-lg bg-surface-secondary dark:bg-surface-dark-tertiary py-1.5">
                      <p className="text-[10px] text-gray-400">Marj</p>
                      <p className="text-sm font-bold text-green-600">%{product.avgMargin}</p>
                    </div>
                  </div>

                  {/* Price range */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">Ort. Fiyat</span>
                    <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 tabular-nums">
                      ${parseFloat(product.avgPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Stock bar (TR vs USA) */}
                  {product.totalStock > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                        <span>TR: {product.trStock}</span>
                        <span>USA: {product.usaStock}</span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <div className="bg-brand-500 rounded-l-full" style={{ width: `${(product.trStock / product.totalStock) * 100}%` }} />
                        <div className="bg-cyan-500 rounded-r-full" style={{ width: `${(product.usaStock / product.totalStock) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
