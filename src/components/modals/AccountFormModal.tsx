/**
 * Account Form Modal — Cari Ekleme/Düzenleme
 * Completely redesigned with modern UI
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Building2, Users, Globe, UserCheck, Phone, Mail, MapPin,
  CreditCard, Calendar, AlertCircle, Shield, Link2, ChevronRight,
  Briefcase, User, Percent, Ship, Sparkles, Check, Info, Megaphone,
} from 'lucide-react'
import { useCreateAccount, useAccountsQuery } from '../../hooks/useIpc'
import { useToast } from '../Toast'

type AccountType = 'CUSTOMER' | 'SUPPLIER' | 'AGENCY' | 'BOTH' | 'INDIVIDUAL' | 'MARKETER'

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
  // Agency specific fields
  agencyRegion: string
  defaultCommission: string
  parentAgencyId: string
  marketerId: string
  // Marketer specific fields
  marketerDefaultRate: string
}

interface Props {
  open: boolean
  onClose: () => void
  editAccount?: any
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
  agencyRegion: '',
  defaultCommission: '5',
  parentAgencyId: '',
  marketerId: '',
  marketerDefaultRate: '2',
}

const typeConfig: Record<AccountType, {
  label: string
  description: string
  icon: typeof Building2
  color: string
  bgColor: string
  borderColor: string
}> = {
  CUSTOMER: {
    label: 'Şirket/Mağaza',
    description: 'B2B müşteri',
    icon: Building2,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  INDIVIDUAL: {
    label: 'Bireysel',
    description: 'Son kullanıcı',
    icon: User,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800'
  },
  AGENCY: {
    label: 'Acenta',
    description: 'Tur operatörü',
    icon: Ship,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  MARKETER: {
    label: 'Pazarlamacı',
    description: 'Acenta bulucu',
    icon: Megaphone,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/30',
    borderColor: 'border-pink-200 dark:border-pink-800'
  },
  SUPPLIER: {
    label: 'Tedarikçi',
    description: 'Mal sağlayıcı',
    icon: Globe,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  BOTH: {
    label: 'Karma',
    description: 'Müşteri & Tedarikçi',
    icon: Users,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
}

const countries = [
  { code: 'US', name: 'Amerika Birleşik Devletleri', flag: '🇺🇸' },
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'DE', name: 'Almanya', flag: '🇩🇪' },
  { code: 'GB', name: 'Birleşik Krallık', flag: '🇬🇧' },
  { code: 'FR', name: 'Fransa', flag: '🇫🇷' },
  { code: 'IT', name: 'İtalya', flag: '🇮🇹' },
  { code: 'ES', name: 'İspanya', flag: '🇪🇸' },
  { code: 'NL', name: 'Hollanda', flag: '🇳🇱' },
  { code: 'BE', name: 'Belçika', flag: '🇧🇪' },
  { code: 'SA', name: 'Suudi Arabistan', flag: '🇸🇦' },
  { code: 'AE', name: 'BAE', flag: '🇦🇪' },
  { code: 'QA', name: 'Katar', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuveyt', flag: '🇰🇼' },
  { code: 'GR', name: 'Yunanistan', flag: '🇬🇷' },
]

const currencies = [
  { code: 'USD', symbol: '$', name: 'ABD Doları', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası', flag: '🇹🇷' },
  { code: 'GBP', symbol: '£', name: 'İngiliz Sterlini', flag: '🇬🇧' },
  { code: 'SAR', symbol: 'ر.س', name: 'Suudi Riyali', flag: '🇸🇦' },
  { code: 'AED', symbol: 'د.إ', name: 'BAE Dirhemi', flag: '🇦🇪' },
]

const regions = [
  'Ege', 'Akdeniz', 'Marmara', 'Karadeniz', 'İç Anadolu',
  'Orta Doğu', 'Avrupa', 'Kuzey Amerika', 'Asya', 'Diğer'
]

// Step indicator
const steps = [
  { id: 'type', label: 'Tür', icon: Sparkles },
  { id: 'info', label: 'Bilgiler', icon: Building2 },
  { id: 'finance', label: 'Finans', icon: CreditCard },
]

export default function AccountFormModal({ open, onClose, editAccount, onUpdate }: Props) {
  const { data: accounts = [] } = useAccountsQuery()
  const createAccount = useCreateAccount()
  const { toast } = useToast()

  const isEditMode = !!editAccount
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<AccountFormData>(emptyFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get agencies for the referredBy dropdown
  const agencies = useMemo(() => {
    return accounts.filter((a: any) => a.type === 'AGENCY')
  }, [accounts])

  // Get marketers for dropdown
  const marketers = useMemo(() => {
    return accounts.filter((a: any) => a.type === 'MARKETER')
  }, [accounts])

  // Auto-generate code for new accounts
  const generateCode = () => {
    const prefixMap: Record<AccountType, string> = {
      CUSTOMER: 'C',
      INDIVIDUAL: 'IND',
      SUPPLIER: 'SP',
      AGENCY: 'AG',
      BOTH: 'CB',
      MARKETER: 'MKT',
    }
    const prefix = prefixMap[formData.type]
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
          agencyRegion: editAccount.agency?.region || '',
          defaultCommission: editAccount.agency?.defaultCommission?.toString() || '5',
          parentAgencyId: editAccount.agency?.parentAgencyId || '',
          marketerId: editAccount.agency?.marketerId || '',
          marketerDefaultRate: editAccount.marketer?.defaultRate?.toString() || '2',
        })
        setCurrentStep(1) // Skip type selection in edit mode
      } else {
        const newCode = generateCode()
        setFormData({ ...emptyFormData, code: newCode })
        setCurrentStep(0)
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

    if (!formData.name.trim()) newErrors.name = 'İsim gerekli'

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta girin'
    }

    // Check for duplicate code
    if (!isEditMode || formData.code !== editAccount?.code) {
      const existingAccount = accounts.find((a: any) => a.code === formData.code)
      if (existingAccount) {
        newErrors.code = 'Bu kod kullanılıyor'
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
            toast('success', `${typeConfig[formData.type].label} "${formData.name}" oluşturuldu`)
            onClose()
          } else {
            toast('error', res.error || 'Oluşturulamadı')
          }
        },
        onError: () => {
          toast('error', 'Bir hata oluştu')
        },
      })
    }
  }

  const canProceed = () => {
    if (currentStep === 0) return true
    if (currentStep === 1) return formData.name.trim().length > 0
    return true
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(prev => prev + 1)
    } else if (currentStep === steps.length - 1) {
      handleSubmit()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl z-50 flex flex-col rounded-3xl bg-white dark:bg-surface-dark shadow-2xl border border-border/50 dark:border-border-dark/50 overflow-hidden md:max-h-[85vh]"
          >
            {/* Gradient Header */}
            <div className="relative overflow-hidden">
              <div className={`absolute inset-0 ${typeConfig[formData.type].bgColor} opacity-50`} />
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent dark:from-surface-dark/80" />

              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      key={formData.type}
                      initial={{ scale: 0.8, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${typeConfig[formData.type].bgColor} ${typeConfig[formData.type].borderColor} border-2 shadow-lg`}
                    >
                      <TypeIcon className={`h-7 w-7 ${typeConfig[formData.type].color}`} />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEditMode ? 'Cari Düzenle' : 'Yeni Cari Oluştur'}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {isEditMode ? `${editAccount.code} - ${editAccount.name}` : typeConfig[formData.type].description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-xl p-2.5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Step Indicator */}
                {!isEditMode && (
                  <div className="flex items-center gap-2 mt-5">
                    {steps.map((step, idx) => {
                      const StepIcon = step.icon
                      const isActive = idx === currentStep
                      const isCompleted = idx < currentStep
                      return (
                        <div key={step.id} className="flex items-center gap-2">
                          <button
                            onClick={() => idx < currentStep && setCurrentStep(idx)}
                            disabled={idx > currentStep}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              isActive
                                ? `${typeConfig[formData.type].bgColor} ${typeConfig[formData.type].color} shadow-sm`
                                : isCompleted
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <StepIcon className="h-3.5 w-3.5" />
                            )}
                            {step.label}
                          </button>
                          {idx < steps.length - 1 && (
                            <ChevronRight className={`h-4 w-4 ${isCompleted ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                {/* Step 0: Type Selection */}
                {currentStep === 0 && !isEditMode && (
                  <motion.div
                    key="step-type"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cari Türünü Seçin</h3>
                      <p className="text-sm text-gray-500 mt-1">Bu cari ile nasıl bir ilişkiniz olacak?</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(Object.entries(typeConfig) as [AccountType, typeof typeConfig.CUSTOMER][]).map(([type, cfg]) => {
                        const Icon = cfg.icon
                        const isSelected = formData.type === type
                        return (
                          <motion.button
                            key={type}
                            type="button"
                            onClick={() => updateField('type', type)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all ${
                              isSelected
                                ? `${cfg.bgColor} ${cfg.borderColor} shadow-lg ring-2 ring-offset-2 ${cfg.color.replace('text-', 'ring-')}`
                                : 'border-border dark:border-border-dark hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2"
                              >
                                <div className={`rounded-full p-1 ${cfg.bgColor}`}>
                                  <Check className={`h-3 w-3 ${cfg.color}`} />
                                </div>
                              </motion.div>
                            )}
                            <div className={`rounded-xl p-3 ${isSelected ? cfg.bgColor : 'bg-gray-100 dark:bg-gray-800'}`}>
                              <Icon className={`h-6 w-6 ${isSelected ? cfg.color : 'text-gray-400'}`} />
                            </div>
                            <div className="text-center">
                              <span className={`block text-sm font-semibold ${isSelected ? cfg.color : 'text-gray-700 dark:text-gray-300'}`}>
                                {cfg.label}
                              </span>
                              <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {cfg.description}
                              </span>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-info"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    {/* Code & Name Row */}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                          Cari Kodu
                        </label>
                        <input
                          value={formData.code}
                          onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                          className={`w-full rounded-xl border-2 ${errors.code ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2.5 text-sm font-mono outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900 transition-all text-gray-900 dark:text-white`}
                        />
                        {errors.code && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                            <AlertCircle className="h-3 w-3" /> {errors.code}
                          </p>
                        )}
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                          {formData.type === 'INDIVIDUAL' ? 'Ad Soyad' : 'Firma Ünvanı'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={formData.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          placeholder={formData.type === 'INDIVIDUAL' ? 'Ahmet Yılmaz' : 'ABC Halıcılık Ltd.'}
                          className={`w-full rounded-xl border-2 ${errors.name ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-border dark:border-border-dark'} bg-surface-secondary dark:bg-surface-dark-tertiary px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900 transition-all text-gray-900 dark:text-white`}
                        />
                        {errors.name && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                            <AlertCircle className="h-3 w-3" /> {errors.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Info Card */}
                    <div className="rounded-2xl border border-border dark:border-border-dark bg-gradient-to-br from-white to-gray-50/50 dark:from-surface-dark dark:to-surface-dark-secondary p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                          <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">İletişim Bilgileri</h4>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {formData.type === 'INDIVIDUAL' ? 'TC / Pasaport' : 'Vergi No'}
                          </label>
                          <input
                            value={formData.taxId}
                            onChange={(e) => updateField('taxId', e.target.value)}
                            placeholder={formData.type === 'INDIVIDUAL' ? '12345678901' : '123-456-7890'}
                            className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Telefon</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              value={formData.phone}
                              onChange={(e) => updateField('phone', e.target.value)}
                              placeholder="+90 532 123 45 67"
                              className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">E-Posta</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              value={formData.email}
                              onChange={(e) => updateField('email', e.target.value)}
                              placeholder="info@firma.com"
                              type="email"
                              className={`w-full rounded-xl border ${errors.email ? 'border-red-400' : 'border-border dark:border-border-dark'} bg-white dark:bg-surface-dark-tertiary pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white`}
                            />
                          </div>
                          {errors.email && (
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-red-500">
                              <AlertCircle className="h-2.5 w-2.5" /> {errors.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address Card */}
                    <div className="rounded-2xl border border-border dark:border-border-dark bg-gradient-to-br from-white to-gray-50/50 dark:from-surface-dark dark:to-surface-dark-secondary p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Adres</h4>
                      </div>

                      <div className="space-y-3">
                        <input
                          value={formData.address}
                          onChange={(e) => updateField('address', e.target.value)}
                          placeholder="Sokak, mahalle, bina no"
                          className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            value={formData.city}
                            onChange={(e) => updateField('city', e.target.value)}
                            placeholder="Şehir"
                            className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                          />
                          <select
                            value={formData.country}
                            onChange={(e) => updateField('country', e.target.value)}
                            className="col-span-2 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                          >
                            {countries.map((c) => (
                              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Agency Specific Fields */}
                    {formData.type === 'AGENCY' && (
                      <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-surface-dark p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <Ship className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Acenta Bilgileri</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Bölge</label>
                            <select
                              value={formData.agencyRegion}
                              onChange={(e) => updateField('agencyRegion', e.target.value)}
                              className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                            >
                              <option value="">Seçiniz...</option>
                              {regions.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Varsayılan Komisyon %
                            </label>
                            <div className="relative">
                              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                value={formData.defaultCommission}
                                onChange={(e) => updateField('defaultCommission', e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder="5"
                                className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Üst Acenta</label>
                            <select
                              value={formData.parentAgencyId}
                              onChange={(e) => updateField('parentAgencyId', e.target.value)}
                              className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                            >
                              <option value="">Ana Acenta (Üst yok)</option>
                              {agencies.filter((a: any) => a.id !== editAccount?.id).map((a: any) => (
                                <option key={a.id} value={a.agency?.id}>{a.code} – {a.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Pazarlamacı (Opsiyon)</label>
                            <select
                              value={formData.marketerId}
                              onChange={(e) => updateField('marketerId', e.target.value)}
                              className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary px-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                            >
                              <option value="">Pazarlamacı yok</option>
                              {marketers.map((m: any) => (
                                <option key={m.id} value={m.marketer?.id}>{m.code} – {m.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-purple-100/50 dark:bg-purple-900/20 px-3 py-2">
                          <Info className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-purple-700 dark:text-purple-300">
                            Pazarlamacı, bu acentayı size getiren kişidir. Satışlardan komisyon alacaktır.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Marketer Specific Fields */}
                    {formData.type === 'MARKETER' && (
                      <div className="rounded-2xl border border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-white dark:from-pink-900/20 dark:to-surface-dark p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                            <Megaphone className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Pazarlamacı Bilgileri</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Varsayılan Komisyon Oranı %
                            </label>
                            <div className="relative">
                              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                value={formData.marketerDefaultRate}
                                onChange={(e) => updateField('marketerDefaultRate', e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder="2"
                                className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-pink-100/50 dark:bg-pink-900/20 px-3 py-2">
                          <Info className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-pink-700 dark:text-pink-300">
                            Pazarlamacılar acenta bulur ve getirdikleri acentaların satışlarından komisyon alır.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Financial Info */}
                {currentStep === 2 && (
                  <motion.div
                    key="step-finance"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    {/* Financial Settings Card */}
                    <div className="rounded-2xl border border-border dark:border-border-dark bg-gradient-to-br from-white to-gray-50/50 dark:from-surface-dark dark:to-surface-dark-secondary p-5">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                          <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Finansal Ayarlar</h4>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Para Birimi
                          </label>
                          <select
                            value={formData.currency}
                            onChange={(e) => updateField('currency', e.target.value)}
                            className="w-full rounded-xl border-2 border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                          >
                            {currencies.map((c) => (
                              <option key={c.code} value={c.code}>{c.flag} {c.code} ({c.symbol})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Risk Limiti
                          </label>
                          <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              value={formData.riskLimit}
                              onChange={(e) => updateField('riskLimit', e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="50000"
                              className="w-full rounded-xl border-2 border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white tabular-nums"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                            Vade (Gün)
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                              value={formData.paymentTermDays}
                              onChange={(e) => updateField('paymentTermDays', parseInt(e.target.value))}
                              className="w-full rounded-xl border-2 border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
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

                    {/* Agency Reference (for non-agency, non-marketer) */}
                    {!['AGENCY', 'MARKETER', 'SUPPLIER'].includes(formData.type) && agencies.length > 0 && (
                      <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-900/10 dark:to-surface-dark p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <Link2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Acenta Bağlantısı</h4>
                        </div>

                        <select
                          value={formData.referredByAgencyId}
                          onChange={(e) => updateField('referredByAgencyId', e.target.value)}
                          className="w-full rounded-xl border-2 border-border dark:border-border-dark bg-white dark:bg-surface-dark-tertiary px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition text-gray-900 dark:text-white"
                        >
                          <option value="">Direkt Müşteri (Acentesiz)</option>
                          {agencies.map((a: any) => (
                            <option key={a.id} value={a.agency?.id}>{a.code} – {a.name}</option>
                          ))}
                        </select>
                        <p className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Bu müşteriyi hangi acenta getirdi? Komisyon hesaplamalarında kullanılır.
                        </p>
                      </div>
                    )}

                    {/* Summary Preview */}
                    <div className="rounded-2xl border border-dashed border-border dark:border-border-dark p-5">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Özet</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tür:</span>
                          <span className={`font-medium ${typeConfig[formData.type].color}`}>{typeConfig[formData.type].label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Kod:</span>
                          <span className="font-mono font-medium text-gray-900 dark:text-white">{formData.code}</span>
                        </div>
                        <div className="flex justify-between col-span-2">
                          <span className="text-gray-500">Ünvan:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{formData.name || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Para Birimi:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{formData.currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Risk Limiti:</span>
                          <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                            {currencies.find(c => c.code === formData.currency)?.symbol}{parseInt(formData.riskLimit || '0').toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t border-border dark:border-border-dark px-6 py-4 bg-gray-50/50 dark:bg-surface-dark-tertiary/50">
              <div className="flex items-center justify-between">
                <div>
                  {currentStep > 0 && !isEditMode && (
                    <button
                      onClick={prevStep}
                      className="rounded-xl border border-border dark:border-border-dark px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-surface-dark transition-colors"
                    >
                      Geri
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    İptal
                  </button>
                  <motion.button
                    onClick={nextStep}
                    disabled={!canProceed() || createAccount.isPending}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`rounded-xl px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      currentStep === steps.length - 1
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700'
                    }`}
                  >
                    {createAccount.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Kaydediliyor...
                      </span>
                    ) : currentStep === steps.length - 1 ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        {isEditMode ? 'Güncelle' : 'Oluştur'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Devam
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
