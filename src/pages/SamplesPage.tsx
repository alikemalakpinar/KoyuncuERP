import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Palette, Plus, Search, Send, CheckCircle, Clock,
  XCircle, Package, Building2, Calendar, Eye,
  ArrowRight, MessageSquare, Image,
} from 'lucide-react'

type SampleStatus = 'preparing' | 'shipped' | 'delivered' | 'approved' | 'rejected' | 'order_placed'

interface Sample {
  id: string
  sampleNo: string
  customer: string
  customerCity: string
  agency: string | null
  products: { name: string; variant: string; size: string }[]
  status: SampleStatus
  shippedDate: string | null
  trackingNo: string | null
  feedback: string | null
  createdAt: string
}

const statusConfig: Record<SampleStatus, { label: string; color: string; icon: typeof Clock }> = {
  preparing: { label: 'Hazırlanıyor', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock },
  shipped: { label: 'Gönderildi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Send },
  delivered: { label: 'Teslim Edildi', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Package },
  approved: { label: 'Beğenildi', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  rejected: { label: 'Beğenilmedi', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  order_placed: { label: 'Sipariş Verildi', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', icon: ArrowRight },
}

const demoSamples: Sample[] = [
  {
    id: 'sm1', sampleNo: 'NUM-2026-0067', customer: 'HomeStyle Inc.', customerCity: 'New York',
    agency: 'ABC Trading LLC',
    products: [
      { name: 'Anatolia Red', variant: '200x300 Kırmızı', size: '30x30cm' },
      { name: 'Cappadocia Blue', variant: '160x230 Mavi', size: '30x30cm' },
    ],
    status: 'approved', shippedDate: '10 Oca 2026', trackingNo: 'DHL-4829173562',
    feedback: 'Müşteri renkleri çok beğendi, toplu sipariş verecek.',
    createdAt: '05 Oca 2026',
  },
  {
    id: 'sm2', sampleNo: 'NUM-2026-0066', customer: 'Luxury Floors NY', customerCity: 'Los Angeles',
    agency: 'West Coast Carpets',
    products: [
      { name: 'Istanbul Gold', variant: '200x300 Altın', size: '50x50cm' },
      { name: 'Aegean Grey', variant: '160x230 Gri', size: '30x30cm' },
      { name: 'Bodrum White', variant: '120x180 Beyaz', size: '30x30cm' },
    ],
    status: 'delivered', shippedDate: '20 Oca 2026', trackingNo: 'FEDEX-7829451236',
    feedback: null,
    createdAt: '12 Oca 2026',
  },
  {
    id: 'sm3', sampleNo: 'NUM-2026-0065', customer: 'Pacific Rugs', customerCity: 'San Francisco',
    agency: null,
    products: [
      { name: 'Konya Multi', variant: '200x300 Renkli', size: '30x30cm' },
    ],
    status: 'order_placed', shippedDate: '08 Oca 2026', trackingNo: 'UPS-1Z892471',
    feedback: 'Sipariş: ORD-2026-0147 olarak açıldı.',
    createdAt: '02 Oca 2026',
  },
  {
    id: 'sm4', sampleNo: 'NUM-2026-0064', customer: 'Berlin Teppich GmbH', customerCity: 'Berlin',
    agency: 'Southern Flooring Co.',
    products: [
      { name: 'Anatolia Red', variant: '240x340 Kırmızı', size: '50x50cm' },
      { name: 'Istanbul Gold', variant: '200x300 Altın', size: '50x50cm' },
    ],
    status: 'rejected', shippedDate: '05 Oca 2026', trackingNo: 'DHL-6721834590',
    feedback: 'Renk tonları beklentilere uymadı. Daha açık ton istiyor.',
    createdAt: '28 Ara 2025',
  },
  {
    id: 'sm5', sampleNo: 'NUM-2026-0063', customer: 'Dubai Interiors LLC', customerCity: 'Dubai',
    agency: 'ABC Trading LLC',
    products: [
      { name: 'Cappadocia Blue', variant: '200x300 Mavi', size: '30x30cm' },
      { name: 'Aegean Grey', variant: '200x300 Gri', size: '30x30cm' },
      { name: 'Bodrum White', variant: '200x300 Beyaz', size: '30x30cm' },
      { name: 'Istanbul Gold', variant: '240x340 Altın', size: '50x50cm' },
    ],
    status: 'preparing', shippedDate: null, trackingNo: null,
    feedback: null,
    createdAt: '29 Oca 2026',
  },
  {
    id: 'sm6', sampleNo: 'NUM-2026-0062', customer: 'Chicago Interiors', customerCity: 'Chicago',
    agency: 'Midwest Distributors',
    products: [
      { name: 'Anatolia Red', variant: '160x230 Kırmızı', size: '30x30cm' },
    ],
    status: 'shipped', shippedDate: '27 Oca 2026', trackingNo: 'FEDEX-3847291056',
    feedback: null,
    createdAt: '22 Oca 2026',
  },
]

export default function SamplesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = demoSamples.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return s.sampleNo.toLowerCase().includes(q) || s.customer.toLowerCase().includes(q)
    }
    return true
  })

  const stats = {
    total: demoSamples.length,
    active: demoSamples.filter(s => ['preparing', 'shipped', 'delivered'].includes(s.status)).length,
    approved: demoSamples.filter(s => s.status === 'approved' || s.status === 'order_placed').length,
    conversionRate: Math.round((demoSamples.filter(s => s.status === 'order_placed').length / demoSamples.length) * 100),
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Numune Takibi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Müşterilere gönderilen numuneleri ve geri dönüşleri takip edin</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Yeni Numune
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Toplam Numune', value: String(stats.total), icon: Palette, color: 'text-gray-900 dark:text-white' },
          { label: 'Aktif Takip', value: String(stats.active), icon: Clock, color: 'text-blue-600' },
          { label: 'Onaylanan', value: String(stats.approved), icon: CheckCircle, color: 'text-green-600' },
          { label: 'Dönüşüm Oranı', value: `%${stats.conversionRate}`, icon: ArrowRight, color: 'text-brand-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Numune no veya müşteri ara..."
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['all', 'preparing', 'shipped', 'delivered', 'approved', 'rejected', 'order_placed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {s === 'all' ? 'Tümü' : statusConfig[s as SampleStatus]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sample Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-12 text-center">
          <Palette className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Numune bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((sample) => {
            const st = statusConfig[sample.status]
            return (
              <div key={sample.id} className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5 hover:shadow-card transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{sample.sampleNo}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium ${st.color}`}>
                        <st.icon className="h-3 w-3" /> {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {sample.customer} ({sample.customerCity})
                      {sample.agency && <span className="text-gray-400"> — Acente: {sample.agency}</span>}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {sample.createdAt}
                  </p>
                </div>

                {/* Products */}
                <div className="space-y-1.5 mb-3">
                  {sample.products.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-surface-secondary/50 dark:bg-surface-dark-secondary/50 px-3 py-1.5">
                      <Image className="h-3 w-3 text-gray-400" />
                      <span className="text-xs font-medium text-gray-900 dark:text-white">{p.name}</span>
                      <span className="text-[11px] text-gray-500">— {p.variant}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{p.size}</span>
                    </div>
                  ))}
                </div>

                {/* Shipping & Feedback */}
                <div className="flex items-center justify-between text-xs border-t border-border/50 dark:border-border-dark/50 pt-3">
                  <div className="flex items-center gap-3">
                    {sample.trackingNo && (
                      <span className="text-gray-500 font-mono text-[11px]">
                        {sample.trackingNo}
                      </span>
                    )}
                    {sample.shippedDate && (
                      <span className="text-gray-400 flex items-center gap-1">
                        <Send className="h-3 w-3" /> {sample.shippedDate}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {sample.status === 'delivered' && (
                      <button className="rounded-lg px-2 py-1 text-[11px] font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                        Onayla
                      </button>
                    )}
                    {sample.status === 'approved' && (
                      <button className="rounded-lg px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" /> Siparişe Dönüştür
                      </button>
                    )}
                    <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Feedback */}
                {sample.feedback && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 px-3 py-2">
                    <MessageSquare className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 dark:text-blue-400">{sample.feedback}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
