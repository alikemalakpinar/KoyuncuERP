/**
 * Account Detail Page — Cari Detay
 * Tabs: Genel, Ekstre, Siparişler, Faturalar, Adresler, E-Posta
 */

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Building2, Globe, Phone, Mail, MapPin,
  ShoppingCart, FileText, CreditCard, TrendingUp,
  AlertTriangle, Shield, Clock, ChevronRight,
  ArrowUpRight, ArrowDownRight, DollarSign, Users,
  UserCheck, Calendar, Send, Plus, Edit3, Trash2,
  Copy, CheckCircle, Star, Warehouse, Home, Briefcase,
  Tag, X,
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from 'recharts'
import { useAccountsQuery, useAccountHealthQuery, useAccountStatement } from '../hooks/useIpc'

// ── Tabs ───────────────────────────────────────────────────
const tabs = [
  { id: 'overview', label: 'Genel', icon: Building2 },
  { id: 'ledger', label: 'Ekstre', icon: FileText },
  { id: 'orders', label: 'Siparişler', icon: ShoppingCart },
  { id: 'invoices', label: 'Faturalar', icon: FileText },
  { id: 'addresses', label: 'Adresler', icon: MapPin },
  { id: 'emails', label: 'E-Posta', icon: Mail },
] as const
type TabId = (typeof tabs)[number]['id']

// ── Address Types ───────────────────────────────────────────
type AddressType = 'BILLING' | 'SHIPPING' | 'WAREHOUSE' | 'HEAD_OFFICE'
interface Address {
  id: string
  type: AddressType
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  country: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  isDefault: boolean
  notes?: string
}

const addressTypeConfig: Record<AddressType, { label: string; icon: typeof Home; color: string }> = {
  HEAD_OFFICE: { label: 'Merkez Ofis', icon: Building2, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/15' },
  BILLING: { label: 'Fatura Adresi', icon: Briefcase, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/15' },
  SHIPPING: { label: 'Sevkiyat Adresi', icon: MapPin, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15' },
  WAREHOUSE: { label: 'Depo', icon: Warehouse, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/15' },
}

// ── Demo Addresses ──────────────────────────────────────────
const demoAddresses: Address[] = [
  {
    id: 'addr1', type: 'HEAD_OFFICE', label: 'Merkez Ofis',
    line1: '350 Fifth Avenue, Suite 4800', city: 'New York', state: 'NY', zip: '10118', country: 'US',
    contactPerson: 'Sarah Johnson', contactPhone: '+1 (212) 555-0198', contactEmail: 'sarah@homestyle-inc.com',
    isDefault: true, notes: 'Ana iletişim adresi',
  },
  {
    id: 'addr2', type: 'SHIPPING', label: 'Ana Depo — Newark',
    line1: '1200 Port Newark Blvd', line2: 'Building C, Dock 7', city: 'Newark', state: 'NJ', zip: '07114', country: 'US',
    contactPerson: 'Mike Thompson', contactPhone: '+1 (973) 555-0234', contactEmail: 'warehouse@homestyle-inc.com',
    isDefault: true, notes: 'Hafta içi 08:00-17:00. Randevulu teslimat.',
  },
  {
    id: 'addr3', type: 'SHIPPING', label: 'West Coast Depo',
    line1: '2500 E Carson St', city: 'Long Beach', state: 'CA', zip: '90810', country: 'US',
    contactPerson: 'Carlos Rivera', contactPhone: '+1 (310) 555-0187',
    isDefault: false,
  },
  {
    id: 'addr4', type: 'BILLING', label: 'Muhasebe Departmanı',
    line1: '350 Fifth Avenue, Suite 4800', city: 'New York', state: 'NY', zip: '10118', country: 'US',
    contactPerson: 'Linda Chen', contactPhone: '+1 (212) 555-0199', contactEmail: 'accounts@homestyle-inc.com',
    isDefault: true,
  },
  {
    id: 'addr5', type: 'WAREHOUSE', label: 'Showroom',
    line1: '120 Wooster St', city: 'New York', state: 'NY', zip: '10012', country: 'US',
    contactPerson: 'Emily Davis', contactPhone: '+1 (212) 555-0210',
    isDefault: false, notes: 'SoHo showroom, sadece numune gönderimleri',
  },
]

// ── Email Templates ─────────────────────────────────────────
interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: 'quotation' | 'order' | 'payment' | 'shipment' | 'general'
}

const emailTemplates: EmailTemplate[] = [
  { id: 't1', name: 'Teklif Gönderimi', category: 'quotation',
    subject: 'Koyuncu Halı — Teklif #{ref}',
    body: 'Sayın {contact},\n\n{ref} numaralı teklifimizi ekte bilgilerinize sunarız.\n\nTeklif geçerlilik süresi: 30 gündür.\nÖdeme koşulları: {terms}\n\nSorularınız için bizimle iletişime geçmekten çekinmeyin.\n\nSaygılarımızla,\nKoyuncu Halı',
  },
  { id: 't2', name: 'Sipariş Onayı', category: 'order',
    subject: 'Sipariş Onayı — {ref}',
    body: 'Sayın {contact},\n\n{ref} numaralı siparişiniz onaylanmıştır.\n\nTahmini üretim süresi: 4-6 hafta\nSevkiyat yöntemi: {method}\n\nSipariş detaylarınız ekte yer almaktadır.\n\nSaygılarımızla,\nKoyuncu Halı',
  },
  { id: 't3', name: 'Sevkiyat Bildirimi', category: 'shipment',
    subject: 'Sevkiyat Bildirimi — {ref}',
    body: 'Sayın {contact},\n\n{ref} numaralı siparişiniz sevk edilmiştir.\n\nTakip No: {tracking}\nTahmini Varış: {eta}\nGemi/Araç: {vessel}\n\nBelgeler ekte sunulmuştur.\n\nSaygılarımızla,\nKoyuncu Halı',
  },
  { id: 't4', name: 'Ödeme Hatırlatma', category: 'payment',
    subject: 'Ödeme Hatırlatma — Fatura #{ref}',
    body: 'Sayın {contact},\n\n{ref} numaralı faturanızın vade tarihi {dueDate} olup henüz ödeme kaydı bulunmamaktadır.\n\nFatura Tutarı: {amount}\nKalan Bakiye: {balance}\n\nÖdemenizi en kısa sürede yapmanızı rica ederiz.\n\nSaygılarımızla,\nKoyuncu Halı Muhasebe',
  },
  { id: 't5', name: 'Genel Bilgilendirme', category: 'general',
    subject: 'Koyuncu Halı — Bilgilendirme',
    body: 'Sayın {contact},\n\n\n\nSaygılarımızla,\nKoyuncu Halı',
  },
]

// ── Demo Email History ──────────────────────────────────────
interface SentEmail {
  id: string
  to: string
  subject: string
  templateName: string
  sentAt: string
  sentBy: string
  status: 'delivered' | 'opened' | 'bounced'
}

const demoEmails: SentEmail[] = [
  { id: 'e1', to: 'sarah@homestyle-inc.com', subject: 'Sipariş Onayı — ORD-2026-0152', templateName: 'Sipariş Onayı', sentAt: '2026-01-28 10:30', sentBy: 'Ahmet K.', status: 'opened' },
  { id: 'e2', to: 'accounts@homestyle-inc.com', subject: 'Ödeme Hatırlatma — Fatura #INV-2026-0185', templateName: 'Ödeme Hatırlatma', sentAt: '2026-01-20 14:15', sentBy: 'Zeynep D.', status: 'delivered' },
  { id: 'e3', to: 'sarah@homestyle-inc.com', subject: 'Sevkiyat Bildirimi — SHP-2026-0089', templateName: 'Sevkiyat Bildirimi', sentAt: '2026-01-18 09:45', sentBy: 'Murat Y.', status: 'opened' },
  { id: 'e4', to: 'sarah@homestyle-inc.com', subject: 'Koyuncu Halı — Teklif #QUO-2026-0034', templateName: 'Teklif Gönderimi', sentAt: '2026-01-10 16:20', sentBy: 'Ahmet K.', status: 'opened' },
  { id: 'e5', to: 'warehouse@homestyle-inc.com', subject: 'Sevkiyat Bildirimi — SHP-2026-0085', templateName: 'Sevkiyat Bildirimi', sentAt: '2025-12-28 11:00', sentBy: 'Murat Y.', status: 'delivered' },
]

const emailStatusConfig = {
  delivered: { label: 'Teslim Edildi', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/15' },
  opened: { label: 'Okundu', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15' },
  bounced: { label: 'Hata', color: 'text-red-600 bg-red-50 dark:bg-red-900/15' },
}

// ── Demo Ledger ─────────────────────────────────────────────
const demoLedger = [
  { id: 'l1', date: '2026-01-28', type: 'INVOICE' as const, ref: 'INV-2026-0198', desc: 'Satış Faturası', debit: 34200, credit: 0, balance: 48250 },
  { id: 'l2', date: '2026-01-22', type: 'PAYMENT' as const, ref: 'PAY-2026-0089', desc: 'Banka Havalesi (Garanti)', debit: 0, credit: 45000, balance: 14050 },
  { id: 'l3', date: '2026-01-15', type: 'INVOICE' as const, ref: 'INV-2026-0185', desc: 'Satış Faturası', debit: 28400, credit: 0, balance: 59050 },
  { id: 'l4', date: '2026-01-08', type: 'PAYMENT' as const, ref: 'PAY-2026-0076', desc: 'Banka Havalesi (Ziraat)', debit: 0, credit: 30000, balance: 30650 },
  { id: 'l5', date: '2025-12-28', type: 'INVOICE' as const, ref: 'INV-2026-0170', desc: 'Satış Faturası', debit: 42500, credit: 0, balance: 60650 },
  { id: 'l6', date: '2025-12-20', type: 'DEBIT_NOTE' as const, ref: 'DN-2025-0012', desc: 'Kur Farkı Borç Dekontu', debit: 1850, credit: 0, balance: 18150 },
  { id: 'l7', date: '2025-12-15', type: 'PAYMENT' as const, ref: 'PAY-2026-0065', desc: 'Çek Tahsilatı', debit: 0, credit: 25000, balance: 16300 },
  { id: 'l8', date: '2025-12-10', type: 'INVOICE' as const, ref: 'INV-2026-0158', desc: 'Satış Faturası', debit: 18200, credit: 0, balance: 41300 },
]

const demoOrders = [
  { id: 'o1', orderNo: 'ORD-2026-0152', date: '2026-01-28', status: 'CONFIRMED', total: '$34,200', items: 6 },
  { id: 'o2', orderNo: 'ORD-2026-0140', date: '2026-01-15', status: 'SHIPPED', total: '$28,400', items: 4 },
  { id: 'o3', orderNo: 'ORD-2026-0128', date: '2025-12-28', status: 'DELIVERED', total: '$42,500', items: 8 },
  { id: 'o4', orderNo: 'ORD-2026-0115', date: '2025-12-10', status: 'DELIVERED', total: '$18,200', items: 3 },
  { id: 'o5', orderNo: 'ORD-2025-0098', date: '2025-11-20', status: 'DELIVERED', total: '$22,800', items: 5 },
]

const demoInvoices = [
  { id: 'i1', invoiceNo: 'INV-2026-0198', date: '2026-01-28', dueDate: '2026-02-27', status: 'SENT', total: '$34,200' },
  { id: 'i2', invoiceNo: 'INV-2026-0185', date: '2026-01-15', dueDate: '2026-02-14', status: 'PAID', total: '$28,400' },
  { id: 'i3', invoiceNo: 'INV-2026-0170', date: '2025-12-28', dueDate: '2026-01-27', status: 'PAID', total: '$42,500' },
  { id: 'i4', invoiceNo: 'INV-2026-0158', date: '2025-12-10', dueDate: '2026-01-09', status: 'PAID', total: '$18,200' },
]

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  CONFIRMED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  IN_PRODUCTION: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  SHIPPED: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  DELIVERED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  SENT: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  PAID: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  OVERDUE: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak', CONFIRMED: 'Onaylı', IN_PRODUCTION: 'Üretimde',
  SHIPPED: 'Sevk Edildi', DELIVERED: 'Teslim', SENT: 'Gönderildi',
  PAID: 'Ödendi', OVERDUE: 'Vadesi Geçmiş',
}

const typeIcons: Record<string, typeof Building2> = {
  CUSTOMER: Building2, SUPPLIER: Globe, AGENCY: UserCheck, BOTH: Users,
}
const typeLabels: Record<string, string> = {
  CUSTOMER: 'Müşteri', SUPPLIER: 'Tedarikçi', AGENCY: 'Acente', BOTH: 'Müşteri/Tedarikçi',
}

const monthlyRevenue = [
  { month: 'Ağu', revenue: 22000, collection: 18000 },
  { month: 'Eyl', revenue: 38000, collection: 32000 },
  { month: 'Eki', revenue: 28000, collection: 35000 },
  { month: 'Kas', revenue: 42000, collection: 25000 },
  { month: 'Ara', revenue: 62500, collection: 55000 },
  { month: 'Oca', revenue: 62600, collection: 75000 },
]

const categoryColors: Record<string, string> = {
  quotation: 'bg-blue-50 text-blue-700 dark:bg-blue-900/15 dark:text-blue-300',
  order: 'bg-brand-50 text-brand-700 dark:bg-brand-900/15 dark:text-brand-300',
  payment: 'bg-amber-50 text-amber-700 dark:bg-amber-900/15 dark:text-amber-300',
  shipment: 'bg-purple-50 text-purple-700 dark:bg-purple-900/15 dark:text-purple-300',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}
const categoryLabels: Record<string, string> = {
  quotation: 'Teklif', order: 'Sipariş', payment: 'Ödeme', shipment: 'Sevkiyat', general: 'Genel',
}

// ══════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════
export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [showComposer, setShowComposer] = useState(false)
  const [composerTemplate, setComposerTemplate] = useState<EmailTemplate | null>(null)
  const [statementFrom, setStatementFrom] = useState('')
  const [statementTo, setStatementTo] = useState('')
  const { data: accounts = [] } = useAccountsQuery()
  const { data: health } = useAccountHealthQuery(id ?? null)
  const { data: statement, isLoading: statementLoading } = useAccountStatement(id ?? '', statementFrom || undefined, statementTo || undefined)

  const account = useMemo(() => accounts.find((a: any) => a.id === id), [accounts, id])

  // Collect all emails from addresses for compose
  const allEmails = useMemo(() => {
    const emails: string[] = []
    demoAddresses.forEach(a => { if (a.contactEmail) emails.push(a.contactEmail) })
    return [...new Set(emails)]
  }, [])

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Building2 className="h-12 w-12 mb-3" />
        <p className="text-sm">Cari bulunamadı</p>
        <button onClick={() => navigate('/accounts')} className="mt-3 text-brand-600 text-sm font-medium">← Carilere Dön</button>
      </div>
    )
  }

  const TypeIcon = typeIcons[account.type] || Building2
  const riskUsed = parseFloat(account.balance.replace(/,/g, ''))
  const riskLimit = parseFloat(account.riskLimit.replace(/,/g, ''))
  const riskPct = riskLimit > 0 ? Math.round((riskUsed / riskLimit) * 100) : 0
  const isRiskHigh = riskPct > 80
  const totalDebit = demoLedger.reduce((s, l) => s + l.debit, 0)
  const totalCredit = demoLedger.reduce((s, l) => s + l.credit, 0)

  const openComposer = (template?: EmailTemplate) => {
    setComposerTemplate(template || null)
    setShowComposer(true)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/accounts')} className="mt-1 rounded-xl p-2 text-gray-400 hover:text-gray-600 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/15">
              <TypeIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{account.name}</h1>
              <div className="flex items-center gap-2 text-[12px] text-gray-500">
                <span className="font-medium text-gray-400">{account.code}</span>
                <span>·</span>
                <span>{typeLabels[account.type]}</span>
                <span>·</span>
                <MapPin className="h-3 w-3" />
                <span>{account.city}, {account.country === 'US' ? 'ABD' : account.country}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <button onClick={() => openComposer()} className="flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark px-3 py-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
            <Mail className="h-3.5 w-3.5" />
            E-Posta Gönder
          </button>
          <div className="h-8 w-px bg-border dark:bg-border-dark" />
          <div className="text-right">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Bakiye</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">${account.balance}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Risk</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">${account.riskLimit}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border dark:border-border-dark overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              activeTab === tab.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.id === 'addresses' && <span className="text-[10px] text-gray-400 ml-0.5">({demoAddresses.length})</span>}
            {tab.id === 'emails' && <span className="text-[10px] text-gray-400 ml-0.5">({demoEmails.length})</span>}
            {activeTab === tab.id && (
              <motion.div layoutId="account-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ─── OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Toplam Sipariş', value: String(demoOrders.length), icon: ShoppingCart, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/15' },
                  { label: 'Açık Bakiye', value: `$${account.balance}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15' },
                  { label: 'Adres Sayısı', value: String(demoAddresses.length), icon: MapPin, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/15' },
                  { label: 'Risk Kullanım', value: `%${riskPct}`, icon: Shield, color: isRiskHigh ? 'text-red-600 bg-red-50 dark:bg-red-900/15' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/15' },
                ].map((kpi) => (
                  <div key={kpi.label} className="card p-4 flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${kpi.color}`}>
                      <kpi.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 uppercase">{kpi.label}</p>
                      <p className="text-[16px] font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card p-5">
                <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-4">Aylık Ciro & Tahsilat</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#868e96' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#868e96' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: 12, border: '1px solid #e9ecef', fontSize: 12 }} />
                      <Bar dataKey="revenue" name="Ciro" fill="#4c6ef5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="collection" name="Tahsilat" fill="#40c057" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border dark:border-border-dark">
                  <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Son Hareketler</h3>
                  <button onClick={() => setActiveTab('ledger')} className="text-[11px] text-brand-600 font-medium flex items-center gap-1">
                    Tümünü Gör <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <table className="w-full text-[12px]">
                  <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
                    {demoLedger.slice(0, 4).map((entry) => (
                      <tr key={entry.id} className="hover:bg-surface-secondary/40 dark:hover:bg-surface-dark-tertiary/40 transition-colors">
                        <td className="px-5 py-2.5 text-gray-400 tabular-nums">{new Date(entry.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-medium text-gray-900 dark:text-white">{entry.ref}</span>
                          <p className="text-[10px] text-gray-400">{entry.desc}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {entry.debit > 0 && <span className="text-red-500 font-medium">${entry.debit.toLocaleString()}</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {entry.credit > 0 && <span className="text-emerald-600 font-medium">${entry.credit.toLocaleString()}</span>}
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums font-semibold text-gray-900 dark:text-white">${entry.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="card p-5">
                <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-3">Risk Durumu</h3>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-[11px] text-gray-500">Kullanılan: ${account.balance}</span>
                  <span className="text-[11px] text-gray-500">Limit: ${account.riskLimit}</span>
                </div>
                <div className="h-3 rounded-full bg-surface-secondary dark:bg-surface-dark-tertiary overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(riskPct, 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${isRiskHigh ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-brand-400 to-brand-600'}`} />
                </div>
                <p className={`text-right text-[11px] font-bold mt-1 ${isRiskHigh ? 'text-red-500' : 'text-brand-600'}`}>%{riskPct}</p>
              </div>

              {/* Default Addresses Preview */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Varsayılan Adresler</h3>
                  <button onClick={() => setActiveTab('addresses')} className="text-[11px] text-brand-600 font-medium">Tümü →</button>
                </div>
                <div className="space-y-3">
                  {demoAddresses.filter(a => a.isDefault).slice(0, 3).map((addr) => {
                    const cfg = addressTypeConfig[addr.type]
                    return (
                      <div key={addr.id} className="flex items-start gap-2.5">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                          <cfg.icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-gray-900 dark:text-white">{cfg.label}</p>
                          <p className="text-[10px] text-gray-400 truncate">{addr.line1}</p>
                          <p className="text-[10px] text-gray-400">{addr.city}, {addr.state} {addr.zip}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white mb-3">Ödeme Koşulları</h3>
                <div className="space-y-2">
                  {[
                    { l: 'Vade Süresi', v: `${account.paymentTermDays} gün` },
                    { l: 'Para Birimi', v: 'USD' },
                    { l: 'Son Sipariş', v: new Date(account.lastOrderDate).toLocaleDateString('tr-TR') },
                    { l: 'Durum', v: account.isActive ? 'Aktif' : 'Pasif', color: account.isActive ? 'text-emerald-600' : 'text-red-500' },
                  ].map(row => (
                    <div key={row.l} className="flex justify-between text-[12px]">
                      <span className="text-gray-500">{row.l}</span>
                      <span className={`font-medium ${row.color || 'text-gray-900 dark:text-white'}`}>{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── LEDGER ─── */}
        {activeTab === 'ledger' && (
          <motion.div key="ledger" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Date Filters */}
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[10px] font-medium text-gray-400 uppercase">Başlangıç</label>
                <input type="date" value={statementFrom} onChange={(e) => setStatementFrom(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-400 uppercase">Bitiş</label>
                <input type="date" value={statementTo} onChange={(e) => setStatementTo(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              {(statementFrom || statementTo) && (
                <button onClick={() => { setStatementFrom(''); setStatementTo('') }}
                  className="mt-5 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="card p-4 text-center">
                <p className="text-[10px] font-medium text-gray-400 uppercase">Açılış Bakiye</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">${statement?.openingBalance ? Number(statement.openingBalance).toLocaleString() : '0'}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-[10px] font-medium text-gray-400 uppercase">Toplam Borç</p>
                <p className="text-lg font-bold text-red-500">${statement?.totalDebit ? Number(statement.totalDebit).toLocaleString() : totalDebit.toLocaleString()}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-[10px] font-medium text-gray-400 uppercase">Toplam Alacak</p>
                <p className="text-lg font-bold text-emerald-600">${statement?.totalCredit ? Number(statement.totalCredit).toLocaleString() : totalCredit.toLocaleString()}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-[10px] font-medium text-gray-400 uppercase">Kapanış Bakiye</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">${statement?.closingBalance ? Number(statement.closingBalance).toLocaleString() : account.balance}</p>
              </div>
            </div>

            {/* Entries */}
            <div className="card overflow-hidden">
              {statementLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
                      <th className="text-left font-medium text-gray-400 px-5 py-2.5">Tarih</th>
                      <th className="text-left font-medium text-gray-400 px-3 py-2.5">Referans</th>
                      <th className="text-left font-medium text-gray-400 px-3 py-2.5">Açıklama</th>
                      <th className="text-right font-medium text-red-400 px-3 py-2.5">Borç</th>
                      <th className="text-right font-medium text-emerald-500 px-3 py-2.5">Alacak</th>
                      <th className="text-right font-medium text-gray-400 px-5 py-2.5">Bakiye</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
                    {(statement?.entries ?? demoLedger).map((entry: any) => {
                      const debit = Number(entry.debit ?? 0)
                      const credit = Number(entry.credit ?? 0)
                      const balance = Number(entry.balance ?? 0)
                      return (
                        <tr key={entry.id} className="hover:bg-surface-secondary/40 dark:hover:bg-surface-dark-tertiary/40 transition-colors">
                          <td className="px-5 py-2.5 text-gray-500 tabular-nums">{new Date(entry.createdAt ?? entry.date).toLocaleDateString('tr-TR')}</td>
                          <td className="px-3 py-2.5"><span className="font-medium text-brand-600 dark:text-brand-400">{entry.entryNo ?? entry.ref ?? ''}</span></td>
                          <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{entry.description ?? entry.desc ?? ''}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{debit > 0 ? <span className="text-red-500 font-medium">${debit.toLocaleString()}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{credit > 0 ? <span className="text-emerald-600 font-medium">${credit.toLocaleString()}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                          <td className="px-5 py-2.5 text-right tabular-nums font-semibold text-gray-900 dark:text-white">${balance.toLocaleString()}</td>
                        </tr>
                      )
                    })}
                    {(!statement?.entries && demoLedger.length === 0) && (
                      <tr><td colSpan={6} className="text-center py-10 text-gray-400">Ekstre kaydı bulunamadı</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── ORDERS ─── */}
        {activeTab === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
                    <th className="text-left font-medium text-gray-400 px-5 py-2.5">Sipariş No</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Tarih</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Durum</th>
                    <th className="text-right font-medium text-gray-400 px-3 py-2.5">Kalem</th>
                    <th className="text-right font-medium text-gray-400 px-5 py-2.5">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
                  {demoOrders.map((order) => (
                    <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="hover:bg-surface-secondary/40 dark:hover:bg-surface-dark-tertiary/40 transition-colors cursor-pointer">
                      <td className="px-5 py-2.5 font-medium text-brand-600 dark:text-brand-400">{order.orderNo}</td>
                      <td className="px-3 py-2.5 text-gray-500 tabular-nums">{new Date(order.date).toLocaleDateString('tr-TR')}</td>
                      <td className="px-3 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusColors[order.status] ?? ''}`}>{statusLabels[order.status] ?? order.status}</span></td>
                      <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">{order.items}</td>
                      <td className="px-5 py-2.5 text-right font-semibold text-gray-900 dark:text-white tabular-nums">{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ─── INVOICES ─── */}
        {activeTab === 'invoices' && (
          <motion.div key="invoices" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
                    <th className="text-left font-medium text-gray-400 px-5 py-2.5">Fatura No</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Tarih</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Vade</th>
                    <th className="text-left font-medium text-gray-400 px-3 py-2.5">Durum</th>
                    <th className="text-right font-medium text-gray-400 px-5 py-2.5">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 dark:divide-border-dark/30">
                  {demoInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-secondary/40 dark:hover:bg-surface-dark-tertiary/40 transition-colors">
                      <td className="px-5 py-2.5 font-medium text-brand-600 dark:text-brand-400">{inv.invoiceNo}</td>
                      <td className="px-3 py-2.5 text-gray-500 tabular-nums">{new Date(inv.date).toLocaleDateString('tr-TR')}</td>
                      <td className="px-3 py-2.5 text-gray-500 tabular-nums">{new Date(inv.dueDate).toLocaleDateString('tr-TR')}</td>
                      <td className="px-3 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusColors[inv.status] ?? ''}`}>{statusLabels[inv.status] ?? inv.status}</span></td>
                      <td className="px-5 py-2.5 text-right font-semibold text-gray-900 dark:text-white tabular-nums">{inv.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ─── ADDRESSES ─── */}
        {activeTab === 'addresses' && (
          <motion.div key="addresses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-gray-500">{demoAddresses.length} kayıtlı adres</p>
              <button className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Yeni Adres
              </button>
            </div>

            {/* Address Type Filter */}
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(addressTypeConfig) as [AddressType, typeof addressTypeConfig.BILLING][]).map(([key, cfg]) => {
                const count = demoAddresses.filter(a => a.type === key).length
                if (count === 0) return null
                return (
                  <span key={key} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium ${cfg.color}`}>
                    <cfg.icon className="h-3 w-3" />
                    {cfg.label} ({count})
                  </span>
                )
              })}
            </div>

            {/* Address Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {demoAddresses.map((addr) => {
                const cfg = addressTypeConfig[addr.type]
                return (
                  <div key={addr.id} className="card p-5 relative group">
                    {/* Actions */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="rounded-lg p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/15 transition-colors" title="Düzenle">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded-lg p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/15 transition-colors" title="Kopyala">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Header */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                        <cfg.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[13px] font-semibold text-gray-900 dark:text-white">{addr.label}</h4>
                          {addr.isDefault && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 dark:bg-amber-900/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              <Star className="h-2.5 w-2.5" /> VARSAYILAN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">{cfg.label}</p>
                      </div>
                    </div>

                    {/* Address Lines */}
                    <div className="space-y-1 mb-3 pl-10">
                      <p className="text-[12px] text-gray-700 dark:text-gray-300">{addr.line1}</p>
                      {addr.line2 && <p className="text-[12px] text-gray-500">{addr.line2}</p>}
                      <p className="text-[12px] text-gray-700 dark:text-gray-300">
                        {addr.city}, {addr.state} {addr.zip}
                      </p>
                      <p className="text-[12px] text-gray-500">{addr.country === 'US' ? 'Amerika Birleşik Devletleri' : addr.country}</p>
                    </div>

                    {/* Contact Person */}
                    {addr.contactPerson && (
                      <div className="border-t border-border/50 dark:border-border-dark/50 pt-3 pl-10 space-y-1.5">
                        <div className="flex items-center gap-2 text-[11px]">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">{addr.contactPerson}</span>
                        </div>
                        {addr.contactPhone && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-500">{addr.contactPhone}</span>
                          </div>
                        )}
                        {addr.contactEmail && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <button onClick={() => openComposer()} className="text-brand-600 dark:text-brand-400 hover:underline">
                              {addr.contactEmail}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {addr.notes && (
                      <div className="mt-3 pl-10">
                        <p className="text-[10px] text-gray-400 italic">{addr.notes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ─── EMAILS ─── */}
        {activeTab === 'emails' && (
          <motion.div key="emails" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Header + Compose Button */}
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-gray-500">{demoEmails.length} gönderilmiş e-posta</p>
              <button onClick={() => openComposer()} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors">
                <Send className="h-3.5 w-3.5" /> Yeni E-Posta
              </button>
            </div>

            {/* Quick Templates */}
            <div className="card p-4">
              <h3 className="text-[12px] font-semibold text-gray-900 dark:text-white mb-3">Hazır Şablonlar</h3>
              <div className="flex gap-2 flex-wrap">
                {emailTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => openComposer(tmpl)}
                    className="flex items-center gap-1.5 rounded-lg border border-border dark:border-border-dark px-2.5 py-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary hover:-translate-y-0.5 transition-all"
                  >
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${categoryColors[tmpl.category]}`}>
                      {categoryLabels[tmpl.category]}
                    </span>
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Email History */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-border dark:border-border-dark">
                <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Gönderim Geçmişi</h3>
              </div>
              <div className="divide-y divide-border/30 dark:divide-border-dark/30">
                {demoEmails.map((email) => {
                  const sc = emailStatusConfig[email.status]
                  return (
                    <div key={email.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-secondary/40 dark:hover:bg-surface-dark-tertiary/40 transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary dark:bg-surface-dark-tertiary">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-900 dark:text-white truncate">{email.subject}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                          <span>{email.to}</span>
                          <span>·</span>
                          <span>{email.templateName}</span>
                          <span>·</span>
                          <span>{email.sentBy}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${sc.color}`}>
                          {email.status === 'opened' && <CheckCircle className="h-2.5 w-2.5" />}
                          {sc.label}
                        </span>
                        <span className="text-[10px] text-gray-400 tabular-nums">{email.sentAt.split(' ')[0]}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Email Composer Modal ─── */}
      <AnimatePresence>
        {showComposer && (
          <EmailComposerModal
            accountName={account.name}
            emails={allEmails}
            template={composerTemplate}
            onClose={() => { setShowComposer(false); setComposerTemplate(null) }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════
// Email Composer Modal
// ══════════════════════════════════════════════════════════════
function EmailComposerModal({ accountName, emails, template, onClose }: {
  accountName: string
  emails: string[]
  template: EmailTemplate | null
  onClose: () => void
}) {
  const [to, setTo] = useState(emails[0] || '')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState(template?.subject || '')
  const [body, setBody] = useState(template?.body || '')
  const [selectedTemplate, setSelectedTemplate] = useState<string>(template?.id || '')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleTemplateChange = (templateId: string) => {
    const tmpl = emailTemplates.find(t => t.id === templateId)
    if (tmpl) {
      setSelectedTemplate(templateId)
      setSubject(tmpl.subject)
      setBody(tmpl.body)
    }
  }

  const handleSend = () => {
    setSending(true)
    // Simulate sending
    setTimeout(() => {
      setSending(false)
      setSent(true)
      setTimeout(onClose, 1200)
    }, 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border dark:border-border-dark px-6 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">E-Posta Oluştur</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">{accountName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
            </motion.div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">E-Posta Gönderildi</p>
            <p className="text-sm text-gray-500 mt-1">{to} adresine gönderildi</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Template Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Şablon</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-[13px]"
              >
                <option value="">Boş e-posta</option>
                {emailTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({categoryLabels[t.category]})</option>
                ))}
              </select>
            </div>

            {/* To */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Alıcı</label>
              <select value={to} onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-[13px]"
              >
                {emails.map(email => (
                  <option key={email} value={email}>{email}</option>
                ))}
              </select>
            </div>

            {/* CC */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">CC (Opsiyonel)</label>
              <input
                type="email" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc@ornek.com"
                className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-[13px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Konu</label>
              <input
                type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="E-posta konusu"
                className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-[13px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">İçerik</label>
              <textarea
                value={body} onChange={(e) => setBody(e.target.value)} rows={10}
                className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-[13px] resize-none outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 leading-relaxed"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Değişkenler: {'{contact}'} {'{ref}'} {'{amount}'} {'{dueDate}'} {'{terms}'} {'{tracking}'} {'{eta}'} {'{vessel}'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-border dark:border-border-dark pt-4">
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <Tag className="h-3.5 w-3.5" />
                <span>Ek dosya eklemek için sürükleyip bırakın</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border dark:border-border-dark text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
                  İptal
                </button>
                <button
                  onClick={handleSend}
                  disabled={!to || !subject || sending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {sending ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
