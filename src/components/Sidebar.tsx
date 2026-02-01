import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, ShoppingCart, BookOpen,
  FileText, Settings, BarChart3, Handshake, Package,
  Receipt, TrendingUp, Award, LogOut, Activity, Building2,
  ClipboardList, Ship, Palette, Stamp, ChevronsLeft, ChevronsRight,
  FileCheck, Truck, Wallet,
} from 'lucide-react'
import { useAuth, roleLabels, type UserRole } from '../contexts/AuthContext'

const roleColors: Record<UserRole, string> = {
  OWNER: 'from-amber-500 to-orange-600',
  ADMIN: 'from-blue-500 to-indigo-600',
  MANAGER: 'from-cyan-500 to-blue-600',
  ACCOUNTANT: 'from-emerald-500 to-teal-600',
  SALES: 'from-purple-500 to-violet-600',
  VIEWER: 'from-gray-400 to-gray-500',
}

// Section grouping for nav items
interface NavItem {
  to: string
  icon: typeof LayoutDashboard
  label: string
  show: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

export default function Sidebar() {
  const { user, activeBranch, role, logout, hasPermission } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const sections: NavSection[] = [
    {
      title: 'Ana Menü',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Gösterge Paneli', show: true },
        { to: '/accounts', icon: Users, label: 'Cariler', show: role !== 'VIEWER' },
      ],
    },
    {
      title: 'Satış',
      items: [
        { to: '/quotations', icon: ClipboardList, label: 'Teklifler', show: role !== 'VIEWER' },
        { to: '/orders', icon: ShoppingCart, label: 'Siparişler', show: true },
        { to: '/samples', icon: Palette, label: 'Numuneler', show: role !== 'VIEWER' },
      ],
    },
    {
      title: 'Operasyon',
      items: [
        { to: '/inventory', icon: Package, label: 'Ürün Kataloğu', show: role !== 'VIEWER' },
        { to: '/stock-analysis', icon: TrendingUp, label: 'Stok & Analiz', show: role !== 'VIEWER' },
        { to: '/shipments', icon: Ship, label: 'Sevkiyat', show: role !== 'VIEWER' },
        { to: '/export-docs', icon: Stamp, label: 'İhracat Belgeleri', show: role !== 'VIEWER' && role !== 'SALES' },
      ],
    },
    {
      title: 'Finans',
      items: [
        { to: '/invoices', icon: Receipt, label: 'Faturalar', show: hasPermission('create_invoice') || hasPermission('view_accounting') },
        { to: '/waybills', icon: Truck, label: 'İrsaliyeler', show: hasPermission('create_invoice') || hasPermission('view_accounting') },
        { to: '/cheques', icon: FileCheck, label: 'Çek / Senet', show: hasPermission('view_accounting') },
        { to: '/cash-book', icon: Wallet, label: 'Kasa Defteri', show: hasPermission('view_accounting') },
        { to: '/commissions', icon: Handshake, label: 'Komisyonlar', show: true },
        { to: '/accounting', icon: BookOpen, label: 'Muhasebe', show: hasPermission('view_accounting') },
      ],
    },
    {
      title: 'Analitik',
      items: [
        { to: '/performance', icon: Award, label: 'Performans', show: role !== 'SALES' && role !== 'VIEWER' },
        { to: '/profit', icon: BarChart3, label: 'Kâr Analizi', show: hasPermission('view_profit') },
        { to: '/reports', icon: FileText, label: 'Raporlar', show: hasPermission('view_reports') },
        { to: '/activity', icon: Activity, label: 'Aktivite Günlüğü', show: hasPermission('view_accounting') },
      ],
    },
    {
      title: '',
      items: [
        { to: '/settings', icon: Settings, label: 'Ayarlar', show: true },
      ],
    },
  ]

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative flex flex-col bg-white dark:bg-surface-dark-secondary border-r border-border dark:border-border-dark overflow-hidden"
    >
      {/* Logo + Collapse */}
      <div className="flex h-14 items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-xs shadow-glow-sm">
            K
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                  Koyuncu
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wider uppercase">
                  ERP
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Active Branch */}
      {activeBranch && !collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-brand-50/80 dark:bg-brand-900/15 px-3 py-1.5 border border-brand-100/60 dark:border-brand-800/20"
        >
          <Building2 className="h-3 w-3 text-brand-600 dark:text-brand-400 shrink-0" />
          <span className="text-[10px] font-medium text-brand-700 dark:text-brand-300 truncate">
            {activeBranch.branchName}
          </span>
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4">
        {sections.map((section) => {
          const visibleItems = section.items.filter(i => i.show)
          if (visibleItems.length === 0) return null
          return (
            <div key={section.title || 'settings'}>
              {section.title && !collapsed && (
                <p className="px-2.5 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              {section.title && collapsed && (
                <div className="mx-auto mb-1.5 h-px w-6 bg-border dark:bg-border-dark" />
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 rounded-xl ${collapsed ? 'px-0 py-2.5 mx-0.5' : 'px-2.5 py-2'} text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'text-brand-700 dark:text-brand-300'
                          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100/50 dark:border-brand-800/20"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <item.icon className={`relative z-10 shrink-0 ${collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4'}`} />
                        {!collapsed && (
                          <span className="relative z-10 truncate">{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-border dark:border-border-dark px-2.5 py-2.5 space-y-1.5 shrink-0">
        {user && role && (
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-2.5'} py-1.5`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${roleColors[role]} text-white font-bold text-[10px]`}>
              {user.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">{user.fullName}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{roleLabels[role]}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Çıkış Yap' : undefined}
          className={`flex w-full items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-2.5'} rounded-xl py-2 text-[13px] font-medium text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </motion.aside>
  )
}
