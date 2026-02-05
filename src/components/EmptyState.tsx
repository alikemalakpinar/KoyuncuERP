/**
 * Empty State Components
 * Beautiful illustrations for when there's no data to display
 */

import { motion } from 'framer-motion'
import {
  Package, Users, ShoppingCart, FileText, Truck, CreditCard,
  Search, Filter, AlertCircle, Clock, Inbox, FolderOpen,
  BarChart2, Settings, Bell, Calendar, type LucideIcon,
} from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
}: EmptyStateProps) {
  const sizes = {
    sm: { icon: 'h-8 w-8', title: 'text-sm', desc: 'text-xs', padding: 'py-6' },
    md: { icon: 'h-12 w-12', title: 'text-base', desc: 'text-sm', padding: 'py-12' },
    lg: { icon: 'h-16 w-16', title: 'text-lg', desc: 'text-sm', padding: 'py-16' },
  }

  const s = sizes[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center ${s.padding}`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-4 rounded-2xl bg-surface-secondary dark:bg-surface-dark-tertiary p-4"
      >
        <Icon className={`${s.icon} text-gray-300 dark:text-gray-600`} />
      </motion.div>
      <h3 className={`font-semibold text-gray-900 dark:text-white ${s.title}`}>{title}</h3>
      {description && (
        <p className={`mt-1 text-gray-500 dark:text-gray-400 max-w-sm ${s.desc}`}>{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-4 flex items-center gap-2">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="rounded-xl border border-border dark:border-border-dark px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="rounded-xl bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

// Preset empty states for common scenarios

export function NoSearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="Sonuç bulunamadı"
      description={`"${query}" araması için sonuç bulunamadı. Farklı bir arama terimi deneyin.`}
      action={{ label: 'Aramayı Temizle', onClick: onClear }}
    />
  )
}

export function NoFilterResults({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      icon={Filter}
      title="Filtre sonucu boş"
      description="Seçili filtrelerle eşleşen kayıt bulunamadı."
      action={{ label: 'Filtreleri Temizle', onClick: onClear }}
    />
  )
}

export function NoOrders({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="Henüz sipariş yok"
      description="İlk siparişinizi oluşturarak başlayın."
      action={{ label: 'Yeni Sipariş', onClick: onCreate }}
    />
  )
}

export function NoCustomers({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Henüz müşteri yok"
      description="İlk müşterinizi ekleyerek başlayın."
      action={{ label: 'Yeni Müşteri', onClick: onCreate }}
    />
  )
}

export function NoProducts({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="Henüz ürün yok"
      description="İlk ürününüzü ekleyerek başlayın."
      action={{ label: 'Yeni Ürün', onClick: onCreate }}
    />
  )
}

export function NoInvoices({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="Henüz fatura yok"
      description="Siparişlerinizden fatura oluşturabilirsiniz."
      action={{ label: 'Fatura Oluştur', onClick: onCreate }}
    />
  )
}

export function NoShipments({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={Truck}
      title="Henüz sevkiyat yok"
      description="Hazır siparişleriniz için sevkiyat oluşturun."
      action={{ label: 'Sevkiyat Oluştur', onClick: onCreate }}
    />
  )
}

export function NoPayments() {
  return (
    <EmptyState
      icon={CreditCard}
      title="Henüz ödeme kaydı yok"
      description="Bu hesap için kayıtlı ödeme bulunmuyor."
    />
  )
}

export function NoActivity() {
  return (
    <EmptyState
      icon={Clock}
      title="Henüz aktivite yok"
      description="Son aktiviteler burada görünecek."
      size="sm"
    />
  )
}

export function NoNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="Bildirim yok"
      description="Yeni bildirimler burada görünecek."
      size="sm"
    />
  )
}

export function NoReports() {
  return (
    <EmptyState
      icon={BarChart2}
      title="Rapor verisi yok"
      description="Seçili dönem için veri bulunamadı."
    />
  )
}

export function NoData() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Veri bulunamadı"
      description="Görüntülenecek veri bulunmuyor."
    />
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Bir hata oluştu"
      description="Veriler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin."
      action={onRetry ? { label: 'Tekrar Dene', onClick: onRetry } : undefined}
    />
  )
}

export function ComingSoon() {
  return (
    <EmptyState
      icon={Settings}
      title="Yakında"
      description="Bu özellik üzerinde çalışıyoruz. Çok yakında kullanıma sunulacak."
    />
  )
}

export function NoUpcoming() {
  return (
    <EmptyState
      icon={Calendar}
      title="Yaklaşan iş yok"
      description="Önümüzdeki günlerde planlanmış iş bulunmuyor."
      size="sm"
    />
  )
}
