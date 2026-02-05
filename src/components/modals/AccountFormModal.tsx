/**
 * Account Form Modal — Cari Ekleme/Düzenleme
 * Supports create and edit modes
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Building2, Users, Globe, UserCheck, Phone, Mail, MapPin,
  CreditCard, Calendar, AlertCircle, DollarSign, Shield, Link2,
} from 'lucide-react'
import { useCreateAccount, useAccountsQuery } from '../../hooks/useIpc'
import { useToast } from '../Toast'

type AccountType = 'CUSTOMER' | 'SUPPLIER' | 'AGENCY' | 'BOTH'

interface AccountFormData {
  code: string
  name: string
  type: AccountType
  taxId: string
  phone: string
  email: string
  address: string
  city: string
  country: string
  currency: string
  riskLimit: string
  paymentTermDays: number
  referredByAgencyId: string
}

interface Props {
  open: boolean
  onClose: () => void
  editAccount?: any // When provided, modal is in edit mode
  onUpdate?: (id: string, data: Partial<AccountFormData>) => void
}

const emptyFormData: AccountFormData = {
  code: '',
  name: '',
  type: 'CUSTOMER',
  taxId: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  country: 'US',
  currency: 'USD',
  riskLimit: '50000',
  paymentTermDays: 30,
  referredByAgencyId: '',
}

const typeConfig: Record<AccountType, { label: string; icon: typeof Building2; color: string }> = {
  CUSTOMER: { label: 'Müşteri', icon: Building2, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  SUPPLIER: { label: 'Tedarikçi', icon: Globe, color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  AGENCY: { label: 'Acente', icon: UserCheck, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  BOTH: { label: 'Müşteri/Tedarikçi', icon: Users, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700' },
}

const countries = [
  { code: 'US', name: 'Amerika Birleşik Devletleri' },
  { code: 'TR', name: 'Türkiye' },
  { code: 'DE', name: 'Almanya' },
  { code: 'GB', name: 'Birleşik Krallık' },
  { code: 'FR', name: 'Fransa' },
  { code: 'IT', name: 'İtalya' },
  { code: 'ES', name: 'İspanya' },
  { code: 'NL', name: 'Hollanda' },
  { code: 'BE', name: 'Belçika' },
  { code: 'SA', name: 'Suudi Arabistan' },
  { code: 'AE', name: 'BAE' },
]

const currencies = [
  { code: 'USD', symbol: '$', name: 'ABD Doları' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası' },
  { code: 'GBP', symbol: '£', name: 'İngiliz Sterlini' },
]

export default function AccountFormModal({ open, onClose, editAccount, onUpdate }: Props) {
  const { data: accounts = [] } = useAccountsQuery()
  const createAccount = useCreateAccount()
  const { toast } = useToast()

  const isEditMode = !!editAccount

  const [formData, setFormData] = useState<AccountFormData>(emptyFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get agencies for the referredBy dropdown
  const agencies = useMemo(() => {
    return accounts.filter((a: any) => a.type === 'AGENCY')
  }, [accounts])

  // Auto-generate code for new accounts
  const generateCode = () => {
    const prefix = formData.type === 'AGENCY' ? 'AG' : formData.type === 'SUPPLIER' ? 'SP' : 'C'
    const existingCodes = accounts
      .filter((a: any) => a.code.startsWith(prefix))
      .map((a: any) => parseInt(a.code.replace(prefix + '-', '')) || 0)
    const nextNum = Math.max(0, ...existingCodes) + 1
    return `${prefix}-${String(nextNum).padStart(3, '0')}`
  }

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (editAccount) {
        setFormData({
          code: editAccount.code || '',
          name: editAccount.name || '',
          type: editAccount.type || 'CUSTOMER',
          taxId: editAccount.taxId || '',
          phone: editAccount.phone || '',
          email: editAccount.email || '',
          address: editAccount.address || '',
          city: editAccount.city || '',
          country: editAccount.country || 'US',
          currency: editAccount.currency || 'USD',
          riskLimit: editAccount.riskLimit?.toString().replace(/,/g, '') || '50000',
          paymentTermDays: editAccount.paymentTermDays || 30,
          referredByAgencyId: editAccount.referredByAgencyId || '',
        })
      } else {
        const newCode = generateCode()
        setFormData({ ...emptyFormData, code: newCode })
      }
      setErrors({})
    }
  }, [open, editAccount])

  // Update code when type changes (only for new accounts)
  useEffect(() => {
    if (open && !isEditMode) {
      setFormData(prev => ({ ...prev, code: generateCode() }))
    }
  }, [formData.type, open, isEditMode])

  const updateField = <K extends keyof AccountFormData>(field: K, value: AccountFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) newErrors.code = 'Cari kodu gerekli'
    if (!formData.name.trim()) newErrors.name = 'Cari ünvanı gerekli'
    if (!formData.city.trim()) newErrors.city = 'Şehir gerekli'

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin'
    }

    // Check for duplicate code (only for new accounts or if code changed)
    if (!isEditMode || formData.code !== editAccount?.code) {
      const existingAccount = accounts.find((a: any) => a.code === formData.code)
      if (existingAccount) {
        newErrors.code = 'Bu kod zaten kullanılıyor'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const data = {
      ...formData,
      riskLimit: formData.riskLimit || '0',
      referredByAgencyId: formData.referredByAgencyId || undefined,
    }

    if (isEditMode && onUpdate) {
      onUpdate(editAccount.id, data)
    } else {
      createAccount.mutate(data, {
        onSuccess: (res) => {
          if (res.success) {
            toast('success', `Cari "${formData.name}" başarıyla oluşturuldu`)
            onClose()
          } else {
            toast('error', res.error || 'Cari oluşturulamadı')
          }
        },
        onError: () => {
          toast('error', 'Bir hata oluştu')
        },
      })
    }
  }

  const TypeIcon = typeConfig[formData.type].icon

  return (
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
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl z-50 flex flex-col rounded-2xl bg-white dark:bg-surface-dark shadow-glass border border-border dark:border-border-dark overflow-hidden md:max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border dark:border-border-dark px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${typeConfig[formData.type].color}`}>
                  <TypeIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isEditMode ? 'Cari Düzenle' : 'Yeni Cari Ekle'}
                  </h2>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400">
                    {isEditMode ? `${editAccount.code} - ${editAccount.name}` : 'Müşteri, tedarikçi veya acente ekleyin'}
                  </p>
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
              {/* Account Type Selector */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Cari Türü
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(typeConfig) as [AccountType, typeof typeConfig.CUSTOMER][]).map(([type, cfg]) => {
                    const Icon = cfg.icon
                    const isSelected = formData.type === type
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateField('type', type)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all ${
                          isSelected
                            ? `${cfg.color} border-current ring-2 ring-offset-2 ring-current/20`
                            : 'border-border dark:border-border-dark hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? '' : 'text-gray-400'}`} />
                        <span className={`text-[11px] font-medium ${isSelected ? '' : 'text-gray-500'}`}>
                          {cfg.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Basic Info */}
              <div className="rounded-xl border border-border dark:border-border-dark p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-brand-500" />
                  <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Temel Bilgiler</h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Code */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Cari Kodu
                    </label>
                    <input
                      value={formData.code}
                      onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                      placeholder="C-001"
                      className={`w-full rounded-xl border ${errors.code ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm font-mono outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white`}
                    />
                    {errors.code && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                        <AlertCircle className="h-3 w-3" /> {errors.code}
                      </p>
                    )}
                  </div>

                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Cari Ünvanı
                    </label>
                    <input
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Firma adı"
                      className={`w-full rounded-xl border ${errors.name ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition text-gray-900 dark:text-white`}
                    />
                    {errors.name && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                        <AlertCircle className="h-3 w-3" /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Tax ID */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Vergi No / EIN
                    </label>
                    <input
                      value={formData.taxId}
                      onChange={(e) => updateField('taxId', e.target.value)}
                      placeholder="12-3456789"
                      className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Telefon
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      E-Posta
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="info@firma.com"
                        type="email"
                        className={`w-full rounded-xl border ${errors.email ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                        <AlertCircle className="h-3 w-3" /> {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-xl border border-border dark:border-border-dark p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Adres Bilgileri</h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Address */}
                  <div className="col-span-3">
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Adres
                    </label>
                    <input
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Sokak, mahalle, bina no"
                      className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Şehir
                    </label>
                    <input
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="New York"
                      className={`w-full rounded-xl border ${errors.city ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white`}
                    />
                    {errors.city && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                        <AlertCircle className="h-3 w-3" /> {errors.city}
                      </p>
                    )}
                  </div>

                  {/* Country */}
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Ülke
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial */}
              <div className="rounded-xl border border-border dark:border-border-dark p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-amber-500" />
                  <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Finansal Bilgiler</h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Currency */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Para Birimi
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => updateField('currency', e.target.value)}
                      className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                      ))}
                    </select>
                  </div>

                  {/* Risk Limit */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Risk Limiti
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        value={formData.riskLimit}
                        onChange={(e) => updateField('riskLimit', e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="50000"
                        type="text"
                        className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Vade (Gün)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={formData.paymentTermDays}
                        onChange={(e) => updateField('paymentTermDays', parseInt(e.target.value))}
                        className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                      >
                        <option value={0}>Peşin</option>
                        <option value={7}>7 Gün</option>
                        <option value={15}>15 Gün</option>
                        <option value={30}>30 Gün</option>
                        <option value={45}>45 Gün</option>
                        <option value={60}>60 Gün</option>
                        <option value={90}>90 Gün</option>
                        <option value={120}>120 Gün</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agency Reference (only for non-agency accounts) */}
              {formData.type !== 'AGENCY' && agencies.length > 0 && (
                <div className="rounded-xl border border-border dark:border-border-dark p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 className="h-4 w-4 text-purple-500" />
                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">Acente Bağlantısı</h3>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Getiren Acente (Opsiyonel)
                    </label>
                    <select
                      value={formData.referredByAgencyId}
                      onChange={(e) => updateField('referredByAgencyId', e.target.value)}
                      className="w-full rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                    >
                      <option value="">Direkt Müşteri (Acentesiz)</option>
                      {agencies.map((a: any) => (
                        <option key={a.id} value={a.agency?.id}>{a.code} – {a.name}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-[10px] text-gray-400">
                      Bu cariyi hangi acente getirdi? Komisyon hesaplamaları için önemlidir.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border dark:border-border-dark px-6 py-4 shrink-0 bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-gray-400">
                  {isEditMode ? 'Değişiklikler kaydedilecek' : 'Yeni cari kaydı oluşturulacak'}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="rounded-xl border border-border dark:border-border-dark px-5 py-2.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={createAccount.isPending}
                    className="rounded-xl bg-brand-600 px-6 py-2.5 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {createAccount.isPending ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Cari Oluştur'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
