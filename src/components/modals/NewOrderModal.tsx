import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Trash2, AlertCircle, Search, AlertTriangle,
  Users, UserCheck, Building2, Percent, Calendar, Truck,
  Star, ChevronDown, DollarSign, Info,
} from 'lucide-react'
import { orderCreateSchema, formatZodErrors } from '../../lib/validation'
import { useCreateOrder, useAccountsQuery } from '../../hooks/useIpc'
import ProductPicker from '../ProductPicker'
import { useToast } from '../Toast'
import { useAuth } from '../../contexts/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
}

interface OrderLine {
  variantId?: string
  productName: string
  sku: string
  quantity: string
  unit: string
  unitPrice: string
  purchasePrice: string
  discount: string
  belowCost: boolean
}

const emptyLine: OrderLine = {
  productName: '',
  sku: '',
  quantity: '',
  unit: 'm2',
  unitPrice: '',
  purchasePrice: '',
  discount: '0',
  belowCost: false,
}

// Demo data for agencies, staff, sellers
const demoAgencies = [
  { id: 'ag1', name: 'ABC Trading LLC', region: 'Doğu ABD', defaultCommission: 5.0 },
  { id: 'ag2', name: 'West Coast Carpets', region: 'Batı ABD', defaultCommission: 4.5 },
  { id: 'ag3', name: 'Southern Flooring Co.', region: 'Güney ABD', defaultCommission: 5.0 },
  { id: 'ag4', name: 'Midwest Distributors', region: 'Orta ABD', defaultCommission: 4.0 },
  { id: 'ag5', name: 'Texas Imports', region: 'Texas', defaultCommission: 4.0 },
]

const demoAgencyStaff: Record<string, { id: string; name: string; commission: number }[]> = {
  ag1: [
    { id: 'as1', name: 'Robert Johnson', commission: 2.0 },
    { id: 'as2', name: 'Emily Davis', commission: 1.5 },
    { id: 'as3', name: 'Michael Chen', commission: 1.8 },
  ],
  ag2: [
    { id: 'as4', name: 'Sarah Williams', commission: 2.0 },
    { id: 'as5', name: 'David Kim', commission: 1.5 },
  ],
  ag3: [
    { id: 'as6', name: 'James Brown', commission: 2.0 },
    { id: 'as7', name: 'Lisa Martinez', commission: 1.5 },
  ],
  ag4: [
    { id: 'as8', name: 'Tom Wilson', commission: 1.5 },
  ],
  ag5: [
    { id: 'as9', name: 'Anna Garcia', commission: 1.5 },
  ],
}

const demoSellers = [
  { id: 'sl1', name: 'Ali Çelik', role: 'Kıdemli Satış Müdürü' },
  { id: 'sl2', name: 'Fatma Özkan', role: 'Satış Temsilcisi' },
  { id: 'sl3', name: 'Hasan Demir', role: 'Satış Temsilcisi' },
  { id: 'sl4', name: 'Zeynep Yıldız', role: 'Jr. Satış Temsilcisi' },
]

const demoCustomers = [
  { id: 'c1', code: 'C-001', name: 'HomeStyle Inc.', city: 'New York', paymentTerm: 30, priceList: 'USA Wholesale' },
  { id: 'c2', code: 'C-002', name: 'Luxury Floors NY', city: 'Los Angeles', paymentTerm: 45, priceList: 'USA Premium' },
  { id: 'c3', code: 'C-003', name: 'Pacific Rugs', city: 'San Francisco', paymentTerm: 30, priceList: 'USA Wholesale' },
  { id: 'c4', code: 'C-004', name: 'Desert Home Decor', city: 'Phoenix', paymentTerm: 30, priceList: null },
  { id: 'c5', code: 'C-005', name: 'Chicago Interiors', city: 'Chicago', paymentTerm: 60, priceList: '2026 Distributor' },
]

// Demo price list multipliers (in production resolved via pricing:resolve IPC)
const demoPriceListMultipliers: Record<string, number> = {
  'USA Wholesale': 0.85,    // 15% discount from list price
  'USA Premium': 0.92,      // 8% discount
  '2026 Distributor': 0.78, // 22% discount
}

export default function NewOrderModal({ open, onClose }: Props) {
  const { data: accounts = [] } = useAccountsQuery({ type: 'CUSTOMER' })
  const createOrder = useCreateOrder()
  const { toast } = useToast()
  const { hasPermission } = useAuth()

  // Core fields
  const [accountId, setAccountId] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [vatRate, setVatRate] = useState('0')
  const [exchangeRate, setExchangeRate] = useState('1.0000')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([{ ...emptyLine }])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerLineIdx, setPickerLineIdx] = useState<number>(0)

  // New fields - Sales & Commission
  const [sellerId, setSellerId] = useState('')
  const [agencyId, setAgencyId] = useState('')
  const [agencyStaffId, setAgencyStaffId] = useState('')
  const [agencyCommissionRate, setAgencyCommissionRate] = useState('')
  const [agencyStaffCommissionRate, setAgencyStaffCommissionRate] = useState('')
  const [commissionOverride, setCommissionOverride] = useState(false)

  // New fields - Delivery & Payment
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'vip'>('normal')
  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentTermDays, setPaymentTermDays] = useState('30')
  const [generalDiscount, setGeneralDiscount] = useState('0')

  // Section collapse states
  const [showCommission, setShowCommission] = useState(true)
  const [showDelivery, setShowDelivery] = useState(false)

  const canViewCost = hasPermission('view_cost_price')

  // Get available staff when agency changes
  const availableStaff = useMemo(() => {
    if (!agencyId) return []
    return demoAgencyStaff[agencyId] || []
  }, [agencyId])

  // When agency changes, set default commission
  const handleAgencyChange = (newAgencyId: string) => {
    setAgencyId(newAgencyId)
    setAgencyStaffId('')
    setAgencyStaffCommissionRate('')
    if (!commissionOverride) {
      const agency = demoAgencies.find(a => a.id === newAgencyId)
      setAgencyCommissionRate(agency ? String(agency.defaultCommission) : '')
    }
  }

  // When staff changes, set staff commission
  const handleStaffChange = (staffId: string) => {
    setAgencyStaffId(staffId)
    if (!commissionOverride) {
      const staff = availableStaff.find(s => s.id === staffId)
      setAgencyStaffCommissionRate(staff ? String(staff.commission) : '')
    }
  }

  // When customer changes, set payment terms
  const handleCustomerChange = (custId: string) => {
    setAccountId(custId)
    const cust = demoCustomers.find(c => c.id === custId)
    if (cust) {
      setPaymentTermDays(String(cust.paymentTerm))
    }
  }

  const addLine = () => setLines([...lines, { ...emptyLine }])
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx))
  const updateLine = (idx: number, field: keyof OrderLine, value: string) => {
    setLines(lines.map((l, i) => {
      if (i !== idx) return l
      const updated = { ...l, [field]: value }
      if (field === 'unitPrice' && updated.purchasePrice) {
        updated.belowCost = parseFloat(value || '0') < parseFloat(updated.purchasePrice || '0')
      }
      return updated
    }))
  }

  const openPicker = (idx: number) => {
    setPickerLineIdx(idx)
    setPickerOpen(true)
  }

  const handleProductSelect = (item: any) => {
    // Apply price list pricing if customer has an assigned list
    const cust = demoCustomers.find(c => c.id === accountId)
    let resolvedPrice = item.unitPrice
    let priceSource: 'list' | 'pricelist' = 'list'

    if (cust?.priceList && demoPriceListMultipliers[cust.priceList]) {
      const multiplier = demoPriceListMultipliers[cust.priceList]
      resolvedPrice = (parseFloat(item.unitPrice || '0') * multiplier).toFixed(2)
      priceSource = 'pricelist'
    }

    const belowCost = parseFloat(resolvedPrice || '0') < parseFloat(item.baseCost || '0')

    setLines(lines.map((l, i) => {
      if (i !== pickerLineIdx) return l
      return {
        ...l,
        variantId: item.variantId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: resolvedPrice,
        purchasePrice: item.baseCost,
        unit: item.unit,
        discount: '0',
        belowCost,
      }
    }))

    // Show margin guard toast if below cost
    if (belowCost) {
      toast('warning', `${item.productName} maliyetin altında fiyatlandırıldı ($${resolvedPrice} < $${item.baseCost})`)
    }
  }

  // Calculations
  const lineTotal = (line: OrderLine) => {
    const q = parseFloat(line.quantity) || 0
    const p = parseFloat(line.unitPrice) || 0
    const d = parseFloat(line.discount) || 0
    return q * p * (1 - d / 100)
  }

  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0)
  const generalDiscountAmount = subtotal * (parseFloat(generalDiscount) || 0) / 100
  const netTotal = subtotal - generalDiscountAmount
  const vatAmount = netTotal * (parseFloat(vatRate) || 0) / 100
  const grandTotal = netTotal + vatAmount

  const agencyCommAmount = netTotal * (parseFloat(agencyCommissionRate) || 0) / 100
  const staffCommAmount = netTotal * (parseFloat(agencyStaffCommissionRate) || 0) / 100
  const totalCommission = agencyCommAmount + staffCommAmount

  const selectedAgency = demoAgencies.find(a => a.id === agencyId)
  const selectedStaff = availableStaff.find(s => s.id === agencyStaffId)
  const selectedSeller = demoSellers.find(s => s.id === sellerId)
  const selectedCustomer = demoCustomers.find(c => c.id === accountId)

  const handleSubmit = () => {
    const data = {
      accountId: accountId || (demoCustomers[0]?.id ?? ''),
      currency,
      vatRate,
      exchangeRate,
      notes: notes || undefined,
      items: lines.map((l) => ({
        productName: l.productName,
        sku: l.sku || undefined,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        purchasePrice: l.purchasePrice || undefined,
      })),
    }

    const result = orderCreateSchema.safeParse(data)
    if (!result.success) {
      setErrors(formatZodErrors(result.error))
      return
    }

    if (!sellerId) {
      setErrors({ sellerId: 'Satış elemanı seçiniz' })
      return
    }

    setErrors({})
    createOrder.mutate(result.data, {
      onSuccess: (res) => {
        if (res.success) {
          toast('success', 'Sipariş başarıyla oluşturuldu')
          resetForm()
          onClose()
        } else {
          toast('error', res.error || 'Sipariş oluşturulamadı')
        }
      },
    })
  }

  const resetForm = () => {
    setAccountId('')
    setCurrency('USD')
    setVatRate('0')
    setExchangeRate('1.0000')
    setNotes('')
    setLines([{ ...emptyLine }])
    setErrors({})
    setSellerId('')
    setAgencyId('')
    setAgencyStaffId('')
    setAgencyCommissionRate('')
    setAgencyStaffCommissionRate('')
    setCommissionOverride(false)
    setPriority('normal')
    setEstimatedDelivery('')
    setDeliveryAddress('')
    setPaymentTermDays('30')
    setGeneralDiscount('0')
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-4 z-50 flex flex-col rounded-2xl bg-white dark:bg-surface-dark shadow-glass border border-border dark:border-border-dark overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border dark:border-border-dark px-6 py-4 shrink-0">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Yeni Sipariş Oluştur
                    </h2>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">
                      Müşteri, ürün ve komisyon bilgilerini ekleyin
                    </p>
                  </div>
                  {/* Priority Badge */}
                  <div className="flex gap-1">
                    {(['normal', 'urgent', 'vip'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`rounded-lg px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition-all ${
                          priority === p
                            ? p === 'vip'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-amber-300'
                              : p === 'urgent'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-1 ring-red-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 ring-1 ring-gray-300'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {p === 'vip' && <Star className="h-3 w-3 inline mr-1" />}
                        {p === 'normal' ? 'Normal' : p === 'urgent' ? 'Acil' : 'VIP'}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* === Section: Customer & Seller === */}
                <div className="rounded-xl border border-border dark:border-border-dark p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-brand-500" />
                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Müşteri & Satış Bilgileri</h3>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {/* Customer */}
                    <div className="col-span-1">
                      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Müşteri (Alıcı)
                      </label>
                      <select
                        value={accountId}
                        onChange={(e) => handleCustomerChange(e.target.value)}
                        className={`w-full rounded-xl border ${errors.accountId ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white`}
                      >
                        <option value="">Müşteri seçin...</option>
                        {demoCustomers.map((c) => (
                          <option key={c.id} value={c.id}>{c.code} – {c.name} ({c.city})</option>
                        ))}
                      </select>
                      {errors.accountId && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                          <AlertCircle className="h-3 w-3" /> {errors.accountId}
                        </p>
                      )}
                    </div>

                    {/* Seller */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Satış Elemanı (Kim Sattı)
                      </label>
                      <select
                        value={sellerId}
                        onChange={(e) => setSellerId(e.target.value)}
                        className={`w-full rounded-xl border ${errors.sellerId ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white`}
                      >
                        <option value="">Satıcı seçin...</option>
                        {demoSellers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} – {s.role}</option>
                        ))}
                      </select>
                      {errors.sellerId && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                          <AlertCircle className="h-3 w-3" /> {errors.sellerId}
                        </p>
                      )}
                    </div>

                    {/* Currency */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Para Birimi
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="TRY">TRY (₺)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    {/* Exchange Rate */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Kur (1 {currency} = ? TRY)
                      </label>
                      <input
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        type="number"
                        step="0.0001"
                        className={`w-full rounded-xl border ${errors.exchangeRate ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums`}
                      />
                    </div>
                  </div>

                  {/* Selected customer info bar */}
                  {selectedCustomer && (
                    <div className="flex items-center gap-4 rounded-lg bg-brand-50/50 dark:bg-brand-900/10 px-3 py-2 text-[11px]">
                      <Info className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">{selectedCustomer.name}</strong>
                        {' '}| {selectedCustomer.city} | Vade: {selectedCustomer.paymentTerm} gün
                        {selectedCustomer.priceList && (
                          <> | <span className="inline-flex items-center rounded-md bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 text-[10px] font-medium ml-1">
                            <DollarSign className="h-2.5 w-2.5 mr-0.5" />{selectedCustomer.priceList}
                          </span></>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* === Section: Agency & Commission === */}
                <div className="rounded-xl border border-border dark:border-border-dark overflow-hidden">
                  <button
                    onClick={() => setShowCommission(!showCommission)}
                    className="flex items-center justify-between w-full p-4 text-left hover:bg-surface-secondary/50 dark:hover:bg-surface-dark-tertiary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-500" />
                      <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Acente & Komisyon Bilgileri</h3>
                      {agencyId && (
                        <span className="text-[10px] bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                          {selectedAgency?.name}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showCommission ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showCommission && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
                          <div className="grid grid-cols-4 gap-4">
                            {/* Agency Select */}
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Acente (Getiren)
                              </label>
                              <select
                                value={agencyId}
                                onChange={(e) => handleAgencyChange(e.target.value)}
                                className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                              >
                                <option value="">Acente seçin...</option>
                                {demoAgencies.map((a) => (
                                  <option key={a.id} value={a.id}>{a.name} ({a.region})</option>
                                ))}
                              </select>
                            </div>

                            {/* Agency Staff */}
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Acente Çalışanı (Kim Getirdi)
                              </label>
                              <select
                                value={agencyStaffId}
                                onChange={(e) => handleStaffChange(e.target.value)}
                                disabled={!agencyId}
                                className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white disabled:opacity-50"
                              >
                                <option value="">Çalışan seçin...</option>
                                {availableStaff.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name} (varsayılan: %{s.commission})</option>
                                ))}
                              </select>
                            </div>

                            {/* Agency Commission */}
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Acente Komisyon Oranı (%)
                              </label>
                              <div className="relative">
                                <input
                                  value={agencyCommissionRate}
                                  onChange={(e) => {
                                    setAgencyCommissionRate(e.target.value)
                                    setCommissionOverride(true)
                                  }}
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  placeholder="0.0"
                                  className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums pr-8"
                                />
                                <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                              </div>
                            </div>

                            {/* Staff Commission */}
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Çalışan Komisyon Oranı (%)
                              </label>
                              <div className="relative">
                                <input
                                  value={agencyStaffCommissionRate}
                                  onChange={(e) => {
                                    setAgencyStaffCommissionRate(e.target.value)
                                    setCommissionOverride(true)
                                  }}
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  placeholder="0.0"
                                  disabled={!agencyStaffId}
                                  className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums pr-8 disabled:opacity-50"
                                />
                                <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                              </div>
                            </div>
                          </div>

                          {/* Commission Override Notice */}
                          {commissionOverride && (
                            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                              Komisyon oranları manuel olarak değiştirildi. Varsayılan oranlar uygulanmıyor.
                              <button
                                onClick={() => {
                                  setCommissionOverride(false)
                                  const agency = demoAgencies.find(a => a.id === agencyId)
                                  const staff = availableStaff.find(s => s.id === agencyStaffId)
                                  setAgencyCommissionRate(agency ? String(agency.defaultCommission) : '')
                                  setAgencyStaffCommissionRate(staff ? String(staff.commission) : '')
                                }}
                                className="ml-auto text-amber-600 hover:text-amber-800 font-medium underline"
                              >
                                Varsayılana dön
                              </button>
                            </div>
                          )}

                          {/* Commission Summary */}
                          {(agencyId || agencyCommissionRate) && netTotal > 0 && (
                            <div className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-100 dark:border-purple-800/30 p-3">
                              <h4 className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase mb-2">Komisyon Özeti</h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <p className="text-[10px] text-gray-500">Acente Komisyonu</p>
                                  <p className="text-sm font-bold text-purple-700 dark:text-purple-400">
                                    ${agencyCommAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-[10px] text-gray-400">%{agencyCommissionRate || '0'} × ${netTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                                </div>
                                {agencyStaffId && (
                                  <div>
                                    <p className="text-[10px] text-gray-500">Çalışan Komisyonu ({selectedStaff?.name})</p>
                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                      ${staffCommAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[10px] text-gray-400">%{agencyStaffCommissionRate || '0'} × ${netTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-[10px] text-gray-500">Toplam Komisyon</p>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    ${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-[10px] text-gray-400">
                                    Toplam oranın %{((totalCommission / netTotal) * 100).toFixed(1)}'i
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* === Section: Delivery & Payment === */}
                <div className="rounded-xl border border-border dark:border-border-dark overflow-hidden">
                  <button
                    onClick={() => setShowDelivery(!showDelivery)}
                    className="flex items-center justify-between w-full p-4 text-left hover:bg-surface-secondary/50 dark:hover:bg-surface-dark-tertiary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-green-500" />
                      <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Teslimat & Ödeme Koşulları</h3>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDelivery ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showDelivery && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Tahmini Teslim Tarihi
                              </label>
                              <input
                                type="date"
                                value={estimatedDelivery}
                                onChange={(e) => setEstimatedDelivery(e.target.value)}
                                className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Ödeme Vadesi (gün)
                              </label>
                              <select
                                value={paymentTermDays}
                                onChange={(e) => setPaymentTermDays(e.target.value)}
                                className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                              >
                                <option value="0">Peşin</option>
                                <option value="7">7 Gün</option>
                                <option value="15">15 Gün</option>
                                <option value="30">30 Gün</option>
                                <option value="45">45 Gün</option>
                                <option value="60">60 Gün</option>
                                <option value="90">90 Gün</option>
                                <option value="120">120 Gün</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                                KDV (%)
                              </label>
                              <select
                                value={vatRate}
                                onChange={(e) => setVatRate(e.target.value)}
                                className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                              >
                                <option value="0">%0 (İhracat)</option>
                                <option value="1">%1</option>
                                <option value="8">%8</option>
                                <option value="18">%18</option>
                                <option value="20">%20</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Teslimat Adresi
                            </label>
                            <input
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              placeholder="Teslimat adresi giriniz..."
                              className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* === Section: Order Lines === */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[13px] font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Sipariş Kalemleri
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPicker(lines.length)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                      >
                        <Search className="h-3 w-3" />
                        Ürün Seç
                      </button>
                      <button
                        onClick={addLine}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-gray-600 dark:text-gray-400 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Boş Satır
                      </button>
                    </div>
                  </div>

                  {errors.items && (
                    <p className="mb-2 flex items-center gap-1 text-[11px] text-red-500">
                      <AlertCircle className="h-3 w-3" /> {errors.items}
                    </p>
                  )}

                  {/* Table header */}
                  <div className={`grid ${canViewCost ? 'grid-cols-[1fr_90px_65px_55px_85px_85px_60px_70px_32px]' : 'grid-cols-[1fr_90px_65px_55px_85px_60px_70px_32px]'} gap-2 px-1 mb-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider`}>
                    <span>Ürün</span>
                    <span>SKU</span>
                    <span>Miktar</span>
                    <span>Birim</span>
                    <span>Birim Fiyat</span>
                    {canViewCost && <span>Alış Fiyat</span>}
                    <span>İsk. %</span>
                    <span className="text-right">Toplam</span>
                    <span />
                  </div>

                  <div className="space-y-2">
                    {lines.map((line, idx) => {
                      const lt = lineTotal(line)
                      return (
                        <div key={idx}>
                          <div className={`grid ${canViewCost ? 'grid-cols-[1fr_90px_65px_55px_85px_85px_60px_70px_32px]' : 'grid-cols-[1fr_90px_65px_55px_85px_60px_70px_32px]'} gap-2 items-center`}>
                            <div className="relative">
                              <input
                                value={line.productName}
                                onChange={(e) => updateLine(idx, 'productName', e.target.value)}
                                placeholder="Ürün adı"
                                className={`w-full rounded-xl border ${errors[`items.${idx}.productName`] ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white placeholder:text-gray-400`}
                              />
                              <button
                                onClick={() => openPicker(idx)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                              >
                                <Search className="h-3.5 w-3.5 text-gray-400" />
                              </button>
                            </div>
                            <input
                              value={line.sku}
                              readOnly
                              placeholder="—"
                              className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50 px-2 py-2 text-[11px] font-mono text-gray-500 outline-none"
                            />
                            <input
                              value={line.quantity}
                              onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                              placeholder="0"
                              type="number"
                              className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-2 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums"
                            />
                            <select
                              value={line.unit}
                              onChange={(e) => updateLine(idx, 'unit', e.target.value)}
                              className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-1 py-2 text-sm outline-none text-gray-900 dark:text-white"
                            >
                              <option value="m2">m²</option>
                              <option value="adet">Adet</option>
                              <option value="mt">mt</option>
                              <option value="kg">kg</option>
                            </select>
                            <input
                              value={line.unitPrice}
                              onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)}
                              placeholder="0.00"
                              type="number"
                              className={`rounded-xl border ${line.belowCost ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/10' : 'border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary'} px-2 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums`}
                            />
                            {canViewCost && (
                              <input
                                value={line.purchasePrice}
                                onChange={(e) => updateLine(idx, 'purchasePrice', e.target.value)}
                                placeholder="0.00"
                                type="number"
                                className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-2 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums"
                              />
                            )}
                            <input
                              value={line.discount}
                              onChange={(e) => updateLine(idx, 'discount', e.target.value)}
                              placeholder="0"
                              type="number"
                              min="0"
                              max="100"
                              className="rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-2 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums"
                            />
                            <span className="text-right text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                              ${lt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <button
                              onClick={() => removeLine(idx)}
                              disabled={lines.length === 1}
                              className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {line.belowCost && (
                            <div className="mt-1 ml-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" />
                              Birim fiyat maliyet altında (Alış: ${line.purchasePrice})
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Sipariş Notları
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Sipariş notu (opsiyonel)..."
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition resize-none text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Footer - Summary */}
              <div className="border-t border-border dark:border-border-dark px-6 py-4 shrink-0 bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
                <div className="flex items-start justify-between">
                  {/* Left: Who info */}
                  <div className="flex gap-6 text-[11px]">
                    <div>
                      <span className="text-gray-400 block">Satıcı</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedSeller?.name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Müşteri</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedCustomer?.name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Acente</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedAgency?.name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Çalışan</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedStaff?.name || '—'}</span>
                    </div>
                    {totalCommission > 0 && (
                      <div>
                        <span className="text-gray-400 block">Komisyon</span>
                        <span className="font-medium text-purple-600">
                          ${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Totals & Actions */}
                  <div className="flex items-end gap-6">
                    <div className="text-right space-y-0.5">
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="text-gray-400">Ara Toplam</span>
                        <span className="tabular-nums text-gray-700 dark:text-gray-300">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {generalDiscountAmount > 0 && (
                        <div className="flex items-center gap-4 text-[11px]">
                          <span className="text-gray-400">İskonto (%{generalDiscount})</span>
                          <span className="tabular-nums text-red-500">-${generalDiscountAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {vatAmount > 0 && (
                        <div className="flex items-center gap-4 text-[11px]">
                          <span className="text-gray-400">KDV (%{vatRate})</span>
                          <span className="tabular-nums text-gray-700 dark:text-gray-300">${vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 border-t border-border dark:border-border-dark pt-1">
                        <span className="text-[12px] font-medium text-gray-500">Genel Toplam</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                          ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {lines.filter((l) => l.productName).length} kalem | {currency} | Vade: {paymentTermDays} gün
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-400 mb-1">Genel İsk. %</label>
                        <input
                          value={generalDiscount}
                          onChange={(e) => setGeneralDiscount(e.target.value)}
                          type="number"
                          min="0"
                          max="100"
                          className="w-16 rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary px-2 py-1.5 text-sm outline-none text-center tabular-nums"
                        />
                      </div>
                      <button
                        onClick={onClose}
                        className="rounded-xl border border-border dark:border-border-dark px-5 py-2.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={createOrder.isPending}
                        className="rounded-xl bg-brand-600 px-6 py-2.5 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {createOrder.isPending ? 'Kaydediliyor...' : 'Sipariş Oluştur'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleProductSelect}
      />
    </>
  )
}
