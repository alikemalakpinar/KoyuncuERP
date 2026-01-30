/**
 * Inventory Page — Product catalog with TanStack Table
 */

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  Package,
  Search,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Box,
} from 'lucide-react'
import { useProductsQuery } from '../hooks/useIpc'

const materialLabels: Record<string, string> = {
  WOOL: 'Yün',
  ACRYLIC: 'Akrilik',
  POLYESTER: 'Polyester',
  COTTON: 'Pamuk',
  SILK: 'İpek',
  VISCOSE: 'Viskon',
  BAMBOO: 'Bambu',
  BLEND: 'Karışım',
  OTHER: 'Diğer',
}

const columnHelper = createColumnHelper<any>()

export default function InventoryPage() {
  const navigate = useNavigate()
  const { data: products = [], isLoading } = useProductsQuery()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [materialFilter, setMaterialFilter] = useState<string>('')

  // Alt+N shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'n') {
        e.preventDefault()
        navigate('/inventory/new')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  // Flatten product data for table
  const tableData = useMemo(() => {
    let data = products
    if (materialFilter) {
      data = data.filter((p: any) => p.material === materialFilter)
    }
    return data.map((p: any) => {
      const totalStock = (p.variants || []).reduce((sum: number, v: any) => {
        return sum + (v.stocks || []).reduce((s: number, st: any) => s + (st.quantity || 0), 0)
      }, 0)
      const trStock = (p.variants || []).reduce((sum: number, v: any) => {
        const s = (v.stocks || []).find((st: any) => st.warehouse?.code === 'TR_MAIN')
        return sum + (s?.quantity || 0)
      }, 0)
      const usaStock = (p.variants || []).reduce((sum: number, v: any) => {
        const s = (v.stocks || []).find((st: any) => st.warehouse?.code === 'USA_NJ')
        return sum + (s?.quantity || 0)
      }, 0)
      const variantCount = (p.variants || []).length
      const avgPrice =
        variantCount > 0
          ? (
              (p.variants || []).reduce((sum: number, v: any) => sum + parseFloat(v.listPrice || '0'), 0) /
              variantCount
            ).toFixed(2)
          : '0.00'

      return { ...p, totalStock, trStock, usaStock, variantCount, avgPrice }
    })
  }, [products, materialFilter])

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'thumbnail',
        header: '',
        size: 48,
        cell: ({ row }) => (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/30">
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
          <span className="inline-flex rounded-full bg-surface-secondary dark:bg-surface-dark-tertiary px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-400">
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
            <span
              className={`tabular-nums font-semibold ${
                v < 20 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'
              }`}
            >
              {v}
            </span>
          )
        },
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
    ],
    [],
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

  const materials = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p: any) => set.add(p.material))
    return Array.from(set).sort()
  }, [products])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Ürün Kataloğu</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {tableData.length} ürün · Toplam stok:{' '}
            {tableData.reduce((s: number, p: any) => s + p.totalStock, 0).toLocaleString()} adet
          </p>
        </div>
        <button
          onClick={() => navigate('/inventory/new')}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Yeni Ürün
          <kbd className="ml-1 rounded border border-white/20 px-1 py-0.5 text-[10px] opacity-60">
            Alt+N
          </kbd>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Ürün adı veya kodu ile ara..."
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-9 pr-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setMaterialFilter('')}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
              !materialFilter
                ? 'bg-brand-600 text-white'
                : 'bg-surface-secondary dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Tümü
          </button>
          {materials.map((m) => (
            <button
              key={m}
              onClick={() => setMaterialFilter(materialFilter === m ? '' : m)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                materialFilter === m
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-secondary dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {materialLabels[m] || m}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
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
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : header.column.getCanSort() ? (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            ) : null}
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
      </div>
    </motion.div>
  )
}
