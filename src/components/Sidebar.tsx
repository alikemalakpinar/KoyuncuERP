import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  BookOpen,
  FileText,
  Settings,
  BarChart3,
  Handshake,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Gösterge Paneli' },
  { to: '/accounts', icon: Users, label: 'Cariler' },
  { to: '/orders', icon: ShoppingCart, label: 'Siparişler' },
  { to: '/shipments', icon: Truck, label: 'Sevkiyat' },
  { to: '/commissions', icon: Handshake, label: 'Acente Hakedişleri' },
  { to: '/profit', icon: BarChart3, label: 'Kâr Analizi' },
  { to: '/ledger', icon: BookOpen, label: 'Muhasebe' },
  { to: '/documents', icon: FileText, label: 'Belgeler' },
]

export default function Sidebar() {
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

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
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

      {/* Settings */}
      <div className="border-t border-border dark:border-border-dark px-3 py-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <Settings className="h-[18px] w-[18px]" />
          <span>Ayarlar</span>
        </NavLink>
      </div>
    </aside>
  )
}
