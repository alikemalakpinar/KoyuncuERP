import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Ship, Truck, Plane, Package, MapPin, Calendar,
  Search, Plus, ExternalLink, Clock, CheckCircle,
  AlertTriangle, Anchor, Container, FileText,
} from 'lucide-react'

type ShipmentStatus = 'preparing' | 'customs_tr' | 'in_transit' | 'customs_dest' | 'delivered'
type ShipmentMethod = 'sea' | 'air' | 'land'

interface Shipment {
  id: string
  shipmentNo: string
  orderNos: string[]
  customer: string
  destination: string
  method: ShipmentMethod
  status: ShipmentStatus
  containerNo: string | null
  blNo: string | null // Bill of Lading
  carrier: string
  departureDate: string
  eta: string
  packages: number
  grossWeight: string
  volume: string
  documents: string[]
}

const methodIcons: Record<ShipmentMethod, typeof Ship> = {
  sea: Ship,
  air: Plane,
  land: Truck,
}

const methodLabels: Record<ShipmentMethod, string> = {
  sea: 'Deniz Yolu',
  air: 'Hava Yolu',
  land: 'Kara Yolu',
}

const statusConfig: Record<ShipmentStatus, { label: string; color: string; step: number }> = {
  preparing: { label: 'Hazırlanıyor', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', step: 0 },
  customs_tr: { label: 'TR Gümrük', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', step: 1 },
  in_transit: { label: 'Yolda', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', step: 2 },
  customs_dest: { label: 'Varış Gümrük', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', step: 3 },
  delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', step: 4 },
}

const demoShipments: Shipment[] = [
  {
    id: 's1', shipmentNo: 'SHP-2026-0089', orderNos: ['ORD-2026-0147', 'ORD-2026-0148'],
    customer: 'HomeStyle Inc.', destination: 'New York, ABD',
    method: 'sea', status: 'in_transit',
    containerNo: 'MSCU-7234567', blNo: 'MAEU-268473920',
    carrier: 'Maersk Line', departureDate: '20 Oca 2026', eta: '18 Şub 2026',
    packages: 45, grossWeight: '2,340 kg', volume: '18.5 CBM',
    documents: ['Konşimento', 'Çeki Listesi', 'Fatura', 'A.TR', 'Menşei Şahadetnamesi'],
  },
  {
    id: 's2', shipmentNo: 'SHP-2026-0088', orderNos: ['ORD-2026-0145'],
    customer: 'Luxury Floors NY', destination: 'Los Angeles, ABD',
    method: 'sea', status: 'customs_dest',
    containerNo: 'CMAU-4521890', blNo: 'COSU-6281945730',
    carrier: 'COSCO Shipping', departureDate: '10 Oca 2026', eta: '08 Şub 2026',
    packages: 28, grossWeight: '1,560 kg', volume: '12.3 CBM',
    documents: ['Konşimento', 'Çeki Listesi', 'Fatura', 'EUR.1'],
  },
  {
    id: 's3', shipmentNo: 'SHP-2026-0087', orderNos: ['ORD-2026-0142'],
    customer: 'London Carpets Ltd.', destination: 'Londra, İngiltere',
    method: 'air', status: 'delivered',
    containerNo: null, blNo: 'AWB-235-84721956',
    carrier: 'Turkish Airlines Cargo', departureDate: '15 Oca 2026', eta: '17 Oca 2026',
    packages: 8, grossWeight: '420 kg', volume: '3.2 CBM',
    documents: ['Hava Konşimentosu', 'Çeki Listesi', 'Fatura', 'A.TR'],
  },
  {
    id: 's4', shipmentNo: 'SHP-2026-0086', orderNos: ['ORD-2026-0140', 'ORD-2026-0141'],
    customer: 'Berlin Teppich GmbH', destination: 'Berlin, Almanya',
    method: 'land', status: 'customs_tr',
    containerNo: 'TIR-34-ANK-7821', blNo: 'CMR-2026-0456',
    carrier: 'Ekol Lojistik', departureDate: '28 Oca 2026', eta: '03 Şub 2026',
    packages: 62, grossWeight: '3,890 kg', volume: '28.7 CBM',
    documents: ['CMR', 'Çeki Listesi', 'Fatura', 'EUR.1', 'Menşei Şahadetnamesi'],
  },
  {
    id: 's5', shipmentNo: 'SHP-2026-0085', orderNos: ['ORD-2026-0138'],
    customer: 'Dubai Interiors LLC', destination: 'Dubai, BAE',
    method: 'sea', status: 'preparing',
    containerNo: null, blNo: null,
    carrier: 'MSC', departureDate: '01 Şub 2026', eta: '12 Şub 2026',
    packages: 35, grossWeight: '2,100 kg', volume: '16.0 CBM',
    documents: ['Fatura (Taslak)'],
  },
]

function ProgressSteps({ currentStep }: { currentStep: number }) {
  const steps = ['Hazırlık', 'TR Gümrük', 'Transit', 'Varış Gümrük', 'Teslim']
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className={`h-1.5 w-6 rounded-full transition-colors ${
            i <= currentStep ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
          }`} />
        </div>
      ))}
    </div>
  )
}

export default function ShipmentsPage() {
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('all')

  const filtered = demoShipments.filter((s) => {
    if (methodFilter !== 'all' && s.method !== methodFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return s.shipmentNo.toLowerCase().includes(q) || s.customer.toLowerCase().includes(q) || (s.containerNo?.toLowerCase().includes(q) ?? false)
    }
    return true
  })

  const stats = {
    active: demoShipments.filter(s => s.status !== 'delivered').length,
    inTransit: demoShipments.filter(s => s.status === 'in_transit').length,
    atCustoms: demoShipments.filter(s => s.status === 'customs_tr' || s.status === 'customs_dest').length,
    totalPackages: demoShipments.filter(s => s.status !== 'delivered').reduce((sum, s) => sum + s.packages, 0),
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sevkiyat & Lojistik</h1>
          <p className="text-sm text-gray-500 mt-0.5">Konteyner, konşimento ve nakliye takibi</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Yeni Sevkiyat
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Aktif Sevkiyat', value: stats.active, icon: Package, color: 'text-brand-600' },
          { label: 'Yolda', value: stats.inTransit, icon: Ship, color: 'text-blue-600' },
          { label: 'Gümrükte', value: stats.atCustoms, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'Toplam Koli', value: stats.totalPackages, icon: Container, color: 'text-purple-600' },
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
            placeholder="Sevkiyat no, müşteri veya konteyner ara..."
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'sea', 'air', 'land'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                methodFilter === m ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {m === 'all' ? 'Tümü' : methodLabels[m as ShipmentMethod]}
            </button>
          ))}
        </div>
      </div>

      {/* Shipment Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-12 text-center">
          <Ship className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Sevkiyat bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((shipment) => {
            const st = statusConfig[shipment.status]
            const MethodIcon = methodIcons[shipment.method]
            return (
              <div key={shipment.id} className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5 hover:shadow-card transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      shipment.method === 'sea' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' :
                      shipment.method === 'air' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/20' :
                      'bg-amber-100 text-amber-600 dark:bg-amber-900/20'
                    }`}>
                      <MethodIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{shipment.shipmentNo}</h3>
                        <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {shipment.customer} — {shipment.orderNos.join(', ')}
                      </p>
                    </div>
                  </div>

                  <ProgressSteps currentStep={st.step} />
                </div>

                <div className="grid grid-cols-6 gap-4 text-xs">
                  <div>
                    <p className="text-gray-400">Varış</p>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {shipment.destination}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Taşıyıcı</p>
                    <p className="font-medium text-gray-900 dark:text-white">{shipment.carrier}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Konteyner / Araç</p>
                    <p className="font-medium text-gray-900 dark:text-white font-mono text-[11px]">{shipment.containerNo || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Konşimento</p>
                    <p className="font-medium text-gray-900 dark:text-white font-mono text-[11px]">{shipment.blNo || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Yükleme / ETA</p>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {shipment.departureDate}
                    </p>
                    <p className="text-brand-600 font-medium">ETA: {shipment.eta}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Koli / Ağırlık / Hacim</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {shipment.packages} koli | {shipment.grossWeight}
                    </p>
                    <p className="text-gray-500">{shipment.volume}</p>
                  </div>
                </div>

                {/* Documents */}
                <div className="mt-3 pt-3 border-t border-border/50 dark:border-border-dark/50 flex items-center gap-2 flex-wrap">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  {shipment.documents.map((doc) => (
                    <span key={doc} className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
