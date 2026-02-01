import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Plus, Search, Download, Eye, CheckCircle,
  Clock, AlertTriangle, Stamp, Globe, Ship,
  Calendar, Building2, Printer,
} from 'lucide-react'

type DocStatus = 'draft' | 'ready' | 'submitted' | 'approved'
type DocType = 'atr' | 'eur1' | 'origin' | 'packing' | 'bl' | 'invoice' | 'insurance'

interface ExportDocument {
  id: string
  docNo: string
  type: DocType
  shipmentNo: string
  customer: string
  destination: string
  status: DocStatus
  createdAt: string
  submittedAt: string | null
  approvedAt: string | null
  notes: string | null
}

const docTypeConfig: Record<DocType, { label: string; fullName: string; color: string }> = {
  atr: { label: 'A.TR', fullName: 'A.TR Dolaşım Belgesi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  eur1: { label: 'EUR.1', fullName: 'EUR.1 Dolaşım Belgesi', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  origin: { label: 'Menşei', fullName: 'Menşei Şahadetnamesi', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  packing: { label: 'Çeki Listesi', fullName: 'Çeki / Packing Listesi', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  bl: { label: 'Konşimento', fullName: 'Bill of Lading / CMR', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  invoice: { label: 'Fatura', fullName: 'Ticari Fatura (Commercial Invoice)', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  insurance: { label: 'Sigorta', fullName: 'Sigorta Poliçesi', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
}

const statusConfig: Record<DocStatus, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Taslak', color: 'text-gray-500', icon: Clock },
  ready: { label: 'Hazır', color: 'text-blue-600', icon: FileText },
  submitted: { label: 'Başvuruldu', color: 'text-amber-600', icon: AlertTriangle },
  approved: { label: 'Onaylandı', color: 'text-green-600', icon: CheckCircle },
}

const demoDocuments: ExportDocument[] = [
  { id: 'd1', docNo: 'ATR-2026-0145', type: 'atr', shipmentNo: 'SHP-2026-0088', customer: 'Luxury Floors NY', destination: 'ABD', status: 'approved', createdAt: '08 Oca 2026', submittedAt: '09 Oca 2026', approvedAt: '10 Oca 2026', notes: null },
  { id: 'd2', docNo: 'EUR1-2026-0089', type: 'eur1', shipmentNo: 'SHP-2026-0086', customer: 'Berlin Teppich GmbH', destination: 'Almanya', status: 'submitted', createdAt: '26 Oca 2026', submittedAt: '27 Oca 2026', approvedAt: null, notes: 'Ticaret Odasına başvuru yapıldı' },
  { id: 'd3', docNo: 'MNS-2026-0034', type: 'origin', shipmentNo: 'SHP-2026-0089', customer: 'HomeStyle Inc.', destination: 'ABD', status: 'approved', createdAt: '18 Oca 2026', submittedAt: '19 Oca 2026', approvedAt: '20 Oca 2026', notes: null },
  { id: 'd4', docNo: 'PL-2026-0089', type: 'packing', shipmentNo: 'SHP-2026-0089', customer: 'HomeStyle Inc.', destination: 'ABD', status: 'ready', createdAt: '19 Oca 2026', submittedAt: null, approvedAt: null, notes: '45 koli, 2340 kg' },
  { id: 'd5', docNo: 'BL-MAEU-268473920', type: 'bl', shipmentNo: 'SHP-2026-0089', customer: 'HomeStyle Inc.', destination: 'ABD', status: 'approved', createdAt: '20 Oca 2026', submittedAt: '20 Oca 2026', approvedAt: '20 Oca 2026', notes: 'Maersk - FCL 1x40HC' },
  { id: 'd6', docNo: 'INV-2026-0089', type: 'invoice', shipmentNo: 'SHP-2026-0089', customer: 'HomeStyle Inc.', destination: 'ABD', status: 'approved', createdAt: '18 Oca 2026', submittedAt: null, approvedAt: '18 Oca 2026', notes: 'CFR New York - $48,500' },
  { id: 'd7', docNo: 'SIG-2026-0089', type: 'insurance', shipmentNo: 'SHP-2026-0089', customer: 'HomeStyle Inc.', destination: 'ABD', status: 'ready', createdAt: '19 Oca 2026', submittedAt: null, approvedAt: null, notes: 'All Risks - $48,500 değer' },
  { id: 'd8', docNo: 'PL-2026-0086', type: 'packing', shipmentNo: 'SHP-2026-0086', customer: 'Berlin Teppich GmbH', destination: 'Almanya', status: 'ready', createdAt: '27 Oca 2026', submittedAt: null, approvedAt: null, notes: '62 koli, 3890 kg' },
  { id: 'd9', docNo: 'INV-2026-0086', type: 'invoice', shipmentNo: 'SHP-2026-0086', customer: 'Berlin Teppich GmbH', destination: 'Almanya', status: 'approved', createdAt: '26 Oca 2026', submittedAt: null, approvedAt: '26 Oca 2026', notes: 'DAP Berlin - €67,200' },
  { id: 'd10', docNo: 'ATR-2026-0146', type: 'atr', shipmentNo: 'SHP-2026-0085', customer: 'Dubai Interiors LLC', destination: 'BAE', status: 'draft', createdAt: '29 Oca 2026', submittedAt: null, approvedAt: null, notes: 'Hazırlanıyor' },
]

export default function ExportDocsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedShipment, setSelectedShipment] = useState<string>('all')

  const shipments = [...new Set(demoDocuments.map(d => d.shipmentNo))]

  const filtered = demoDocuments.filter((d) => {
    if (typeFilter !== 'all' && d.type !== typeFilter) return false
    if (selectedShipment !== 'all' && d.shipmentNo !== selectedShipment) return false
    if (search) {
      const q = search.toLowerCase()
      return d.docNo.toLowerCase().includes(q) || d.customer.toLowerCase().includes(q)
    }
    return true
  })

  const stats = {
    total: demoDocuments.length,
    pending: demoDocuments.filter(d => d.status === 'draft' || d.status === 'ready').length,
    submitted: demoDocuments.filter(d => d.status === 'submitted').length,
    approved: demoDocuments.filter(d => d.status === 'approved').length,
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">İhracat Belgeleri</h1>
          <p className="text-sm text-gray-500 mt-0.5">A.TR, EUR.1, Menşei Şahadetnamesi, Çeki Listesi ve diğer belgeler</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Yeni Belge
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Toplam Belge', value: stats.total, icon: FileText, color: 'text-gray-900 dark:text-white' },
          { label: 'Bekleyen', value: stats.pending, icon: Clock, color: 'text-amber-600' },
          { label: 'Başvuruda', value: stats.submitted, icon: Stamp, color: 'text-blue-600' },
          { label: 'Onaylı', value: stats.approved, icon: CheckCircle, color: 'text-green-600' },
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
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Belge no veya müşteri ara..."
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={selectedShipment}
          onChange={(e) => setSelectedShipment(e.target.value)}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm outline-none text-gray-900 dark:text-white"
        >
          <option value="all">Tüm Sevkiyatlar</option>
          {shipments.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex gap-1 flex-wrap">
          {['all', 'atr', 'eur1', 'origin', 'packing', 'bl', 'invoice'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === t ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t === 'all' ? 'Tümü' : docTypeConfig[t as DocType]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Belge No</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Tür</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Sevkiyat</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Müşteri</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Varış</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-gray-500">Durum</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Not</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Belge bulunamadı</p>
                </td>
              </tr>
            ) : (
              filtered.map((doc) => {
                const typeConf = docTypeConfig[doc.type]
                const stConf = statusConfig[doc.status]
                return (
                  <tr key={doc.id} className="border-b border-border/50 dark:border-border-dark/50 last:border-0 hover:bg-surface-secondary/30 dark:hover:bg-surface-dark-secondary/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-gray-900 dark:text-white">{doc.docNo}</span>
                      <p className="text-[11px] text-gray-400">{doc.createdAt}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium ${typeConf.color}`}>
                        {typeConf.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Ship className="h-3 w-3" /> {doc.shipmentNo}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-900 dark:text-white flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-gray-400" /> {doc.customer}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {doc.destination}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${stConf.color}`}>
                        <stConf.icon className="h-3 w-3" /> {stConf.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[11px] text-gray-500 max-w-[200px] truncate block">{doc.notes || '—'}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Görüntüle">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Yazdır">
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="İndir">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
