import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Plus, CreditCard, ChevronRight, Bell, Moon, Sun,
  AlertTriangle, DollarSign, Package, ShoppingCart, CheckCircle,
  Clock, X, LogOut, Settings, User, Building2, ChevronDown,
  Wifi, WifiOff, Keyboard,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, roleLabels, type UserRole } from '../contexts/AuthContext'

interface Props {
  breadcrumbs: { label: string; href: string }[]
  onSearchClick: () => void
  onNewOrder?: () => void
  onNewPayment?: () => void
}

interface Notification {
  id: string
  type: 'warning' | 'info' | 'success' | 'error'
  title: string
  message: string
  time: string
  read: boolean
}

const demoNotifications: Notification[] = [
  { id: 'n1', type: 'error', title: 'Vadesi Geçmiş Ödeme', message: 'Desert Home Decor - $33,984 fatura ödemesi 21 gün gecikmiş', time: '5 dk önce', read: false },
  { id: 'n2', type: 'warning', title: 'Kritik Stok Uyarısı', message: 'Bambu Halı - Doğal: Stok 12 adete düştü (min: 25)', time: '15 dk önce', read: false },
  { id: 'n3', type: 'success', title: 'Sipariş Teslim Edildi', message: 'ORD-2026-0147 - HomeStyle Inc. siparişi teslim edildi', time: '1 saat önce', read: false },
  { id: 'n4', type: 'info', title: 'Yeni Sipariş', message: 'Chicago Interiors - $56,100 tutarında yeni sipariş oluşturuldu', time: '2 saat önce', read: true },
  { id: 'n5', type: 'warning', title: 'Komisyon Onayı Bekliyor', message: 'ABC Trading LLC - $12,340 komisyon onay bekliyor', time: '3 saat önce', read: true },
  { id: 'n6', type: 'info', title: 'Stok Girişi', message: 'El Dokuma Halı - Kayseri: 40 adet stok girişi yapıldı', time: '4 saat önce', read: true },
]

const notifIcons = {
  warning: AlertTriangle,
  info: ShoppingCart,
  success: CheckCircle,
  error: DollarSign,
}

const notifColors = {
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  success: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  error: 'text-red-500 bg-red-50 dark:bg-red-900/20',
}

const roleColors: Record<UserRole, string> = {
  OWNER: 'from-amber-500 to-orange-600',
  ADMIN: 'from-blue-500 to-indigo-600',
  MANAGER: 'from-cyan-500 to-blue-600',
  ACCOUNTANT: 'from-emerald-500 to-teal-600',
  SALES: 'from-purple-500 to-violet-600',
  VIEWER: 'from-gray-400 to-gray-500',
}

export default function Header({ breadcrumbs, onSearchClick, onNewOrder, onNewPayment }: Props) {
  const { user, role, activeBranch, hasPermission, logout } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState(demoNotifications)
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
    setDarkMode(!darkMode)
  }

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const dismissNotif = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('') ?? '?'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border dark:border-border-dark px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-[13px]">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            )}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-900 dark:text-white">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.href}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search bar */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary px-3 py-1.5 text-[13px] text-gray-500 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Ara...</span>
          <kbd className="ml-4 rounded-md border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ⌘K
          </kbd>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="rounded-xl p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-96 rounded-2xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-border-dark">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Bildirimler</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Tümünü okundu işaretle
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      Bildirim bulunmuyor
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const Icon = notifIcons[notif.type]
                      return (
                        <div
                          key={notif.id}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 dark:border-border-dark/50 last:border-0 hover:bg-surface-secondary/50 dark:hover:bg-surface-dark-secondary/50 transition-colors ${
                            !notif.read ? 'bg-brand-50/30 dark:bg-brand-900/5' : ''
                          }`}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${notifColors[notif.type]}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-semibold text-gray-900 dark:text-white">{notif.title}</p>
                              {!notif.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                          </div>
                          <button
                            onClick={() => dismissNotif(notif.id)}
                            className="shrink-0 rounded-md p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick actions */}
        {hasPermission('create_invoice') && (
          <>
            <button
              onClick={onNewOrder}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Yeni Sipariş
            </button>
            <button
              onClick={onNewPayment}
              className="flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark px-3 py-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Tahsilat
            </button>
          </>
        )}

        {/* Profile Menu */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
          >
            {user && role && (
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${roleColors[role]} text-white font-bold text-[10px]`}>
                {initials}
              </div>
            )}
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-xl z-50 overflow-hidden"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-border dark:border-border-dark">
                  <div className="flex items-center gap-3">
                    {user && role && (
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${roleColors[role]} text-white font-bold text-sm`}>
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.fullName}</p>
                      <p className="text-[11px] text-gray-500">{role ? roleLabels[role] : ''}</p>
                    </div>
                  </div>
                  {activeBranch && (
                    <button
                      onClick={() => {
                        setShowProfile(false)
                        // Navigate to branch selection
                        window.location.href = '/branch-select'
                      }}
                      className="mt-2 w-full flex items-center justify-between gap-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/20 px-2.5 py-1.5 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-brand-600 dark:text-brand-400" />
                        <span className="text-[11px] font-medium text-brand-700 dark:text-brand-300">{activeBranch.branchName}</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>

                {/* Connection status */}
                <div className="px-4 py-2 border-b border-border/50 dark:border-border-dark/50">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-[11px] text-gray-500">Bağlantı aktif</span>
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 px-4 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Ayarlar
                  </Link>
                  <button
                    onClick={() => { setShowProfile(false) }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
                  >
                    <Keyboard className="h-4 w-4 text-gray-400" />
                    Klavye Kısayolları
                    <kbd className="ml-auto rounded-md border border-border dark:border-border-dark px-1.5 py-0.5 text-[10px] text-gray-400">?</kbd>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-border dark:border-border-dark py-1">
                  <button
                    onClick={() => { setShowProfile(false); logout() }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Çıkış Yap
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
