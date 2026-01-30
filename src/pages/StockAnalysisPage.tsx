import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Package, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight,
  ArrowDownRight, Search, Filter, Eye, Clock, DollarSign,
  BarChart3, Calendar, Zap, ShoppingCart, Layers,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, AreaChart, Area,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'

type StockTab = 'overview' | 'movements' | 'trends' | 'alerts'

const tabs: { key: StockTab; label: string; icon: typeof Package }[] = [
  { key: 'overview', label: 'Stok Durumu', icon: Package },
  { key: 'movements', label: 'Stok Hareketleri', icon: Layers },
  { key: 'trends', label: 'Satış Trendleri', icon: TrendingUp },
  { key: 'alerts', label: 'Uyarılar', icon: AlertTriangle },
]

interface StockItem {
  id: string
  sku: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  lastEntryDate: string
  lastEntryPrice: number
  lastSaleDate: string
  lastSalePrice: number
  avgSalePrice: number
  totalSold30d: number
  totalSold90d: number
  turnoverRate: number
  warehouse: string
  status: 'ok' | 'low' | 'critical' | 'overstock'
}

const stockItems: StockItem[] = [
  { id: '1', sku: 'HAL-KAY-001', name: 'El Dokuma Halı - Kayseri', category: 'El Dokuma', currentStock: 85, minStock: 30, maxStock: 200, lastEntryDate: '2026-01-15', lastEntryPrice: 1680, lastSaleDate: '2026-01-28', lastSalePrice: 2450, avgSalePrice: 2380, totalSold30d: 42, totalSold90d: 156, turnoverRate: 4.2, warehouse: 'İstanbul Depo', status: 'ok' },
  { id: '2', sku: 'HAL-HER-001', name: 'İpek Halı - Hereke', category: 'İpek', currentStock: 23, minStock: 20, maxStock: 80, lastEntryDate: '2026-01-08', lastEntryPrice: 5800, lastSaleDate: '2026-01-26', lastSalePrice: 8900, avgSalePrice: 8650, totalSold30d: 8, totalSold90d: 28, turnoverRate: 2.8, warehouse: 'İstanbul Depo', status: 'low' },
  { id: '3', sku: 'HAL-MOD-003', name: 'Makine Halısı - Modern', category: 'Makine', currentStock: 420, minStock: 100, maxStock: 500, lastEntryDate: '2026-01-22', lastEntryPrice: 340, lastSaleDate: '2026-01-29', lastSalePrice: 780, avgSalePrice: 750, totalSold30d: 98, totalSold90d: 312, turnoverRate: 6.1, warehouse: 'Gaziantep Depo', status: 'ok' },
  { id: '4', sku: 'KLM-ANT-001', name: 'Kilim - Antik Desen', category: 'Kilim', currentStock: 92, minStock: 40, maxStock: 200, lastEntryDate: '2025-12-20', lastEntryPrice: 890, lastSaleDate: '2026-01-24', lastSalePrice: 1920, avgSalePrice: 1850, totalSold30d: 18, totalSold90d: 62, turnoverRate: 3.5, warehouse: 'İstanbul Depo', status: 'ok' },
  { id: '5', sku: 'HAL-USK-002', name: 'Yün Halı - Uşak', category: 'Yün', currentStock: 56, minStock: 25, maxStock: 120, lastEntryDate: '2026-01-10', lastEntryPrice: 2200, lastSaleDate: '2026-01-27', lastSalePrice: 3480, avgSalePrice: 3320, totalSold30d: 22, totalSold90d: 68, turnoverRate: 3.9, warehouse: 'İstanbul Depo', status: 'ok' },
  { id: '6', sku: 'HAL-PTW-001', name: 'Patchwork Halı', category: 'Patchwork', currentStock: 134, minStock: 50, maxStock: 180, lastEntryDate: '2026-01-18', lastEntryPrice: 680, lastSaleDate: '2026-01-29', lastSalePrice: 1420, avgSalePrice: 1380, totalSold30d: 35, totalSold90d: 118, turnoverRate: 5.2, warehouse: 'Gaziantep Depo', status: 'ok' },
  { id: '7', sku: 'HAL-BMB-001', name: 'Bambu Halı - Doğal', category: 'Bambu', currentStock: 12, minStock: 25, maxStock: 100, lastEntryDate: '2025-11-28', lastEntryPrice: 920, lastSaleDate: '2026-01-25', lastSalePrice: 1500, avgSalePrice: 1450, totalSold30d: 28, totalSold90d: 78, turnoverRate: 5.8, warehouse: 'İstanbul Depo', status: 'critical' },
  { id: '8', sku: 'HAL-AKR-001', name: 'Akrilik Halı - Klasik', category: 'Akrilik', currentStock: 312, minStock: 80, maxStock: 300, lastEntryDate: '2026-01-20', lastEntryPrice: 280, lastSaleDate: '2026-01-28', lastSalePrice: 800, avgSalePrice: 780, totalSold30d: 45, totalSold90d: 142, turnoverRate: 4.5, warehouse: 'Gaziantep Depo', status: 'overstock' },
  { id: '9', sku: 'HAL-VIS-001', name: 'Viskon Halı - Elegant', category: 'Viskon', currentStock: 18, minStock: 20, maxStock: 80, lastEntryDate: '2025-12-15', lastEntryPrice: 1100, lastSaleDate: '2026-01-23', lastSalePrice: 1980, avgSalePrice: 1920, totalSold30d: 15, totalSold90d: 52, turnoverRate: 4.1, warehouse: 'İstanbul Depo', status: 'low' },
]

const stockMovements = [
  { id: 1, date: '2026-01-29', sku: 'HAL-MOD-003', product: 'Makine Halısı - Modern', type: 'OUT' as const, quantity: 25, warehouse: 'Gaziantep Depo', reference: 'ORD-2026-0155', note: 'Pacific Rugs siparişi' },
  { id: 2, date: '2026-01-28', sku: 'HAL-KAY-001', product: 'El Dokuma Halı - Kayseri', type: 'IN' as const, quantity: 40, warehouse: 'İstanbul Depo', reference: 'PO-2026-0078', note: 'Anadolu Dokuma tedarik' },
  { id: 3, date: '2026-01-28', sku: 'HAL-KAY-001', product: 'El Dokuma Halı - Kayseri', type: 'OUT' as const, quantity: 12, warehouse: 'İstanbul Depo', reference: 'ORD-2026-0154', note: 'HomeStyle Inc. siparişi' },
  { id: 4, date: '2026-01-27', sku: 'HAL-USK-002', product: 'Yün Halı - Uşak', type: 'OUT' as const, quantity: 8, warehouse: 'İstanbul Depo', reference: 'ORD-2026-0153', note: 'Luxury Floors NY siparişi' },
  { id: 5, date: '2026-01-26', sku: 'HAL-PTW-001', product: 'Patchwork Halı', type: 'IN' as const, quantity: 50, warehouse: 'Gaziantep Depo', reference: 'PO-2026-0077', note: 'Üretimden giriş' },
  { id: 6, date: '2026-01-25', sku: 'HAL-BMB-001', product: 'Bambu Halı - Doğal', type: 'OUT' as const, quantity: 10, warehouse: 'İstanbul Depo', reference: 'ORD-2026-0152', note: 'Chicago Interiors siparişi' },
  { id: 7, date: '2026-01-24', sku: 'KLM-ANT-001', product: 'Kilim - Antik Desen', type: 'TRANSFER' as const, quantity: 15, warehouse: 'GAP → IST', reference: 'TRF-0034', note: 'Depo transfer' },
  { id: 8, date: '2026-01-24', sku: 'HAL-AKR-001', product: 'Akrilik Halı - Klasik', type: 'IN' as const, quantity: 100, warehouse: 'Gaziantep Depo', reference: 'PO-2026-0076', note: 'Toplu alım' },
]

const trendData = [
  { month: 'Ağu', elDokuma: 28, makine: 72, ipek: 6, kilim: 12, yun: 18, diger: 32 },
  { month: 'Eyl', elDokuma: 35, makine: 85, ipek: 9, kilim: 15, yun: 22, diger: 38 },
  { month: 'Eki', elDokuma: 42, makine: 98, ipek: 12, kilim: 20, yun: 25, diger: 45 },
  { month: 'Kas', elDokuma: 48, makine: 110, ipek: 10, kilim: 22, yun: 28, diger: 50 },
  { month: 'Ara', elDokuma: 55, makine: 120, ipek: 14, kilim: 25, yun: 30, diger: 55 },
  { month: 'Oca', elDokuma: 42, makine: 98, ipek: 8, kilim: 18, yun: 22, diger: 42 },
]

function formatCurrency(val: number): string {
  return '$' + val.toLocaleString('en-US')
}

export default function StockAnalysisPage() {
  const { hasPermission, user } = useAuth()
  const [activeTab, setActiveTab] = useState<StockTab>('overview')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const canViewCost = hasPermission('view_cost_price')
  const canEditStock = hasPermission('edit_stock')

  const filteredStock = useMemo(() => {
    return stockItems.filter((item) => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.sku.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      return true
    })
  }, [search, categoryFilter, statusFilter])

  const totalValue = useMemo(() =>
    stockItems.reduce((s, i) => s + i.currentStock * i.lastEntryPrice, 0), []
  )
  const criticalCount = stockItems.filter(i => i.status === 'critical').length
  const lowCount = stockItems.filter(i => i.status === 'low').length
  const avgTurnover = (stockItems.reduce((s, i) => s + i.turnoverRate, 0) / stockItems.length).toFixed(1)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Stok & Ürün Analizi</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Detaylı stok takibi, trendler ve uyarılar</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Toplam Stok Değeri</span>
            <DollarSign className="h-4 w-4 text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {canViewCost ? formatCurrency(totalValue) : '***'}
          </p>
          <p className="text-xs text-gray-400 mt-1">{stockItems.reduce((s, i) => s + i.currentStock, 0)} adet toplam</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Stok Devir Hızı</span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgTurnover}x</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> Yıllık ortalama
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Kritik Stok</span>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          <p className="text-xs text-orange-500 mt-1">{lowCount} düşük stoklu ürün</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">30 Gün Satış</span>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stockItems.reduce((s, i) => s + i.totalSold30d, 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">adet satıldı</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-secondary dark:bg-surface-dark-secondary rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-surface-dark text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ürün adı veya SKU ara..."
                className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-10 pr-4 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="El Dokuma">El Dokuma</option>
              <option value="İpek">İpek</option>
              <option value="Makine">Makine</option>
              <option value="Kilim">Kilim</option>
              <option value="Yün">Yün</option>
              <option value="Patchwork">Patchwork</option>
              <option value="Bambu">Bambu</option>
              <option value="Akrilik">Akrilik</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="ok">Normal</option>
              <option value="low">Düşük</option>
              <option value="critical">Kritik</option>
              <option value="overstock">Fazla Stok</option>
            </select>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">SKU</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Ürün</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Kategori</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Stok</th>
                    {canViewCost && <th className="text-right px-4 py-3 font-medium text-gray-500">Son Giriş Fiyatı</th>}
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Son Satış Fiyatı</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Ort. Satış</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Son Giriş</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Son Satış</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">30g Satış</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Devir</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary/30 dark:hover:bg-surface-dark-secondary/30">
                      <td className="px-4 py-3 font-mono text-xs text-brand-600">{item.sku}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{item.category}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {item.currentStock}
                        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 mt-1">
                          <div
                            className={`h-full rounded-full ${
                              item.status === 'critical' ? 'bg-red-500' :
                              item.status === 'low' ? 'bg-yellow-500' :
                              item.status === 'overstock' ? 'bg-purple-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (item.currentStock / item.maxStock) * 100)}%` }}
                          />
                        </div>
                      </td>
                      {canViewCost && (
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(item.lastEntryPrice)}</td>
                      )}
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">{formatCurrency(item.lastSalePrice)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(item.avgSalePrice)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{item.lastEntryDate}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{item.lastSaleDate}</td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{item.totalSold30d}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${item.turnoverRate > 5 ? 'text-green-600' : item.turnoverRate > 3 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {item.turnoverRate}x
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === 'ok' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                          item.status === 'low' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          item.status === 'critical' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}>
                          {item.status === 'ok' ? 'Normal' : item.status === 'low' ? 'Düşük' : item.status === 'critical' ? 'Kritik' : 'Fazla'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tarih</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Ürün</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Tip</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Miktar</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Depo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Referans</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {stockMovements.map((mv) => (
                <tr key={mv.id} className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary/30">
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{mv.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-600">{mv.sku}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{mv.product}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      mv.type === 'IN' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      mv.type === 'OUT' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                      'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {mv.type === 'IN' ? 'Giriş' : mv.type === 'OUT' ? 'Çıkış' : 'Transfer'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${mv.type === 'IN' ? 'text-green-600' : mv.type === 'OUT' ? 'text-red-600' : 'text-blue-600'}`}>
                    {mv.type === 'IN' ? '+' : mv.type === 'OUT' ? '-' : ''}{mv.quantity}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{mv.warehouse}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{mv.reference}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{mv.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Kategori Bazlı Satış Trendleri (Son 6 Ay)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="makine" name="Makine" stackId="1" stroke="#4c6ef5" fill="#4c6ef5" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="elDokuma" name="El Dokuma" stackId="1" stroke="#40c057" fill="#40c057" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="diger" name="Diğer" stackId="1" stroke="#fab005" fill="#fab005" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="yun" name="Yün" stackId="1" stroke="#e64980" fill="#e64980" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="kilim" name="Kilim" stackId="1" stroke="#7950f2" fill="#7950f2" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="ipek" name="İpek" stackId="1" stroke="#15aabf" fill="#15aabf" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Stok Devir Hızı Karşılaştırması</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockItems.map(i => ({ name: i.name.split(' - ')[0], turnover: i.turnoverRate }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="turnover" name="Devir Hızı" fill="#4c6ef5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {stockItems.filter(i => i.status === 'critical').map((item) => (
            <div key={item.id} className="card p-4 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">SKU: {item.sku} | Depo: {item.warehouse}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{item.currentStock} adet</p>
                  <p className="text-xs text-gray-500">Min: {item.minStock} | 30g satış: {item.totalSold30d}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-red-600 font-medium">
                Mevcut stok, son 30 günlük satış hızına göre yaklaşık {Math.ceil(item.currentStock / (item.totalSold30d / 30))} gün yeterli!
              </p>
            </div>
          ))}

          {stockItems.filter(i => i.status === 'low').map((item) => (
            <div key={item.id} className="card p-4 border-l-4 border-l-yellow-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">SKU: {item.sku} | Depo: {item.warehouse}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-600">{item.currentStock} adet</p>
                  <p className="text-xs text-gray-500">Min: {item.minStock}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-yellow-600 font-medium">
                Stok seviyesi minimum seviyeye yaklaşıyor. Yeniden sipariş önerilir.
              </p>
            </div>
          ))}

          {stockItems.filter(i => i.status === 'overstock').map((item) => (
            <div key={item.id} className="card p-4 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">SKU: {item.sku} | Depo: {item.warehouse}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">{item.currentStock} adet</p>
                  <p className="text-xs text-gray-500">Max: {item.maxStock}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-purple-600 font-medium">
                Stok maksimum seviyeyi aşmış durumda. Kampanya veya indirim düşünülebilir.
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
