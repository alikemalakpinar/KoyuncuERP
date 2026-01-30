import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Plus, Search, Filter, Download, Eye, Printer,
  Send, CheckCircle, Clock, AlertCircle, X, ChevronDown,
  Building2, Calendar, Hash, Package, Trash2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
type InvoiceType = 'SALES' | 'PURCHASE'

interface InvoiceItem {
  id: string
  productName: string
  sku: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
  total: number
}

interface Invoice {
  id: string
  invoiceNo: string
  type: InvoiceType
  status: InvoiceStatus
  customerName: string
  customerTaxNo: string
  date: string
  dueDate: string
  items: InvoiceItem[]
  subtotal: number
  vatTotal: number
  grandTotal: number
  currency: string
  notes: string
}

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Taslak', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
  FINALIZED: { label: 'Kesildi', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', icon: CheckCircle },
  SENT: { label: 'Gönderildi', color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400', icon: Send },
  PAID: { label: 'Ödendi', color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
  OVERDUE: { label: 'Vadesi Geçmiş', color: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400', icon: AlertCircle },
  CANCELLED: { label: 'İptal', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400', icon: X },
}

const demoInvoices: Invoice[] = [
  {
    id: '1', invoiceNo: 'FTR-2026-0089', type: 'SALES', status: 'PAID',
    customerName: 'HomeStyle Inc.', customerTaxNo: '1234567890',
    date: '2026-01-15', dueDate: '2026-02-14',
    items: [
      { id: 'i1', productName: 'El Dokuma Halı - Kayseri', sku: 'HAL-KAY-001', quantity: 12, unit: 'm²', unitPrice: 2450, vatRate: 18, total: 29400 },
      { id: 'i2', productName: 'Makine Halısı - Modern', sku: 'HAL-MOD-003', quantity: 25, unit: 'm²', unitPrice: 780, vatRate: 18, total: 19500 },
    ],
    subtotal: 48900, vatTotal: 8802, grandTotal: 57702, currency: 'USD', notes: '',
  },
  {
    id: '2', invoiceNo: 'FTR-2026-0090', type: 'SALES', status: 'SENT',
    customerName: 'Luxury Floors NY', customerTaxNo: '9876543210',
    date: '2026-01-22', dueDate: '2026-03-07',
    items: [
      { id: 'i3', productName: 'İpek Halı - Hereke', sku: 'HAL-HER-001', quantity: 5, unit: 'adet', unitPrice: 8900, vatRate: 18, total: 44500 },
      { id: 'i4', productName: 'Yün Halı - Uşak', sku: 'HAL-USK-002', quantity: 8, unit: 'm²', unitPrice: 3480, vatRate: 18, total: 27840 },
    ],
    subtotal: 72340, vatTotal: 13021, grandTotal: 85361, currency: 'USD', notes: 'Ekspres kargo talep edilmiştir.',
  },
  {
    id: '3', invoiceNo: 'FTR-2026-0091', type: 'SALES', status: 'OVERDUE',
    customerName: 'Desert Home Decor', customerTaxNo: '5678901234',
    date: '2025-12-10', dueDate: '2026-01-09',
    items: [
      { id: 'i5', productName: 'Kilim - Antik Desen', sku: 'KLM-ANT-001', quantity: 15, unit: 'm²', unitPrice: 1920, vatRate: 18, total: 28800 },
    ],
    subtotal: 28800, vatTotal: 5184, grandTotal: 33984, currency: 'USD', notes: '',
  },
  {
    id: '4', invoiceNo: 'ALF-2026-0045', type: 'PURCHASE', status: 'FINALIZED',
    customerName: 'Anadolu Dokuma A.Ş.', customerTaxNo: '3456789012',
    date: '2026-01-20', dueDate: '2026-03-20',
    items: [
      { id: 'i6', productName: 'Ham Yün İplik', sku: 'HAM-YUN-001', quantity: 500, unit: 'kg', unitPrice: 85, vatRate: 8, total: 42500 },
      { id: 'i7', productName: 'Polyester İplik', sku: 'HAM-PLY-002', quantity: 300, unit: 'kg', unitPrice: 42, vatRate: 8, total: 12600 },
      { id: 'i8', productName: 'Doğal Boya Seti', sku: 'HAM-BYA-001', quantity: 50, unit: 'set', unitPrice: 340, vatRate: 18, total: 17000 },
    ],
    subtotal: 72100, vatTotal: 7460, grandTotal: 79560, currency: 'USD', notes: 'Siparişin 15 gün içinde teslim edilmesi beklenmektedir.',
  },
  {
    id: '5', invoiceNo: 'FTR-2026-0092', type: 'SALES', status: 'DRAFT',
    customerName: 'Chicago Interiors', customerTaxNo: '7890123456',
    date: '2026-01-28', dueDate: '2026-02-27',
    items: [
      { id: 'i9', productName: 'El Dokuma Halı - Konya', sku: 'HAL-KON-001', quantity: 20, unit: 'm²', unitPrice: 1850, vatRate: 18, total: 37000 },
      { id: 'i10', productName: 'Patchwork Halı', sku: 'HAL-PTW-001', quantity: 10, unit: 'm²', unitPrice: 1420, vatRate: 18, total: 14200 },
    ],
    subtotal: 51200, vatTotal: 9216, grandTotal: 60416, currency: 'USD', notes: '',
  },
]

function formatCurrency(val: number, currency = 'USD'): string {
  const sym = currency === 'TRY' ? '₺' : currency === 'EUR' ? '€' : '$'
  return sym + val.toLocaleString('en-US', { minimumFractionDigits: 0 })
}

export default function InvoicePage() {
  const { hasPermission } = useAuth()
  const [filter, setFilter] = useState<'all' | InvoiceType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all')
  const [search, setSearch] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const canCreateInvoice = hasPermission('create_invoice')

  const filtered = useMemo(() => {
    return demoInvoices.filter((inv) => {
      if (filter !== 'all' && inv.type !== filter) return false
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false
      if (search && !inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) &&
          !inv.customerName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [filter, statusFilter, search])

  const totals = useMemo(() => ({
    sales: demoInvoices.filter(i => i.type === 'SALES').reduce((s, i) => s + i.grandTotal, 0),
    purchase: demoInvoices.filter(i => i.type === 'PURCHASE').reduce((s, i) => s + i.grandTotal, 0),
    overdue: demoInvoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + i.grandTotal, 0),
    draft: demoInvoices.filter(i => i.status === 'DRAFT').length,
  }), [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Faturalar</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Satış ve alış fatura yönetimi</p>
        </div>
        {canCreateInvoice && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Fatura
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Satış Faturaları</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(totals.sales)}</p>
          <p className="text-xs text-gray-400">{demoInvoices.filter(i => i.type === 'SALES').length} adet</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Alış Faturaları</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(totals.purchase)}</p>
          <p className="text-xs text-gray-400">{demoInvoices.filter(i => i.type === 'PURCHASE').length} adet</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Vadesi Geçmiş</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totals.overdue)}</p>
          <p className="text-xs text-red-400">{demoInvoices.filter(i => i.status === 'OVERDUE').length} adet</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Taslak</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{totals.draft}</p>
          <p className="text-xs text-gray-400">Onay bekliyor</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Fatura no veya müşteri ara..."
            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary pl-10 pr-4 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
        >
          <option value="all">Tüm Faturalar</option>
          <option value="SALES">Satış Faturaları</option>
          <option value="PURCHASE">Alış Faturaları</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="DRAFT">Taslak</option>
          <option value="FINALIZED">Kesildi</option>
          <option value="SENT">Gönderildi</option>
          <option value="PAID">Ödendi</option>
          <option value="OVERDUE">Vadesi Geçmiş</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-secondary/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Fatura No</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Tip</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Müşteri / Tedarikçi</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Tarih</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Vade</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Tutar</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">KDV</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Genel Toplam</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Durum</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => {
              const sc = statusConfig[inv.status]
              return (
                <tr key={inv.id} className="border-b border-border/50 dark:border-border-dark/50 hover:bg-surface-secondary/30 dark:hover:bg-surface-dark-secondary/30">
                  <td className="px-4 py-3 font-mono text-brand-600 font-medium text-xs">{inv.invoiceNo}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      inv.type === 'SALES'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                    }`}>
                      {inv.type === 'SALES' ? 'Satış' : 'Alış'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{inv.customerName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{inv.date}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{inv.dueDate}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{formatCurrency(inv.subtotal)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(inv.vatTotal)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(inv.grandTotal)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sc.color}`}>
                      <sc.icon className="h-3 w-3" />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="rounded-lg p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedInvoice(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border dark:border-border-dark p-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedInvoice.invoiceNo}</h2>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[selectedInvoice.status].color}`}>
                      {statusConfig[selectedInvoice.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedInvoice.type === 'SALES' ? 'Satış Faturası' : 'Alış Faturası'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-surface-dark-secondary">
                    <Printer className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-surface-dark-secondary">
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-surface-dark-secondary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="p-6 grid grid-cols-2 gap-6 border-b border-border dark:border-border-dark">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Müşteri / Tedarikçi</h3>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedInvoice.customerName}</p>
                  <p className="text-sm text-gray-500">VKN: {selectedInvoice.customerTaxNo}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Fatura Tarihi</h3>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedInvoice.date}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Vade Tarihi</h3>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedInvoice.dueDate}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border dark:border-border-dark">
                      <th className="text-left pb-2 font-medium text-gray-500">Ürün</th>
                      <th className="text-left pb-2 font-medium text-gray-500">SKU</th>
                      <th className="text-right pb-2 font-medium text-gray-500">Miktar</th>
                      <th className="text-right pb-2 font-medium text-gray-500">Birim Fiyat</th>
                      <th className="text-right pb-2 font-medium text-gray-500">KDV %</th>
                      <th className="text-right pb-2 font-medium text-gray-500">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 dark:border-border-dark/50">
                        <td className="py-3 text-gray-900 dark:text-white font-medium">{item.productName}</td>
                        <td className="py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">{item.quantity} {item.unit}</td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">%{item.vatRate}</td>
                        <td className="py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ara Toplam</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">KDV Toplam</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(selectedInvoice.vatTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-border dark:border-border-dark pt-2">
                      <span className="text-gray-900 dark:text-white">Genel Toplam</span>
                      <span className="text-brand-600 text-lg">{formatCurrency(selectedInvoice.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="mt-4 rounded-lg bg-surface-secondary dark:bg-surface-dark-secondary p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">Notlar</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateInvoiceModal onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<InvoiceType>('SALES')
  const [items, setItems] = useState<{ productName: string; quantity: number; unitPrice: number; vatRate: number }[]>([
    { productName: '', quantity: 1, unitPrice: 0, vatRate: 18 },
  ])

  const addItem = () => {
    setItems([...items, { productName: '', quantity: 1, unitPrice: 0, vatRate: 18 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const vatTotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.vatRate) / 100, 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-3xl bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border dark:border-border-dark p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Yeni Fatura Oluştur</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-surface-dark-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Type & Customer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fatura Tipi</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InvoiceType)}
                className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-4 py-2.5 text-sm"
              >
                <option value="SALES">Satış Faturası</option>
                <option value="PURCHASE">Alış Faturası</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {type === 'SALES' ? 'Müşteri' : 'Tedarikçi'}
              </label>
              <select className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-4 py-2.5 text-sm">
                <option>Seçiniz...</option>
                <option>HomeStyle Inc.</option>
                <option>Luxury Floors NY</option>
                <option>Pacific Rugs</option>
                <option>Anadolu Dokuma A.Ş.</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fatura Tarihi</label>
              <input
                type="date"
                defaultValue="2026-01-30"
                className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vade Tarihi</label>
              <input
                type="date"
                defaultValue="2026-03-01"
                className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kalemler</label>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                <Plus className="h-3 w-3" /> Kalem Ekle
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    {index === 0 && <label className="text-xs text-gray-500 mb-1 block">Ürün</label>}
                    <input
                      type="text"
                      placeholder="Ürün adı"
                      value={item.productName}
                      onChange={(e) => {
                        const next = [...items]
                        next[index].productName = e.target.value
                        setItems(next)
                      }}
                      className="w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <label className="text-xs text-gray-500 mb-1 block">Miktar</label>}
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const next = [...items]
                        next[index].quantity = Number(e.target.value)
                        setItems(next)
                      }}
                      className="w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <label className="text-xs text-gray-500 mb-1 block">Birim Fiyat</label>}
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const next = [...items]
                        next[index].unitPrice = Number(e.target.value)
                        setItems(next)
                      }}
                      className="w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <label className="text-xs text-gray-500 mb-1 block">KDV %</label>}
                    <select
                      value={item.vatRate}
                      onChange={(e) => {
                        const next = [...items]
                        next[index].vatRate = Number(e.target.value)
                        setItems(next)
                      }}
                      className="w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-3 py-2 text-sm"
                    >
                      <option value={0}>%0</option>
                      <option value={1}>%1</option>
                      <option value={8}>%8</option>
                      <option value={18}>%18</option>
                      <option value={20}>%20</option>
                    </select>
                  </div>
                  <div className="col-span-1 text-right">
                    {index === 0 && <label className="text-xs text-gray-500 mb-1 block">Toplam</label>}
                    <p className="py-2 text-sm font-medium text-gray-900 dark:text-white">
                      ${(item.quantity * item.unitPrice).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(index)} className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end border-t border-border dark:border-border-dark pt-4">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ara Toplam</span>
                <span className="font-medium">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">KDV</span>
                <span className="font-medium">${Math.round(vatTotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-2">
                <span>Genel Toplam</span>
                <span className="text-brand-600 text-lg">${Math.round(subtotal + vatTotal).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notlar</label>
            <textarea
              rows={2}
              placeholder="Fatura notu ekleyin..."
              className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary px-4 py-2.5 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-border dark:border-border-dark pt-4">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border dark:border-border-dark text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary">
              İptal
            </button>
            <button className="px-4 py-2 rounded-xl bg-gray-600 text-sm font-medium text-white hover:bg-gray-700">
              Taslak Kaydet
            </button>
            <button className="px-4 py-2 rounded-xl bg-brand-600 text-sm font-medium text-white hover:bg-brand-700">
              Faturayı Oluştur
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
