import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Filter, Search, Calendar, User, ShoppingCart,
  DollarSign, Package, FileText, Settings, Trash2, Edit3,
  Plus, CheckCircle, Truck, Eye, Download, LogIn, LogOut,
  Handshake, AlertTriangle,
} from 'lucide-react'
import { useAuth, roleLabels } from '../contexts/AuthContext'

interface LogEntry {
  id: string
  timestamp: string
  user: string
  role: string
  action: string
  category: 'order' | 'payment' | 'stock' | 'invoice' | 'user' | 'commission' | 'system' | 'auth'
  detail: string
  ip?: string
}

const categoryConfig = {
  order: { label: 'Sipariş', icon: ShoppingCart, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  payment: { label: 'Ödeme', icon: DollarSign, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
  stock: { label: 'Stok', icon: Package, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
  invoice: { label: 'Fatura', icon: FileText, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  user: { label: 'Kullanıcı', icon: User, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
  commission: { label: 'Komisyon', icon: Handshake, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' },
  system: { label: 'Sistem', icon: Settings, color: 'text-gray-500 bg-gray-50 dark:bg-gray-800' },
  auth: { label: 'Oturum', icon: LogIn, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' },
}

const demoLogs: LogEntry[] = [
  { id: 'l1', timestamp: '30 Oca 2026, 10:25', user: 'Ahmet Koyuncu', role: 'patron', action: 'Komisyon onayladı', category: 'commission', detail: 'ABC Trading LLC - $4,488 komisyon ödeme onayı' },
  { id: 'l2', timestamp: '30 Oca 2026, 10:20', user: 'Ali Çelik', role: 'satis_elemani', action: 'Sipariş oluşturdu', category: 'order', detail: 'ORD-2026-0152 - Chicago Interiors - $28,400' },
  { id: 'l3', timestamp: '30 Oca 2026, 09:45', user: 'Ayşe Demir', role: 'muhasebeci', action: 'Fatura kesti', category: 'invoice', detail: 'INV-2026-0093 - HomeStyle Inc. - $66,348' },
  { id: 'l4', timestamp: '30 Oca 2026, 09:30', user: 'Mehmet Yılmaz', role: 'mudur', action: 'Stok girişi yaptı', category: 'stock', detail: 'El Dokuma Halı - Kayseri: +40 adet (Toplam: 85)' },
  { id: 'l5', timestamp: '30 Oca 2026, 09:15', user: 'Ahmet Koyuncu', role: 'patron', action: 'Giriş yaptı', category: 'auth', detail: 'Başarılı oturum açma', ip: '192.168.1.100' },
  { id: 'l6', timestamp: '30 Oca 2026, 08:50', user: 'Ayşe Demir', role: 'muhasebeci', action: 'Tahsilat kaydetti', category: 'payment', detail: 'Desert Home Decor - $15,000 havale ödemesi' },
  { id: 'l7', timestamp: '30 Oca 2026, 08:45', user: 'Mehmet Yılmaz', role: 'mudur', action: 'Giriş yaptı', category: 'auth', detail: 'Başarılı oturum açma', ip: '192.168.1.105' },
  { id: 'l8', timestamp: '29 Oca 2026, 17:30', user: 'Ali Çelik', role: 'satis_elemani', action: 'Sipariş güncelledi', category: 'order', detail: 'ORD-2026-0147 - Teslimat adresi güncellendi' },
  { id: 'l9', timestamp: '29 Oca 2026, 16:45', user: 'Ahmet Koyuncu', role: 'patron', action: 'Kullanıcı ekledi', category: 'user', detail: 'Yeni kullanıcı: Fatma Özkan (Satış Elemanı)' },
  { id: 'l10', timestamp: '29 Oca 2026, 16:00', user: 'Sistem', role: 'system', action: 'Yedekleme tamamlandı', category: 'system', detail: 'Günlük veritabanı yedeği başarıyla alındı (2.3 GB)' },
  { id: 'l11', timestamp: '29 Oca 2026, 15:30', user: 'Ali Çelik', role: 'satis_elemani', action: 'Sipariş sevk etti', category: 'order', detail: 'ORD-2026-0147 - Kargo teslim edildi (TRK-2026-8847)' },
  { id: 'l12', timestamp: '29 Oca 2026, 14:00', user: 'John Smith', role: 'acente', action: 'Komisyon raporu görüntüledi', category: 'commission', detail: 'Ocak 2026 komisyon özeti indirildi' },
  { id: 'l13', timestamp: '29 Oca 2026, 11:00', user: 'Ayşe Demir', role: 'muhasebeci', action: 'Rapor dışa aktardı', category: 'invoice', detail: 'Ocak 2026 fatura listesi Excel olarak indirildi' },
  { id: 'l14', timestamp: '29 Oca 2026, 10:00', user: 'Mehmet Yılmaz', role: 'mudur', action: 'Stok uyarısı', category: 'stock', detail: 'Bambu Halı - Doğal: Stok kritik seviyeye düştü (12 adet)' },
  { id: 'l15', timestamp: '28 Oca 2026, 16:30', user: 'Ahmet Koyuncu', role: 'patron', action: 'Fiyat güncelledi', category: 'stock', detail: 'İpek Halı - Hereke: Satış fiyatı $9,200 → $9,500' },
]

export default function ActivityLogPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')

  const filtered = demoLogs.filter(log => {
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false
    if (userFilter !== 'all' && log.user !== userFilter) return false
    if (search && !log.action.toLowerCase().includes(search.toLowerCase()) && !log.detail.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const uniqueUsers = [...new Set(demoLogs.map(l => l.user))]

  const stats = {
    today: demoLogs.filter(l => l.timestamp.startsWith('30')).length,
    orders: demoLogs.filter(l => l.category === 'order').length,
    payments: demoLogs.filter(l => l.category === 'payment').length,
    total: demoLogs.length,
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Aktivite Günlüğü</h1>
        <p className="text-sm text-gray-500 mt-0.5">Sistem genelinde yapılan tüm işlemler</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Bugün', value: stats.today, icon: Calendar, color: 'text-blue-500' },
          { label: 'Sipariş İşlemi', value: stats.orders, icon: ShoppingCart, color: 'text-brand-500' },
          { label: 'Ödeme İşlemi', value: stats.payments, icon: DollarSign, color: 'text-green-500' },
          { label: 'Toplam Kayıt', value: stats.total, icon: Activity, color: 'text-purple-500' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="İşlem ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="all">Tüm Kategoriler</option>
          {Object.entries(categoryConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="all">Tüm Kullanıcılar</option>
          {uniqueUsers.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <button className="flex items-center gap-2 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
          <Download className="h-4 w-4" /> Dışa Aktar
        </button>
      </div>

      {/* Log List */}
      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Kayıt bulunamadı</div>
        ) : (
          <div className="divide-y divide-border/50 dark:divide-border-dark/50">
            {filtered.map(log => {
              const cat = categoryConfig[log.category]
              const Icon = cat.icon
              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-secondary/30 dark:hover:bg-surface-dark-secondary/30 transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</span>
                      <span className="rounded-md bg-surface-secondary dark:bg-surface-dark-secondary px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{cat.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{log.detail}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{log.user}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{log.timestamp}</span>
                      {log.ip && <span>IP: {log.ip}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
