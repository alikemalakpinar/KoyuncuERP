import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Shield, Building2, Percent, Bell, Globe, Save,
  Plus, Edit3, Trash2, Check, X, ChevronDown, Settings,
  Lock, Mail, Phone, Calendar, Eye, EyeOff,
} from 'lucide-react'
import { useAuth, roleLabels, type UserRole } from '../contexts/AuthContext'

const tabs = [
  { id: 'users', label: 'Kullanıcı Yönetimi', icon: Users },
  { id: 'roles', label: 'Rol & İzinler', icon: Shield },
  { id: 'company', label: 'Firma Bilgileri', icon: Building2 },
  { id: 'commissions', label: 'Komisyon Ayarları', icon: Percent },
  { id: 'notifications', label: 'Bildirim Ayarları', icon: Bell },
  { id: 'general', label: 'Genel Ayarlar', icon: Settings },
] as const

type TabId = (typeof tabs)[number]['id']

interface DemoUser {
  id: string
  name: string
  email: string
  role: UserRole
  phone: string
  status: 'active' | 'inactive'
  lastLogin: string
  agency?: string
}

const demoUsers: DemoUser[] = [
  { id: 'u1', name: 'Ahmet Koyuncu', email: 'patron@koyuncu.com', role: 'OWNER', phone: '+90 532 111 22 33', status: 'active', lastLogin: '30 Oca 2026, 09:15' },
  { id: 'u2', name: 'Mehmet Yılmaz', email: 'mudur@koyuncu.com', role: 'MANAGER', phone: '+90 533 222 33 44', status: 'active', lastLogin: '30 Oca 2026, 08:45' },
  { id: 'u3', name: 'Ayşe Demir', email: 'muhasebe@koyuncu.com', role: 'ACCOUNTANT', phone: '+90 534 333 44 55', status: 'active', lastLogin: '29 Oca 2026, 17:30' },
  { id: 'u4', name: 'Ali Çelik', email: 'satis@koyuncu.com', role: 'SALES', phone: '+90 535 444 55 66', status: 'active', lastLogin: '30 Oca 2026, 10:20' },
  { id: 'u5', name: 'John Smith', email: 'acente@koyuncu.com', role: 'VIEWER', phone: '+1 312 555 0147', status: 'active', lastLogin: '28 Oca 2026, 14:00', agency: 'ABC Trading LLC' },
  { id: 'u6', name: 'Fatma Özkan', email: 'fatma@koyuncu.com', role: 'SALES', phone: '+90 536 555 66 77', status: 'inactive', lastLogin: '15 Oca 2026, 09:00' },
  { id: 'u7', name: 'David Brown', email: 'david@globalcarpets.com', role: 'VIEWER', phone: '+1 212 555 0199', status: 'active', lastLogin: '27 Oca 2026, 16:45', agency: 'Global Carpets Inc.' },
]

const allPermissions: { key: string; label: string; desc: string }[] = [
  { key: 'view_cost_price', label: 'Maliyet Fiyatı Görme', desc: 'Ürünlerin maliyet fiyatını görebilir' },
  { key: 'view_profit', label: 'Kâr Analizi', desc: 'Kâr raporlarına erişebilir' },
  { key: 'view_all_agencies', label: 'Tüm Acenteler', desc: 'Tüm acentelerin verilerini görebilir' },
  { key: 'manage_users', label: 'Kullanıcı Yönetimi', desc: 'Kullanıcı ekle/düzenle/sil' },
  { key: 'create_invoice', label: 'Fatura Oluşturma', desc: 'Yeni fatura oluşturabilir' },
  { key: 'approve_commission', label: 'Komisyon Onayı', desc: 'Komisyon ödemelerini onaylayabilir' },
  { key: 'view_reports', label: 'Raporlar', desc: 'Raporlara erişebilir' },
  { key: 'edit_stock', label: 'Stok Düzenleme', desc: 'Stok giriş/çıkış yapabilir' },
  { key: 'view_accounting', label: 'Muhasebe', desc: 'Muhasebe modülüne erişebilir' },
  { key: 'view_dashboard_full', label: 'Tam Dashboard', desc: 'Dashboard\'un tüm bileşenlerini görür' },
  { key: 'view_salary_info', label: 'Maaş Bilgileri', desc: 'Çalışan maaş bilgilerini görebilir' },
  { key: 'export_data', label: 'Veri Dışa Aktarma', desc: 'Excel/PDF dışa aktarabilir' },
  { key: 'delete_records', label: 'Kayıt Silme', desc: 'Kayıtları silebilir' },
  { key: 'manage_settings', label: 'Ayar Yönetimi', desc: 'Sistem ayarlarını değiştirebilir' },
]

const rolePermsMap: Record<UserRole, string[]> = {
  OWNER: allPermissions.map(p => p.key),
  ADMIN: allPermissions.map(p => p.key),
  MANAGER: ['view_cost_price','view_profit','view_all_agencies','create_invoice','approve_commission','view_reports','edit_stock','view_accounting','view_dashboard_full','export_data'],
  ACCOUNTANT: ['view_cost_price','view_profit','create_invoice','view_reports','view_accounting','export_data'],
  SALES: ['create_invoice','view_reports'],
  VIEWER: ['view_reports'],
}

const roleColorMap: Record<UserRole, string> = {
  OWNER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MANAGER: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  ACCOUNTANT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SALES: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  VIEWER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

const statusColor = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

export default function SettingsPage() {
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('users')
  const [saved, setSaved] = useState(false)

  const canManage = hasPermission('manage_settings')

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sistem ayarları ve kullanıcı yönetimi</p>
        </div>
        {canManage && (
          <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'Kaydedildi' : 'Kaydet'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-secondary dark:bg-surface-dark-secondary p-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'bg-white dark:bg-surface-dark text-brand-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && <UsersTab canManage={canManage} />}
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'company' && <CompanyTab canManage={canManage} />}
      {activeTab === 'commissions' && <CommissionsTab canManage={canManage} />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'general' && <GeneralTab canManage={canManage} />}
    </motion.div>
  )
}

function UsersTab({ canManage }: { canManage: boolean }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const filtered = demoUsers.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Kullanıcı ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="all">Tüm Roller</option>
          {(Object.entries(roleLabels) as [UserRole, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {canManage && (
          <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
            <Plus className="h-4 w-4" /> Yeni Kullanıcı
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Kullanıcı</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Durum</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Son Giriş</th>
              {canManage && <th className="text-right px-4 py-3 font-medium text-gray-500">İşlemler</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-border/50 dark:border-border-dark/50 last:border-0 hover:bg-surface-secondary/30 dark:hover:bg-surface-dark-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-600 font-bold text-xs">
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-lg px-2 py-1 text-[11px] font-medium ${roleColorMap[u.role]}`}>
                    {roleLabels[u.role]}
                  </span>
                  {u.agency && <p className="text-[10px] text-gray-400 mt-0.5">{u.agency}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-lg px-2 py-1 text-[11px] font-medium ${statusColor[u.status]}`}>
                    {u.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{u.lastLogin}</td>
                {canManage && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded-lg p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RolesTab() {
  const roles: UserRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALES', 'VIEWER']

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Her role ait izinleri aşağıdaki tabloda görebilirsiniz.</p>
      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">İzin</th>
              {roles.map(r => (
                <th key={r} className="px-3 py-3 font-medium text-gray-500 text-center whitespace-nowrap">{roleLabels[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPermissions.map(p => (
              <tr key={p.key} className="border-b border-border/50 dark:border-border-dark/50 last:border-0">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-gray-900 dark:text-white">{p.label}</p>
                  <p className="text-[10px] text-gray-400">{p.desc}</p>
                </td>
                {roles.map(r => (
                  <td key={r} className="px-3 py-2.5 text-center">
                    {rolePermsMap[r].includes(p.key) ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CompanyTab({ canManage }: { canManage: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="h-4 w-4 text-brand-500" /> Firma Bilgileri
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Firma Adı', value: 'Koyuncu Halıcılık Ltd. Şti.', icon: Building2 },
            { label: 'Vergi No', value: '1234567890', icon: Lock },
            { label: 'E-posta', value: 'info@koyuncu.com', icon: Mail },
            { label: 'Telefon', value: '+90 352 222 33 44', icon: Phone },
            { label: 'Kuruluş', value: '1985', icon: Calendar },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
              <input
                type="text"
                defaultValue={f.value}
                disabled={!canManage}
                className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary px-3 py-2 text-sm disabled:opacity-60"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Globe className="h-4 w-4 text-brand-500" /> Adres Bilgileri
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Adres', value: 'Organize Sanayi Bölgesi 5. Cadde No:12' },
            { label: 'İlçe / İl', value: 'Kayseri / Kocasinan' },
            { label: 'Posta Kodu', value: '38070' },
            { label: 'Ülke', value: 'Türkiye' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
              <input
                type="text"
                defaultValue={f.value}
                disabled={!canManage}
                className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary px-3 py-2 text-sm disabled:opacity-60"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CommissionsTab({ canManage }: { canManage: boolean }) {
  const commissionRules = [
    { agency: 'ABC Trading LLC', rate: 8, staffRate: 3, minOrder: '$5,000', status: 'active' },
    { agency: 'Global Carpets Inc.', rate: 7, staffRate: 2.5, minOrder: '$3,000', status: 'active' },
    { agency: 'Desert Home Decor', rate: 10, staffRate: 4, minOrder: '$2,000', status: 'active' },
    { agency: 'European Textiles GmbH', rate: 6, staffRate: 2, minOrder: '$10,000', status: 'inactive' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
          <p className="text-xs text-gray-500">Varsayılan Acente Komisyonu</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">%8</p>
        </div>
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
          <p className="text-xs text-gray-500">Varsayılan Çalışan Komisyonu</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">%3</p>
        </div>
        <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
          <p className="text-xs text-gray-500">Komisyon Ödeme Vadesi</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">30 Gün</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-border-dark">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Acente Komisyon Oranları</h3>
          {canManage && (
            <button className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
              <Plus className="h-3.5 w-3.5" /> Yeni Kural
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-secondary/50 dark:bg-surface-dark-secondary/50 border-b border-border dark:border-border-dark">
              <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Acente</th>
              <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Acente %</th>
              <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Çalışan %</th>
              <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Min. Sipariş</th>
              <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Durum</th>
            </tr>
          </thead>
          <tbody>
            {commissionRules.map(r => (
              <tr key={r.agency} className="border-b border-border/50 dark:border-border-dark/50 last:border-0">
                <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{r.agency}</td>
                <td className="px-4 py-2.5 text-center text-brand-600 font-semibold">%{r.rate}</td>
                <td className="px-4 py-2.5 text-center text-purple-600 font-semibold">%{r.staffRate}</td>
                <td className="px-4 py-2.5 text-center text-gray-500">{r.minOrder}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${r.status === 'active' ? statusColor.active : statusColor.inactive}`}>
                    {r.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [settings, setSettings] = useState({
    orderCreated: true,
    orderDelivered: true,
    paymentDue: true,
    paymentOverdue: true,
    stockLow: true,
    commissionPending: true,
    emailNotif: false,
    soundNotif: true,
  })

  const toggle = (key: keyof typeof settings) => {
    setSettings(s => ({ ...s, [key]: !s[key] }))
  }

  const items = [
    { key: 'orderCreated' as const, label: 'Yeni Sipariş', desc: 'Yeni sipariş oluşturulduğunda bildirim al' },
    { key: 'orderDelivered' as const, label: 'Sipariş Teslimi', desc: 'Sipariş teslim edildiğinde bildirim al' },
    { key: 'paymentDue' as const, label: 'Ödeme Vadesi', desc: 'Ödeme vadesi yaklaştığında uyarı al' },
    { key: 'paymentOverdue' as const, label: 'Gecikmiş Ödeme', desc: 'Vadesi geçmiş ödemeler için uyarı al' },
    { key: 'stockLow' as const, label: 'Düşük Stok', desc: 'Stok minimum seviyenin altına düştüğünde uyarı al' },
    { key: 'commissionPending' as const, label: 'Komisyon Onayı', desc: 'Onay bekleyen komisyonlar için bildirim al' },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark divide-y divide-border dark:divide-border-dark">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings[item.key] ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                settings[item.key] ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Bildirim Kanalları</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-900 dark:text-white">E-posta Bildirimleri</p>
            <p className="text-xs text-gray-500">Önemli olayları e-posta olarak al</p>
          </div>
          <button
            onClick={() => toggle('emailNotif')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.emailNotif ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              settings.emailNotif ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-900 dark:text-white">Sesli Bildirimler</p>
            <p className="text-xs text-gray-500">Bildirim geldiğinde ses çal</p>
          </div>
          <button
            onClick={() => toggle('soundNotif')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.soundNotif ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              settings.soundNotif ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </div>
  )
}

function GeneralTab({ canManage }: { canManage: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Para Birimi & Bölge</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Varsayılan Para Birimi</label>
            <select disabled={!canManage} className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary px-3 py-2 text-sm disabled:opacity-60">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>TRY (₺)</option>
              <option>GBP (£)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Dil</label>
            <select disabled={!canManage} className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary px-3 py-2 text-sm disabled:opacity-60">
              <option>Türkçe</option>
              <option>English</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tarih Formatı</label>
            <select disabled={!canManage} className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary px-3 py-2 text-sm disabled:opacity-60">
              <option>GG.AA.YYYY</option>
              <option>AA/GG/YYYY</option>
              <option>YYYY-AA-GG</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">KDV & Vergi</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Varsayılan KDV Oranı</label>
            <input type="text" defaultValue="20" disabled={!canManage} className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary px-3 py-2 text-sm disabled:opacity-60" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">KDV Dahil Fiyatlama</label>
            <select disabled={!canManage} className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary px-3 py-2 text-sm disabled:opacity-60">
              <option>KDV Hariç</option>
              <option>KDV Dahil</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fatura Seri No Öneki</label>
            <input type="text" defaultValue="KOY" disabled={!canManage} className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary px-3 py-2 text-sm disabled:opacity-60" />
          </div>
        </div>
      </div>
    </div>
  )
}
