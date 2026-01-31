import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Package, Truck, CheckCircle, Clock, DollarSign,
  FileText, User, Building2, Handshake, MapPin, Calendar,
  Phone, Mail, Printer, Download, Edit3, AlertTriangle,
  CreditCard, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const demoOrder = {
  id: 'ORD-2026-0147',
  status: 'shipped',
  priority: 'VIP',
  createdAt: '22 Oca 2026, 14:30',
  updatedAt: '28 Oca 2026, 09:15',
  customer: { name: 'HomeStyle Inc.', contact: 'Sarah Johnson', phone: '+1 312 555 0102', email: 'sarah@homestyle.com', address: '456 Michigan Ave, Chicago, IL 60601' },
  seller: { name: 'Ali Çelik', role: 'Satış Elemanı' },
  agency: { name: 'ABC Trading LLC', contact: 'John Smith', commission: 8, commissionAmount: 4488 },
  agencyStaff: { name: 'Emily Davis', commission: 3, commissionAmount: 1683 },
  currency: 'USD',
  items: [
    { id: 1, product: 'El Dokuma Halı - Kayseri', sku: 'HDK-001', qty: 5, unit: 'm²', unitPrice: 4200, discount: 0, total: 21000 },
    { id: 2, product: 'Bambu Halı - Doğal', sku: 'BHD-003', qty: 20, unit: 'Adet', unitPrice: 890, discount: 5, total: 16910 },
    { id: 3, product: 'İpek Halı - Hereke', sku: 'IHH-007', qty: 2, unit: 'Adet', unitPrice: 9500, discount: 0, total: 19000 },
  ],
  subtotal: 56100,
  discount: 810,
  vat: 20,
  vatAmount: 11058,
  grandTotal: 66348,
  delivery: { method: 'Deniz Yolu', estimatedDate: '15 Şub 2026', trackingNo: 'TRK-2026-8847' },
  payment: { terms: 'Net 30', paid: 33174, remaining: 33174, dueDate: '22 Şub 2026' },
}

const timeline = [
  { date: '22 Oca 2026, 14:30', title: 'Sipariş Oluşturuldu', desc: 'Ali Çelik tarafından oluşturuldu', icon: FileText, color: 'bg-blue-500' },
  { date: '22 Oca 2026, 15:00', title: 'Patron Onayı', desc: 'Ahmet Koyuncu siparişi onayladı', icon: CheckCircle, color: 'bg-green-500' },
  { date: '23 Oca 2026, 09:00', title: 'Fatura Kesildi', desc: 'INV-2026-0089 numaralı fatura oluşturuldu', icon: FileText, color: 'bg-purple-500' },
  { date: '24 Oca 2026, 11:30', title: 'Kısmi Ödeme', desc: '$33,174 tahsilat alındı (Havale)', icon: DollarSign, color: 'bg-emerald-500' },
  { date: '25 Oca 2026, 08:00', title: 'Üretim Başladı', desc: 'Sipariş üretime alındı', icon: Package, color: 'bg-orange-500' },
  { date: '27 Oca 2026, 16:00', title: 'Paketleme', desc: 'Ürünler paketlendi, sevkiyata hazır', icon: Package, color: 'bg-amber-500' },
  { date: '28 Oca 2026, 09:15', title: 'Sevkiyat', desc: 'Kargo firmasına teslim edildi - TRK-2026-8847', icon: Truck, color: 'bg-brand-500' },
]

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Beklemede', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle },
  production: { label: 'Üretimde', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Package },
  shipped: { label: 'Sevk Edildi', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', icon: Truck },
  delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const { hasPermission } = useAuth()
  const canViewCost = hasPermission('view_cost_price')
  const order = demoOrder
  const st = statusConfig[order.status]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/orders" className="rounded-xl p-2 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{order.id}</h1>
              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${st.color}`}>
                <st.icon className="h-3 w-3" /> {st.label}
              </span>
              {order.priority === 'VIP' && (
                <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">VIP</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Oluşturulma: {order.createdAt}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
            <Printer className="h-4 w-4" /> Yazdır
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
            <Edit3 className="h-4 w-4" /> Düzenle
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5">
        <div className="flex items-center justify-between">
          {['Sipariş', 'Onay', 'Üretim', 'Sevkiyat', 'Teslim'].map((step, i) => {
            const stepIndex = ['pending', 'confirmed', 'production', 'shipped', 'delivered'].indexOf(order.status)
            const done = i <= stepIndex
            const current = i === stepIndex
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    done ? 'bg-brand-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  } ${current ? 'ring-4 ring-brand-100 dark:ring-brand-900/30' : ''}`}>
                    {done ? <CheckCircle className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-[11px] mt-1.5 font-medium ${done ? 'text-brand-600' : 'text-gray-400'}`}>{step}</span>
                </div>
                {i < 4 && (
                  <div className={`flex-1 h-0.5 mx-2 mt-[-18px] ${done && i < stepIndex ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Müşteri" icon={Building2}>
              <p className="font-medium text-gray-900 dark:text-white">{order.customer.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><User className="h-3 w-3" />{order.customer.contact}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" />{order.customer.phone}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" />{order.customer.email}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{order.customer.address}</p>
            </InfoCard>
            <InfoCard title="Satış & Acente" icon={Handshake}>
              <p className="text-xs text-gray-500">Satış Elemanı</p>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{order.seller.name}</p>
              <div className="mt-2 pt-2 border-t border-border/50 dark:border-border-dark/50">
                <p className="text-xs text-gray-500">Müşteriyi Getiren Acente</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{order.agency.name}</p>
                <p className="text-xs text-gray-500">İlgili Kişi: {order.agencyStaff.name}</p>
                {canViewCost && (
                  <div className="mt-2 flex gap-3 text-xs">
                    <span className="text-brand-600">Acente: %{order.agency.commission} (${order.agency.commissionAmount.toLocaleString()})</span>
                    <span className="text-purple-600">Çalışan: %{order.agencyStaff.commission} (${order.agencyStaff.commissionAmount.toLocaleString()})</span>
                  </div>
                )}
              </div>
            </InfoCard>
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden">
            <div className="px-5 py-3 border-b border-border dark:border-border-dark">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sipariş Kalemleri</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary/50 dark:bg-surface-dark-secondary/50 border-b border-border dark:border-border-dark">
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">Ürün</th>
                  <th className="text-center px-3 py-2.5 font-medium text-gray-500 text-xs">Miktar</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs">Birim Fiyat</th>
                  <th className="text-center px-3 py-2.5 font-medium text-gray-500 text-xs">İskonto</th>
                  <th className="text-right px-5 py-2.5 font-medium text-gray-500 text-xs">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id} className="border-b border-border/50 dark:border-border-dark/50 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{item.product}</p>
                      <p className="text-[11px] text-gray-400">{item.sku}</p>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{item.qty} {item.unit}</td>
                    <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">${item.unitPrice.toLocaleString()}</td>
                    <td className="px-3 py-3 text-center">{item.discount > 0 ? <span className="text-red-500">%{item.discount}</span> : '-'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">${item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface-secondary/30 dark:bg-surface-dark-secondary/30">
                <tr className="border-t border-border dark:border-border-dark">
                  <td colSpan={4} className="px-5 py-2 text-right text-xs text-gray-500">Ara Toplam</td>
                  <td className="px-5 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">${order.subtotal.toLocaleString()}</td>
                </tr>
                {order.discount > 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-2 text-right text-xs text-red-500">İskonto</td>
                    <td className="px-5 py-2 text-right text-sm font-medium text-red-500">-${order.discount.toLocaleString()}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="px-5 py-2 text-right text-xs text-gray-500">KDV (%{order.vat})</td>
                  <td className="px-5 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">${order.vatAmount.toLocaleString()}</td>
                </tr>
                <tr className="border-t border-border dark:border-border-dark">
                  <td colSpan={4} className="px-5 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Genel Toplam</td>
                  <td className="px-5 py-3 text-right text-lg font-bold text-brand-600">${order.grandTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Delivery & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Teslimat" icon={Truck}>
              <div className="space-y-1.5 text-sm">
                <Row label="Yöntem" value={order.delivery.method} />
                <Row label="Tahmini Tarih" value={order.delivery.estimatedDate} />
                <Row label="Takip No" value={order.delivery.trackingNo} />
              </div>
            </InfoCard>
            <InfoCard title="Ödeme" icon={CreditCard}>
              <div className="space-y-1.5 text-sm">
                <Row label="Vade" value={order.payment.terms} />
                <Row label="Ödenen" value={`$${order.payment.paid.toLocaleString()}`} valueClass="text-green-600" />
                <Row label="Kalan" value={`$${order.payment.remaining.toLocaleString()}`} valueClass="text-red-500" />
                <Row label="Son Ödeme" value={order.payment.dueDate} />
              </div>
              <div className="mt-3">
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: `${(order.payment.paid / order.grandTotal) * 100}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{Math.round((order.payment.paid / order.grandTotal) * 100)}% ödendi</p>
              </div>
            </InfoCard>
          </div>
        </div>

        {/* Right: Timeline */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Sipariş Zaman Çizelgesi</h3>
            <div className="relative space-y-0">
              {timeline.map((event, i) => (
                <div key={i} className="relative flex gap-3 pb-6 last:pb-0">
                  {i < timeline.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                  )}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${event.color} text-white z-10`}>
                    <event.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{event.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{event.desc}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Özet</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Kalem Sayısı</span>
                <span className="font-medium text-gray-900 dark:text-white">{order.items.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Toplam Miktar</span>
                <span className="font-medium text-gray-900 dark:text-white">{order.items.reduce((s, i) => s + i.qty, 0)} adet</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Para Birimi</span>
                <span className="font-medium text-gray-900 dark:text-white">{order.currency}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Son Güncelleme</span>
                <span className="font-medium text-gray-900 dark:text-white">{order.updatedAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function InfoCard({ title, icon: Icon, children }: { title: string; icon: typeof Building2; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
      <h3 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-3">
        <Icon className="h-3.5 w-3.5 text-brand-500" /> {title}
      </h3>
      {children}
    </div>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-medium ${valueClass || 'text-gray-900 dark:text-white'}`}>{value}</span>
    </div>
  )
}
