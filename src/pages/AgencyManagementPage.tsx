/**
 * Agency Management Page - Acenta Yönetimi
 * Tur, Gemi, PAX, Alt Acenta ve Çalışan Yönetimi
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Ship, Plus, Search, Users, MapPin, Percent, Calendar,
  ChevronRight, Building2, Anchor, TrendingUp, DollarSign,
  UserPlus, Settings, BarChart3, Eye, Edit, Trash2,
  ArrowUpDown, Filter, X, Check, Star, Megaphone,
} from 'lucide-react'
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useAgencyPerformanceQuery } from '../hooks/useIpc'

// Types
interface Tour {
  id: string
  code: string
  name: string
  type: 'CRUISE' | 'LAND_TOUR' | 'MIXED' | 'DAY_TRIP' | 'SPECIAL'
  shipName?: string
  routeInfo?: string
  commissionRate: number
  defaultPax: number
  isActive: boolean
}

interface AgencyStaff {
  id: string
  name: string
  email?: string
  phone?: string
  agencies: { agencyId: string; agencyName: string; commissionRate: number }[]
  totalSales: number
  isActive: boolean
}

interface Agency {
  id: string
  code: string
  name: string
  region: string
  defaultCommission: number
  parentAgency?: { id: string; name: string }
  marketer?: { id: string; name: string; rate: number }
  tours: Tour[]
  staff: AgencyStaff[]
  subAgencies: Agency[]
  totalSales: number
  totalCommission: number
  orderCount: number
  isActive: boolean
}

// Demo data
const tourTypes = {
  CRUISE: { label: 'Gemi Turu', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Anchor },
  LAND_TOUR: { label: 'Kara Turu', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: MapPin },
  MIXED: { label: 'Karma', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Ship },
  DAY_TRIP: { label: 'Günlük', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Calendar },
  SPECIAL: { label: 'Özel', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: Star },
}

const demoAgencies: Agency[] = [
  {
    id: 'ag1',
    code: 'AG-001',
    name: 'Ege Tur Acentası',
    region: 'Ege',
    defaultCommission: 8,
    marketer: { id: 'mkt1', name: 'Mehmet Pazarlamacı', rate: 2 },
    tours: [
      { id: 't1', code: 'TUR-001', name: 'Efes Gemi Turu', type: 'CRUISE', shipName: 'MS Azure', routeInfo: 'Kuşadası - Efes - Şirince', commissionRate: 10, defaultPax: 150, isActive: true },
      { id: 't2', code: 'TUR-002', name: 'Pamukkale Günlük', type: 'DAY_TRIP', routeInfo: 'Kuşadası - Pamukkale - Hierapolis', commissionRate: 8, defaultPax: 45, isActive: true },
    ],
    staff: [
      { id: 's1', name: 'Ali Yılmaz', email: 'ali@egetour.com', phone: '+90 532 111 2233', agencies: [{ agencyId: 'ag1', agencyName: 'Ege Tur', commissionRate: 3 }], totalSales: 125000, isActive: true },
      { id: 's2', name: 'Ayşe Demir', email: 'ayse@egetour.com', phone: '+90 532 444 5566', agencies: [{ agencyId: 'ag1', agencyName: 'Ege Tur', commissionRate: 2.5 }, { agencyId: 'ag2', agencyName: 'Akdeniz Tours', commissionRate: 3 }], totalSales: 98000, isActive: true },
    ],
    subAgencies: [],
    totalSales: 450000,
    totalCommission: 36000,
    orderCount: 127,
    isActive: true,
  },
  {
    id: 'ag2',
    code: 'AG-002',
    name: 'Akdeniz Tours',
    region: 'Akdeniz',
    defaultCommission: 7,
    tours: [
      { id: 't3', code: 'TUR-003', name: 'Antalya Cruise', type: 'CRUISE', shipName: 'Celebrity Edge', routeInfo: 'Antalya - Kemer - Olimpos', commissionRate: 9, defaultPax: 200, isActive: true },
      { id: 't4', code: 'TUR-004', name: 'Kapadokya Karma', type: 'MIXED', routeInfo: 'Antalya - Konya - Kapadokya', commissionRate: 7.5, defaultPax: 40, isActive: true },
    ],
    staff: [
      { id: 's3', name: 'Can Öztürk', email: 'can@akdeniztours.com', phone: '+90 532 777 8899', agencies: [{ agencyId: 'ag2', agencyName: 'Akdeniz Tours', commissionRate: 3.5 }], totalSales: 187000, isActive: true },
    ],
    subAgencies: [
      {
        id: 'ag2-sub1',
        code: 'AG-002-A',
        name: 'Akdeniz Kemer Şubesi',
        region: 'Akdeniz',
        defaultCommission: 6,
        tours: [],
        staff: [],
        subAgencies: [],
        totalSales: 85000,
        totalCommission: 5100,
        orderCount: 34,
        isActive: true,
      },
    ],
    totalSales: 320000,
    totalCommission: 22400,
    orderCount: 89,
    isActive: true,
  },
  {
    id: 'ag3',
    code: 'AG-003',
    name: 'Istanbul Grand Tours',
    region: 'Marmara',
    defaultCommission: 6,
    marketer: { id: 'mkt2', name: 'Zeynep Broker', rate: 1.5 },
    tours: [
      { id: 't5', code: 'TUR-005', name: 'Bosphorus Special', type: 'SPECIAL', shipName: 'Queen Victoria', routeInfo: 'Istanbul - Boğaz Turu', commissionRate: 12, defaultPax: 300, isActive: true },
    ],
    staff: [],
    subAgencies: [],
    totalSales: 580000,
    totalCommission: 34800,
    orderCount: 156,
    isActive: true,
  },
]

// Tour performance data for chart
const tourPerformanceData = [
  { name: 'Efes Gemi', satis: 180, pax: 2250, oran: 10 },
  { name: 'Pamukkale', satis: 95, pax: 1425, oran: 8 },
  { name: 'Antalya Cruise', satis: 145, pax: 2900, oran: 9 },
  { name: 'Kapadokya', satis: 67, pax: 800, oran: 7.5 },
  { name: 'Bosphorus', satis: 210, pax: 3150, oran: 12 },
]

const regionData = [
  { name: 'Ege', value: 450000, color: '#3b82f6' },
  { name: 'Akdeniz', value: 405000, color: '#10b981' },
  { name: 'Marmara', value: 580000, color: '#8b5cf6' },
]

export default function AgencyManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'tours' | 'staff'>('list')
  const [showNewTourModal, setShowNewTourModal] = useState(false)
  const [showNewStaffModal, setShowNewStaffModal] = useState(false)

  // Filter agencies
  const filteredAgencies = useMemo(() => {
    if (!searchQuery) return demoAgencies
    const q = searchQuery.toLowerCase()
    return demoAgencies.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      a.region.toLowerCase().includes(q)
    )
  }, [searchQuery])

  // Calculate totals
  const totals = useMemo(() => ({
    agencies: demoAgencies.length,
    tours: demoAgencies.reduce((sum, a) => sum + a.tours.length, 0),
    staff: demoAgencies.reduce((sum, a) => sum + a.staff.length, 0),
    totalSales: demoAgencies.reduce((sum, a) => sum + a.totalSales, 0),
    totalCommission: demoAgencies.reduce((sum, a) => sum + a.totalCommission, 0),
    orders: demoAgencies.reduce((sum, a) => sum + a.orderCount, 0),
  }), [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Acenta Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tur operatörleri, gemiler ve PAX takibi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewTourModal(true)}
            className="flex items-center gap-2 rounded-xl border border-border dark:border-border-dark px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
          >
            <Anchor className="h-4 w-4" />
            Yeni Tur
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4" />
            Yeni Acenta
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4">
        {[
          { label: 'Aktif Acenta', value: totals.agencies, icon: Building2, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
          { label: 'Tanımlı Tur', value: totals.tours, icon: Ship, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Acenta Çalışanı', value: totals.staff, icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'Toplam Sipariş', value: totals.orders, icon: BarChart3, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
          { label: 'Toplam Satış', value: `$${(totals.totalSales / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
          { label: 'Toplam Komisyon', value: `$${(totals.totalCommission / 1000).toFixed(0)}K`, icon: Percent, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{kpi.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Tour Performance Chart */}
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Tur Performansı (Satış x$1000)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tourPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#868e96' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#868e96' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}k`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e9ecef' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'satis') return [`$${value}k`, 'Satış']
                    if (name === 'pax') return [value, 'PAX']
                    return [`%${value}`, 'Komisyon']
                  }}
                />
                <Bar dataKey="satis" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region Distribution */}
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bölge Dağılımı</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, 'Satış']} />
                <Legend
                  formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Acenta ara..."
              className="w-64 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
            <Filter className="h-4 w-4" />
            Filtrele
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border dark:border-border-dark p-1 bg-white dark:bg-surface-dark">
          {[
            { id: 'list', label: 'Acentalar', icon: Building2 },
            { id: 'tours', label: 'Turlar', icon: Ship },
            { id: 'staff', label: 'Çalışanlar', icon: Users },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setViewMode(view.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === view.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <view.icon className="h-3.5 w-3.5" />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Agency List */}
        <div className="col-span-2 space-y-3">
          {filteredAgencies.map((agency) => (
            <motion.div
              key={agency.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border-2 bg-white dark:bg-surface-dark p-5 transition-all cursor-pointer ${
                selectedAgency?.id === agency.id
                  ? 'border-purple-400 dark:border-purple-600 shadow-lg'
                  : 'border-border dark:border-border-dark hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-md'
              }`}
              onClick={() => setSelectedAgency(agency)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <Ship className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{agency.name}</h3>
                      <span className="text-xs font-mono text-gray-400">{agency.code}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" /> {agency.region}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                        <Percent className="h-3 w-3" /> %{agency.defaultCommission} komisyon
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                    ${agency.totalSales.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{agency.orderCount} sipariş</p>
                </div>
              </div>

              {/* Marketer Badge */}
              {agency.marketer && (
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                  <Megaphone className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  <span className="text-xs font-medium text-pink-700 dark:text-pink-300">
                    Pazarlamacı: {agency.marketer.name} (%{agency.marketer.rate})
                  </span>
                </div>
              )}

              {/* Tours */}
              <div className="space-y-2 mb-3">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Turlar ({agency.tours.length})</p>
                <div className="flex flex-wrap gap-2">
                  {agency.tours.map((tour) => {
                    const tourType = tourTypes[tour.type]
                    return (
                      <div
                        key={tour.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${tourType.color}`}
                      >
                        <tourType.icon className="h-3 w-3" />
                        {tour.name}
                        {tour.shipName && <span className="text-[10px] opacity-70">({tour.shipName})</span>}
                      </div>
                    )
                  })}
                  {agency.tours.length === 0 && (
                    <span className="text-xs text-gray-400">Henüz tur tanımlanmamış</span>
                  )}
                </div>
              </div>

              {/* Staff & Sub-agencies */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50 dark:border-border-dark/50">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="h-3.5 w-3.5" /> {agency.staff.length} çalışan
                  </span>
                  {agency.subAgencies.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Building2 className="h-3.5 w-3.5" /> {agency.subAgencies.length} alt acenta
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {selectedAgency ? (
              <motion.div
                key={selectedAgency.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200 text-xs font-medium">{selectedAgency.code}</p>
                      <h3 className="text-white font-bold text-lg mt-1">{selectedAgency.name}</h3>
                      <p className="text-purple-200 text-sm">{selectedAgency.region} Bölgesi</p>
                    </div>
                    <button
                      onClick={() => setSelectedAgency(null)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
                    <p className="text-[11px] text-gray-500">Toplam Satış</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                      ${selectedAgency.totalSales.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
                    <p className="text-[11px] text-gray-500">Kazanılan Komisyon</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">
                      ${selectedAgency.totalCommission.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Tours List */}
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Turlar</h4>
                    <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                      + Tur Ekle
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedAgency.tours.map((tour) => {
                      const tourType = tourTypes[tour.type]
                      return (
                        <div
                          key={tour.id}
                          className="rounded-xl border border-border dark:border-border-dark p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${tourType.color}`}>
                                <tourType.icon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{tour.name}</p>
                                <p className="text-[11px] text-gray-500">{tour.code}</p>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-purple-600">%{tour.commissionRate}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {tour.shipName && (
                              <span className="flex items-center gap-1">
                                <Anchor className="h-3 w-3" /> {tour.shipName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {tour.defaultPax} PAX
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Staff List */}
                <div className="px-4 pb-4 border-t border-border dark:border-border-dark pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Çalışanlar</h4>
                    <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                      + Çalışan Ekle
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedAgency.staff.map((staff) => (
                      <div
                        key={staff.id}
                        className="flex items-center justify-between rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                              {staff.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{staff.name}</p>
                            <p className="text-[11px] text-gray-500">
                              {staff.agencies.length > 1 ? `${staff.agencies.length} acentada çalışıyor` : 'Tek acenta'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                            ${staff.totalSales.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-purple-600">
                            %{staff.agencies.find(a => a.agencyId === selectedAgency.id)?.commissionRate || 0}
                          </p>
                        </div>
                      </div>
                    ))}
                    {selectedAgency.staff.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">Henüz çalışan eklenmemiş</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50 p-8 text-center"
              >
                <Ship className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Detayları görmek için bir acenta seçin</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Hızlı İşlemler</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
                <UserPlus className="h-4 w-4 text-gray-400" />
                Çalışan Ekle
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
                <Anchor className="h-4 w-4 text-gray-400" />
                Yeni Tur Tanımla
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
                <Building2 className="h-4 w-4 text-gray-400" />
                Alt Acenta Ekle
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
                <Settings className="h-4 w-4 text-gray-400" />
                Komisyon Ayarları
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
