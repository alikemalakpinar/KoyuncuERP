/**
 * Consignment Page - Konsinye / Mal Takibi
 * Müşterilere gönderilen malların takibi
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Plus, Search, Building2, Calendar, Clock,
  CheckCircle, XCircle, ArrowRight, Eye, Edit, Trash2,
  DollarSign, TrendingUp, AlertTriangle, Send, RotateCcw,
  ChevronRight, Filter, MoreVertical, Truck, MapPin,
  ShoppingCart, PackageCheck, PackageX,
} from 'lucide-react'

type ConsignmentStatus = 'DRAFT' | 'SENT' | 'AT_CUSTOMER' | 'PARTIAL_SOLD' | 'SOLD' | 'RETURNED' | 'CANCELLED'

interface ConsignmentItem {
  id: string
  productName: string
  sku: string
  quantity: number
  soldQuantity: number
  returnedQuantity: number
  unitPrice: number
  totalPrice: number
}

interface Consignment {
  id: string
  consignmentNo: string
  customer: {
    id: string
    name: string
    city: string
  }
  agency?: {
    id: string
    name: string
  }
  status: ConsignmentStatus
  sentDate?: string
  returnDueDate?: string
  totalValue: number
  soldValue: number
  currency: string
  items: ConsignmentItem[]
  trackingNo?: string
  shippingMethod?: string
  notes?: string
  createdAt: string
}

const statusConfig: Record<ConsignmentStatus, {
  label: string
  color: string
  bgColor: string
  icon: typeof Clock
}> = {
  DRAFT: { label: 'Taslak', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: Clock },
  SENT: { label: 'Gönderildi', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: Send },
  AT_CUSTOMER: { label: 'Müşteride', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', icon: Building2 },
  PARTIAL_SOLD: { label: 'Kısmen Satıldı', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: ShoppingCart },
  SOLD: { label: 'Satıldı', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
  RETURNED: { label: 'İade Edildi', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: RotateCcw },
  CANCELLED: { label: 'İptal', color: 'text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-900', icon: XCircle },
}

const demoConsignments: Consignment[] = [
  {
    id: 'con1',
    consignmentNo: 'KNS-2026-0045',
    customer: { id: 'c1', name: 'HomeStyle Inc.', city: 'New York' },
    agency: { id: 'ag1', name: 'ABC Trading LLC' },
    status: 'AT_CUSTOMER',
    sentDate: '15 Oca 2026',
    returnDueDate: '15 Mar 2026',
    totalValue: 45000,
    soldValue: 18500,
    currency: 'USD',
    items: [
      { id: 'i1', productName: 'Anatolia Red 200x300', sku: 'AR-200300-RED', quantity: 10, soldQuantity: 4, returnedQuantity: 0, unitPrice: 2500, totalPrice: 25000 },
      { id: 'i2', productName: 'Cappadocia Blue 160x230', sku: 'CB-160230-BLU', quantity: 8, soldQuantity: 3, returnedQuantity: 0, unitPrice: 2500, totalPrice: 20000 },
    ],
    trackingNo: 'DHL-9871234567',
    shippingMethod: 'DHL Express',
    createdAt: '10 Oca 2026',
  },
  {
    id: 'con2',
    consignmentNo: 'KNS-2026-0044',
    customer: { id: 'c2', name: 'Luxury Floors NY', city: 'Los Angeles' },
    agency: { id: 'ag2', name: 'West Coast Carpets' },
    status: 'PARTIAL_SOLD',
    sentDate: '08 Oca 2026',
    returnDueDate: '08 Mar 2026',
    totalValue: 72000,
    soldValue: 48000,
    currency: 'USD',
    items: [
      { id: 'i3', productName: 'Istanbul Gold 200x300', sku: 'IG-200300-GLD', quantity: 12, soldQuantity: 8, returnedQuantity: 0, unitPrice: 3000, totalPrice: 36000 },
      { id: 'i4', productName: 'Aegean Grey 240x340', sku: 'AG-240340-GRY', quantity: 12, soldQuantity: 6, returnedQuantity: 2, unitPrice: 3000, totalPrice: 36000 },
    ],
    trackingNo: 'FEDEX-5678901234',
    shippingMethod: 'FedEx International',
    createdAt: '02 Oca 2026',
  },
  {
    id: 'con3',
    consignmentNo: 'KNS-2026-0043',
    customer: { id: 'c3', name: 'Pacific Rugs', city: 'San Francisco' },
    status: 'SOLD',
    sentDate: '20 Ara 2025',
    returnDueDate: '20 Şub 2026',
    totalValue: 35000,
    soldValue: 35000,
    currency: 'USD',
    items: [
      { id: 'i5', productName: 'Konya Multi 200x300', sku: 'KM-200300-MLT', quantity: 14, soldQuantity: 14, returnedQuantity: 0, unitPrice: 2500, totalPrice: 35000 },
    ],
    trackingNo: 'UPS-1234567890',
    shippingMethod: 'UPS Ground',
    notes: 'Tüm mallar satıldı, müşteri çok memnun.',
    createdAt: '15 Ara 2025',
  },
  {
    id: 'con4',
    consignmentNo: 'KNS-2026-0042',
    customer: { id: 'c4', name: 'Berlin Teppich GmbH', city: 'Berlin' },
    status: 'RETURNED',
    sentDate: '10 Ara 2025',
    returnDueDate: '10 Şub 2026',
    totalValue: 28000,
    soldValue: 7000,
    currency: 'EUR',
    items: [
      { id: 'i6', productName: 'Anatolia Red 160x230', sku: 'AR-160230-RED', quantity: 8, soldQuantity: 2, returnedQuantity: 6, unitPrice: 3500, totalPrice: 28000 },
    ],
    notes: 'Müşteri renk tonlarını beğenmedi, 6 adet iade.',
    createdAt: '05 Ara 2025',
  },
  {
    id: 'con5',
    consignmentNo: 'KNS-2026-0046',
    customer: { id: 'c5', name: 'Dubai Interiors LLC', city: 'Dubai' },
    agency: { id: 'ag3', name: 'Middle East Traders' },
    status: 'SENT',
    sentDate: '28 Oca 2026',
    returnDueDate: '28 Mar 2026',
    totalValue: 95000,
    soldValue: 0,
    currency: 'USD',
    items: [
      { id: 'i7', productName: 'Istanbul Gold 240x340', sku: 'IG-240340-GLD', quantity: 15, soldQuantity: 0, returnedQuantity: 0, unitPrice: 4000, totalPrice: 60000 },
      { id: 'i8', productName: 'Cappadocia Blue 200x300', sku: 'CB-200300-BLU', quantity: 14, soldQuantity: 0, returnedQuantity: 0, unitPrice: 2500, totalPrice: 35000 },
    ],
    trackingNo: 'DHL-1122334455',
    shippingMethod: 'DHL International',
    createdAt: '25 Oca 2026',
  },
  {
    id: 'con6',
    consignmentNo: 'KNS-2026-0047',
    customer: { id: 'c6', name: 'Chicago Interiors', city: 'Chicago' },
    status: 'DRAFT',
    totalValue: 42000,
    soldValue: 0,
    currency: 'USD',
    items: [
      { id: 'i9', productName: 'Aegean Grey 200x300', sku: 'AG-200300-GRY', quantity: 14, soldQuantity: 0, returnedQuantity: 0, unitPrice: 3000, totalPrice: 42000 },
    ],
    createdAt: '30 Oca 2026',
  },
]

export default function ConsignmentPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)

  const filtered = useMemo(() => {
    let result = demoConsignments
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.consignmentNo.toLowerCase().includes(q) ||
        c.customer.name.toLowerCase().includes(q) ||
        c.customer.city.toLowerCase().includes(q)
      )
    }
    return result
  }, [searchQuery, statusFilter])

  // Calculate stats
  const stats = useMemo(() => {
    const total = demoConsignments.length
    const atCustomer = demoConsignments.filter(c => ['SENT', 'AT_CUSTOMER', 'PARTIAL_SOLD'].includes(c.status)).length
    const totalValue = demoConsignments.reduce((sum, c) => sum + c.totalValue, 0)
    const soldValue = demoConsignments.reduce((sum, c) => sum + c.soldValue, 0)
    const conversionRate = totalValue > 0 ? Math.round((soldValue / totalValue) * 100) : 0
    const overdue = demoConsignments.filter(c => {
      if (!c.returnDueDate || ['SOLD', 'RETURNED', 'CANCELLED'].includes(c.status)) return false
      // Simplified check - in production would use actual date comparison
      return c.returnDueDate.includes('Şub')
    }).length
    return { total, atCustomer, totalValue, soldValue, conversionRate, overdue }
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Konsinye / Mal Takibi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Müşterilere gönderilen malları ve satış durumlarını takip edin</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Yeni Konsinye
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        {[
          { label: 'Toplam Konsinye', value: stats.total, icon: Package, color: 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800' },
          { label: 'Müşteride', value: stats.atCustomer, icon: Building2, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
          { label: 'Toplam Değer', value: `$${(stats.totalValue / 1000).toFixed(0)}K`, icon: Package, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Satılan Değer', value: `$${(stats.soldValue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
          { label: 'Dönüşüm Oranı', value: `%${stats.conversionRate}`, icon: TrendingUp, color: 'text-brand-600 bg-brand-100 dark:bg-brand-900/30' },
          { label: 'Vadesi Geçen', value: stats.overdue, icon: AlertTriangle, color: stats.overdue > 0 ? 'text-red-600 bg-red-100 dark:bg-red-900/30' : 'text-gray-400 bg-gray-100 dark:bg-gray-800' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Konsinye no veya müşteri ara..."
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-1">
          {['all', 'DRAFT', 'SENT', 'AT_CUSTOMER', 'PARTIAL_SOLD', 'SOLD', 'RETURNED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {s === 'all' ? 'Tümü' : statusConfig[s as ConsignmentStatus]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Consignment List */}
        <div className="col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Konsinye bulunamadı</p>
            </div>
          ) : (
            filtered.map((consignment) => {
              const st = statusConfig[consignment.status]
              const soldPercent = consignment.totalValue > 0 ? (consignment.soldValue / consignment.totalValue) * 100 : 0
              const isSelected = selectedConsignment?.id === consignment.id

              return (
                <motion.div
                  key={consignment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border-2 bg-white dark:bg-surface-dark p-5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand-400 dark:border-brand-600 shadow-lg'
                      : 'border-border dark:border-border-dark hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedConsignment(consignment)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{consignment.consignmentNo}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium ${st.bgColor} ${st.color}`}>
                          <st.icon className="h-3 w-3" />
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {consignment.customer.name}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {consignment.customer.city}
                        </span>
                        {consignment.agency && (
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            Acente: {consignment.agency.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                        {consignment.currency === 'EUR' ? '€' : '$'}{consignment.totalValue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {consignment.items.reduce((sum, i) => sum + i.quantity, 0)} adet
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Satış İlerlemesi</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {consignment.currency === 'EUR' ? '€' : '$'}{consignment.soldValue.toLocaleString()} / {consignment.currency === 'EUR' ? '€' : '$'}{consignment.totalValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${soldPercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          soldPercent === 100 ? 'bg-green-500' : soldPercent > 50 ? 'bg-amber-500' : 'bg-brand-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {consignment.items.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-secondary dark:bg-surface-dark-tertiary text-xs"
                      >
                        <Package className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{item.productName}</span>
                        <span className="text-gray-400">x{item.quantity}</span>
                        {item.soldQuantity > 0 && (
                          <span className="text-green-600 dark:text-green-400">({item.soldQuantity} satıldı)</span>
                        )}
                      </span>
                    ))}
                    {consignment.items.length > 3 && (
                      <span className="text-xs text-gray-400">+{consignment.items.length - 3} daha</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50 dark:border-border-dark/50">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {consignment.sentDate && (
                        <span className="flex items-center gap-1">
                          <Send className="h-3 w-3" />
                          {consignment.sentDate}
                        </span>
                      )}
                      {consignment.returnDueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Son: {consignment.returnDueDate}
                        </span>
                      )}
                      {consignment.trackingNo && (
                        <span className="font-mono text-[11px]">{consignment.trackingNo}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {consignment.status === 'AT_CUSTOMER' && (
                        <button className="px-2 py-1 rounded-lg text-[11px] font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                          Satış Kaydet
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {selectedConsignment ? (
              <motion.div
                key={selectedConsignment.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden"
              >
                {/* Header */}
                <div className={`p-5 ${statusConfig[selectedConsignment.status].bgColor}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-white/50 dark:bg-black/20 ${statusConfig[selectedConsignment.status].color}`}>
                      {React.createElement(statusConfig[selectedConsignment.status].icon, { className: 'h-3.5 w-3.5' })}
                      {statusConfig[selectedConsignment.status].label}
                    </span>
                    <button className="p-1.5 rounded-lg hover:bg-white/30 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedConsignment.consignmentNo}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedConsignment.customer.name} — {selectedConsignment.customer.city}
                  </p>
                </div>

                {/* Value Summary */}
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
                    <p className="text-[11px] text-gray-500">Toplam Değer</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                      {selectedConsignment.currency === 'EUR' ? '€' : '$'}{selectedConsignment.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
                    <p className="text-[11px] text-gray-500">Satılan</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">
                      {selectedConsignment.currency === 'EUR' ? '€' : '$'}{selectedConsignment.soldValue.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="px-4 pb-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Ürünler</h4>
                  <div className="space-y-2">
                    {selectedConsignment.items.map((item) => {
                      const remainingQty = item.quantity - item.soldQuantity - item.returnedQuantity
                      return (
                        <div key={item.id} className="rounded-xl border border-border dark:border-border-dark p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                              <p className="text-[11px] text-gray-500 font-mono">{item.sku}</p>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                              {selectedConsignment.currency === 'EUR' ? '€' : '$'}{item.totalPrice.toLocaleString()}
                            </p>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-1.5">
                              <p className="text-[10px] text-gray-500">Gönderilen</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</p>
                            </div>
                            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-1.5">
                              <p className="text-[10px] text-green-600">Satıldı</p>
                              <p className="text-sm font-bold text-green-600">{item.soldQuantity}</p>
                            </div>
                            <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-1.5">
                              <p className="text-[10px] text-red-600">İade</p>
                              <p className="text-sm font-bold text-red-600">{item.returnedQuantity}</p>
                            </div>
                            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-1.5">
                              <p className="text-[10px] text-blue-600">Kalan</p>
                              <p className="text-sm font-bold text-blue-600">{remainingQty}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Shipping Info */}
                {selectedConsignment.trackingNo && (
                  <div className="px-4 pb-4 border-t border-border dark:border-border-dark pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Kargo Bilgisi</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Truck className="h-4 w-4" />
                      <span>{selectedConsignment.shippingMethod}</span>
                      <span className="font-mono text-xs">{selectedConsignment.trackingNo}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 pb-4 space-y-2">
                  {selectedConsignment.status === 'AT_CUSTOMER' && (
                    <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors">
                      <ShoppingCart className="h-4 w-4" />
                      Satış Kaydet
                    </button>
                  )}
                  {['SENT', 'AT_CUSTOMER', 'PARTIAL_SOLD'].includes(selectedConsignment.status) && (
                    <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-border dark:border-border-dark px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
                      <RotateCcw className="h-4 w-4" />
                      İade Kaydet
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50 p-8 text-center"
              >
                <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Detayları görmek için bir konsinye seçin</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Stats */}
          <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Hızlı Bilgiler</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Ortalama Satış Süresi</span>
                <span className="font-medium text-gray-900 dark:text-white">32 gün</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">İade Oranı</span>
                <span className="font-medium text-red-600">%8</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">En Aktif Müşteri</span>
                <span className="font-medium text-gray-900 dark:text-white">HomeStyle Inc.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Need to import React for createElement
import React from 'react'
