import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, ShoppingCart, BookOpen,
  FileText, Settings, BarChart3, Handshake, Package,
  Receipt, TrendingUp, Award, LogOut, Activity, Building2,
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

export default function Sidebar() {
  const { user, activeBranch, role, logout, hasPermission } = useAuth()

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Gösterge Paneli', show: true },
    { to: '/accounts', icon: Users, label: 'Cariler', show: role !== 'VIEWER' },
    { to: '/orders', icon: ShoppingCart, label: 'Siparişler', show: true },
    { to: '/inventory', icon: Package, label: 'Ürün Kataloğu', show: role !== 'VIEWER' },
    { to: '/stock-analysis', icon: TrendingUp, label: 'Stok & Analiz', show: role !== 'VIEWER' },
    { to: '/invoices', icon: Receipt, label: 'Faturalar', show: hasPermission('create_invoice') || hasPermission('view_accounting') },
    { to: '/commissions', icon: Handshake, label: 'Komisyonlar', show: true },
    { to: '/performance', icon: Award, label: 'Performans', show: role !== 'SALES' && role !== 'VIEWER' },
    { to: '/accounting', icon: BookOpen, label: 'Muhasebe', show: hasPermission('view_accounting') },
    { to: '/profit', icon: BarChart3, label: 'Kâr Analizi', show: hasPermission('view_profit') },
    { to: '/reports', icon: FileText, label: 'Raporlar', show: hasPermission('view_reports') },
    { to: '/activity', icon: Activity, label: 'Aktivite Günlüğü', show: hasPermission('view_accounting') },
    { to: '/settings', icon: Settings, label: 'Ayarlar', show: true },
  ].filter(item => item.show)

  return (
    <aside className="glass flex w-[220px] flex-col border-r border-border dark:border-border-dark">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-sm">
          K
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
            Koyuncu
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            ERP System
          </p>
        </div>
      </div>

      {/* Active Branch */}
      {activeBranch && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 px-3 py-2 border border-brand-100 dark:border-brand-800/30">
          <Building2 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
          <span className="text-[11px] font-medium text-brand-700 dark:text-brand-300 truncate">
            {activeBranch.branchName}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-brand-50 dark:bg-brand-900/20"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className="relative z-10 h-[18px] w-[18px]" />
                <span className="relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-border dark:border-border-dark px-3 py-3 space-y-2">
        {user && role && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${roleColors[role]} text-white font-bold text-xs shrink-0`}>
              {user.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{roleLabels[role]}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  )
}
