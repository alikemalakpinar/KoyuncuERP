/**
 * Product Detail Page — The "Masterpiece"
 *
 * Header, Gallery, Tabs (General, Variants, History, Costs)
 */

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Package,
  Tag,
  Edit3,
  Printer,
  Box,
  History,
  DollarSign,
  Layers,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts'
import { useProductQuery } from '../hooks/useIpc'

const tabs = [
  { id: 'general', label: 'Genel', icon: Package },
  { id: 'variants', label: 'Varyantlar', icon: Layers },
  { id: 'history', label: 'Hareket Geçmişi', icon: History },
  { id: 'costs', label: 'Maliyet Analizi', icon: DollarSign },
] as const

type TabId = (typeof tabs)[number]['id']

const materialLabels: Record<string, string> = {
  WOOL: 'Yün', ACRYLIC: 'Akrilik', POLYESTER: 'Polyester', COTTON: 'Pamuk',
  SILK: 'İpek', VISCOSE: 'Viskon', BAMBOO: 'Bambu', BLEND: 'Karışım', OTHER: 'Diğer',
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading } = useProductQuery(id || null)
  const [activeTab, setActiveTab] = useState<TabId>('general')

  const totalStock = useMemo(() => {
    if (!product?.variants) return 0
    return product.variants.reduce((sum: number, v: any) =>
      sum + (v.stocks || []).reduce((s: number, st: any) => s + (st.quantity || 0), 0), 0)
  }, [product])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <Package className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm">Ürün bulunamadı</p>
        <button
          onClick={() => navigate('/inventory')}
          className="mt-4 text-[13px] text-brand-600 hover:underline"
        >
          Kataloğa dön
        </button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Back + Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/inventory')}
          className="mb-4 flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kataloğa Dön
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/30 shadow-soft">
              <Package className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {product.name}
                </h1>
                <span className="rounded-full bg-brand-100 dark:bg-brand-900/30 px-3 py-0.5 text-[12px] font-semibold text-brand-700 dark:text-brand-300">
                  {totalStock} adet stok
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-[13px] text-gray-500">
                <span className="font-mono">{product.code}</span>
                <span>·</span>
                <span>{product.collection}</span>
                <span>·</span>
                <span>{materialLabels[product.material] || product.material}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
              <Printer className="h-4 w-4" />
              Etiket Yazdır
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors">
              <Edit3 className="h-4 w-4" />
              Düzenle
            </button>
          </div>
        </div>
      </div>

      {/* Gallery placeholder */}
      {product.images?.length > 0 ? (
        <div className="mb-6 grid grid-cols-4 gap-3">
          {product.images.map((img: string, i: number) => (
            <div key={i} className="aspect-square rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary overflow-hidden">
              <img src={img} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 card flex items-center justify-center py-12 text-gray-400">
          <div className="text-center">
            <Package className="mx-auto h-8 w-8 mb-2 opacity-30" />
            <p className="text-[12px]">Ürün görseli eklenmemiş</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border dark:border-border-dark">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="product-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'general' && <GeneralTab product={product} />}
      {activeTab === 'variants' && <VariantsTab product={product} />}
      {activeTab === 'history' && <HistoryTab product={product} />}
      {activeTab === 'costs' && <CostsTab product={product} />}
    </motion.div>
  )
}

function GeneralTab({ product }: { product: any }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="card p-5 space-y-4">
        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          Ürün Bilgileri
        </h3>
        <div className="space-y-3">
          {[
            ['Kod', product.code],
            ['İsim', product.name],
            ['Koleksiyon', product.collection || '—'],
            ['Malzeme', materialLabels[product.material] || product.material],
            ['Varyant Sayısı', `${product.variants?.length || 0} adet`],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1 border-b border-border/30 dark:border-border-dark/30 last:border-0">
              <span className="text-[12px] text-gray-500 dark:text-gray-400">{label}</span>
              <span className="text-[13px] font-medium text-gray-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          Fiyat Aralığı
        </h3>
        {product.variants?.length > 0 ? (
          <div className="space-y-3">
            {(() => {
              const prices = product.variants.map((v: any) => parseFloat(v.listPrice || '0'))
              const costs = product.variants.map((v: any) => parseFloat(v.baseCost || '0'))
              const minP = Math.min(...prices)
              const maxP = Math.max(...prices)
              const minC = Math.min(...costs)
              const maxC = Math.max(...costs)
              return (
                <>
                  <div className="flex items-center justify-between py-1 border-b border-border/30 dark:border-border-dark/30">
                    <span className="text-[12px] text-gray-500">Satış Fiyatı</span>
                    <span className="text-[13px] font-semibold text-brand-600 dark:text-brand-400 tabular-nums">
                      ${minP.toFixed(2)} – ${maxP.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/30 dark:border-border-dark/30">
                    <span className="text-[12px] text-gray-500">Maliyet</span>
                    <span className="text-[13px] font-medium text-gray-900 dark:text-white tabular-nums">
                      ${minC.toFixed(2)} – ${maxC.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[12px] text-gray-500">Ort. Marj</span>
                    <span className="text-[13px] font-semibold text-green-600 dark:text-green-400">
                      %{(((maxP + minP) / 2 - (maxC + minC) / 2) / ((maxP + minP) / 2) * 100).toFixed(1)}
                    </span>
                  </div>
                </>
              )
            })()}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Varyant yok</p>
        )}
      </div>

      {product.description && (
        <div className="card p-5 col-span-2">
          <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
            Açıklama
          </h3>
          <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>
        </div>
      )}
    </div>
  )
}

function VariantsTab({ product }: { product: any }) {
  const variants = product.variants || []

  return (
    <div className="card overflow-hidden">
      {variants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Layers className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">Henüz varyant eklenmemiş</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Boyut</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Renk</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">m2</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Liste Fiyat</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Maliyet</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Marj</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">TR Stok</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">USA Stok</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v: any) => {
                const trStock = (v.stocks || []).find((s: any) => s.warehouse?.code === 'TR_MAIN')?.quantity || 0
                const usaStock = (v.stocks || []).find((s: any) => s.warehouse?.code === 'USA_NJ')?.quantity || 0
                const total = trStock + usaStock
                const list = parseFloat(v.listPrice || '0')
                const cost = parseFloat(v.baseCost || '0')
                const margin = list > 0 ? ((list - cost) / list * 100).toFixed(1) : '0.0'

                return (
                  <tr
                    key={v.id}
                    className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-gray-600 dark:text-gray-400">{v.sku}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{v.size}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{v.color || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                      {parseFloat(String(v.areaM2)).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-brand-600 dark:text-brand-400">
                      ${list.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                      ${cost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-green-600 dark:text-green-400">
                      %{margin}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">{trStock}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">{usaStock}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900 dark:text-white">
                      <span className={total < 10 ? 'text-amber-600 dark:text-amber-400' : ''}>{total}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function HistoryTab({ product }: { product: any }) {
  const movements = product.stockMovements || []

  if (movements.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
        <History className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">Henüz hareket kaydı yok</p>
        <p className="mt-1 text-[12px]">Sipariş ve sevkiyat hareketleri burada görünecek</p>
      </div>
    )
  }

  const typeLabels: Record<string, string> = {
    IN: 'Giriş', OUT: 'Çıkış', RESERVE: 'Rezerve', UNRESERVE: 'Rezerve İptal',
    TRANSFER: 'Transfer', ADJUSTMENT: 'Düzeltme',
  }
  const typeColors: Record<string, string> = {
    IN: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    OUT: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    RESERVE: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    UNRESERVE: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    TRANSFER: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    ADJUSTMENT: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20',
  }

  return (
    <div className="space-y-2">
      {movements.map((m: any) => (
        <div key={m.id} className="card flex items-center gap-4 px-4 py-3">
          <div className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${typeColors[m.type] || ''}`}>
            {typeLabels[m.type] || m.type}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-gray-900 dark:text-white">
              {m.variant?.sku || '—'} · {m.description || 'Hareket'}
            </p>
            <p className="text-[11px] text-gray-500">
              {m.warehouse?.name || '—'} · {new Date(m.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
          <span className={`text-[14px] font-semibold tabular-nums ${
            m.type === 'IN' || m.type === 'UNRESERVE' ? 'text-green-600' : 'text-red-600'
          }`}>
            {m.type === 'IN' || m.type === 'UNRESERVE' ? '+' : '-'}{Math.abs(m.quantity)}
          </span>
        </div>
      ))}
    </div>
  )
}

function CostsTab({ product }: { product: any }) {
  const variants = product.variants || []

  // Build chart data from variants (purchase price / cost over time simulation)
  const chartData = useMemo(() => {
    if (variants.length === 0) return []
    // Show cost breakdown per variant as bar chart
    return variants.map((v: any) => ({
      name: v.size,
      maliyet: parseFloat(v.baseCost || '0'),
      fiyat: parseFloat(v.listPrice || '0'),
      kar: parseFloat(v.listPrice || '0') - parseFloat(v.baseCost || '0'),
    }))
  }, [variants])

  // Demo cost history (would come from actual purchase orders in production)
  const costHistory = useMemo(() => {
    const base = parseFloat(variants[0]?.baseCost || '50')
    return [
      { month: 'Oca', cost: base * 0.88 },
      { month: 'Şub', cost: base * 0.90 },
      { month: 'Mar', cost: base * 0.92 },
      { month: 'Nis', cost: base * 0.95 },
      { month: 'May', cost: base * 0.93 },
      { month: 'Haz', cost: base * 0.97 },
      { month: 'Tem', cost: base * 0.99 },
      { month: 'Ağu', cost: base * 1.0 },
      { month: 'Eyl', cost: base * 0.98 },
      { month: 'Eki', cost: base * 1.02 },
      { month: 'Kas', cost: base * 1.0 },
      { month: 'Ara', cost: base },
    ]
  }, [variants])

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Cost vs Price bar chart */}
      <div className="card p-5">
        <p className="mb-4 text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Maliyet vs Satış Fiyatı (Varyant Bazında)
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#868e96' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#868e96' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e9ecef', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}`,
                  name === 'maliyet' ? 'Maliyet' : name === 'fiyat' ? 'Satış Fiyatı' : 'Kâr',
                ]}
              />
              <Bar dataKey="maliyet" fill="#fa5252" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Bar dataKey="fiyat" fill="#4c6ef5" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Bar dataKey="kar" fill="#40c057" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost trend line chart */}
      <div className="card p-5">
        <p className="mb-4 text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Alış Fiyatı Değişimi (12 Ay)
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={costHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#868e96' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#868e96' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e9ecef', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Birim Maliyet']}
              />
              <Line type="monotone" dataKey="cost" stroke="#4c6ef5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary stats */}
      <div className="card p-5 col-span-2">
        <p className="mb-4 text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Stok Değeri Özeti
        </p>
        <div className="grid grid-cols-4 gap-4">
          {(() => {
            let totalCostValue = 0
            let totalSaleValue = 0
            let totalUnits = 0

            variants.forEach((v: any) => {
              const qty = (v.stocks || []).reduce((s: number, st: any) => s + (st.quantity || 0), 0)
              totalUnits += qty
              totalCostValue += qty * parseFloat(v.baseCost || '0')
              totalSaleValue += qty * parseFloat(v.listPrice || '0')
            })

            const potentialProfit = totalSaleValue - totalCostValue

            return [
              { label: 'Toplam Stok', value: `${totalUnits} adet`, icon: Box },
              { label: 'Maliyet Değeri', value: `$${totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign },
              { label: 'Satış Değeri', value: `$${totalSaleValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: Tag },
              { label: 'Potansiyel Kâr', value: `$${potentialProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary px-4 py-3">
                <Icon className="h-5 w-5 text-brand-500" />
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white tabular-nums">{value}</p>
                </div>
              </div>
            ))
          })()}
        </div>
      </div>
    </div>
  )
}
