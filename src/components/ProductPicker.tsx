/**
 * Product Picker — Search by SKU/Name, see stock, select variant.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, X, AlertTriangle } from 'lucide-react'
import { useProductsQuery } from '../hooks/useIpc'

interface SelectedItem {
  variantId: string
  productName: string
  sku: string
  size: string
  unitPrice: string
  baseCost: string
  unit: string
  stockTR: number
  stockUSA: number
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (item: SelectedItem) => void
}

export default function ProductPicker({ open, onClose, onSelect }: Props) {
  const { data: products = [] } = useProductsQuery()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return products
    const q = query.toLowerCase()
    return products.filter(
      (p: any) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.variants?.some((v: any) => v.sku.toLowerCase().includes(q)),
    )
  }, [products, query])

  const handleSelect = (product: any, variant: any) => {
    const trStock = variant.stocks?.find((s: any) => s.warehouse.code === 'TR_MAIN')
    const usaStock = variant.stocks?.find((s: any) => s.warehouse.code === 'USA_NJ')
    onSelect({
      variantId: variant.id,
      productName: `${product.name} ${variant.color || ''} ${variant.size}`.trim(),
      sku: variant.sku,
      size: variant.size,
      unitPrice: String(variant.listPrice),
      baseCost: String(variant.baseCost),
      unit: 'm2',
      stockTR: trStock?.quantity || 0,
      stockUSA: usaStock?.quantity || 0,
    })
    setQuery('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-[10%] z-[60] w-full max-w-2xl -translate-x-1/2 rounded-2xl bg-white dark:bg-surface-dark-secondary shadow-glass border border-border dark:border-border-dark overflow-hidden"
          >
            {/* Search header */}
            <div className="flex items-center gap-3 border-b border-border dark:border-border-dark px-4 py-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ürün adı veya SKU ile ara..."
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
              />
              <button onClick={onClose} className="rounded-lg p-1 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Package className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">Ürün bulunamadı</p>
                </div>
              )}
              {filtered.map((product: any) => (
                <div key={product.id} className="border-b border-border/50 dark:border-border-dark/50 last:border-0">
                  {/* Product header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
                      <Package className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {product.code} · {product.collection} · {product.material}
                      </p>
                    </div>
                  </div>

                  {/* Variants */}
                  <div className="divide-y divide-border/30 dark:divide-border-dark/30">
                    {product.variants?.map((variant: any) => {
                      const trStock = variant.stocks?.find((s: any) => s.warehouse?.code === 'TR_MAIN')
                      const usaStock = variant.stocks?.find((s: any) => s.warehouse?.code === 'USA_NJ')
                      const trQty = trStock?.quantity ?? 0
                      const usaQty = usaStock?.quantity ?? 0
                      const totalStock = trQty + usaQty
                      const lowStock = totalStock < 10

                      return (
                        <button
                          key={variant.id}
                          onClick={() => handleSelect(product, variant)}
                          className="flex w-full items-center gap-4 px-4 py-2.5 text-left hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-mono text-gray-500">{variant.sku}</span>
                              {variant.color && (
                                <span className="text-[11px] text-gray-400">{variant.color}</span>
                              )}
                            </div>
                            <p className="text-[13px] text-gray-700 dark:text-gray-300">{variant.size}</p>
                          </div>

                          {/* Stock */}
                          <div className="flex items-center gap-3 text-[11px] tabular-nums">
                            <span className="text-gray-500">TR: <span className="font-medium text-gray-700 dark:text-gray-300">{trQty}</span></span>
                            <span className="text-gray-500">US: <span className="font-medium text-gray-700 dark:text-gray-300">{usaQty}</span></span>
                            {lowStock && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-[13px] font-semibold text-gray-900 dark:text-white tabular-nums">
                              ${variant.listPrice}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Maliyet: ${variant.baseCost}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
