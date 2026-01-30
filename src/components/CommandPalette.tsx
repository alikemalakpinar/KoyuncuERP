import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  BookOpen,
  BarChart3,
  Handshake,
} from 'lucide-react'

const commands = [
  { id: 'dashboard', label: 'Gösterge Paneli', icon: LayoutDashboard, path: '/' },
  { id: 'accounts', label: 'Cariler', icon: Users, path: '/accounts' },
  { id: 'orders', label: 'Siparişler', icon: ShoppingCart, path: '/orders' },
  { id: 'shipments', label: 'Sevkiyat', icon: Truck, path: '/shipments' },
  { id: 'commissions', label: 'Acente Hakedişleri', icon: Handshake, path: '/commissions' },
  { id: 'profit', label: 'Kâr Analizi', icon: BarChart3, path: '/profit' },
  { id: 'ledger', label: 'Muhasebe', icon: BookOpen, path: '/ledger' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  )

  const handleSelect = (path: string) => {
    navigate(path)
    setQuery('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl bg-white dark:bg-surface-dark-secondary shadow-glass border border-border dark:border-border-dark"
          >
            <div className="flex items-center gap-3 border-b border-border dark:border-border-dark px-4 py-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sayfa veya komut ara..."
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
              />
              <kbd className="rounded-md border border-border dark:border-border-dark px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                ESC
              </kbd>
            </div>

            <div className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-gray-400">
                  Sonuç bulunamadı
                </p>
              )}
              {filtered.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.path)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
                >
                  <cmd.icon className="h-4 w-4 text-gray-400" />
                  {cmd.label}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
