import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, Users, ShoppingCart, Truck,
  BookOpen, BarChart3, Handshake, Package, Plus, CreditCard,
  FileText, Ship, Palette, Stamp, Settings, Activity,
  Award, TrendingUp, ArrowRight, Clock, Receipt,
  ClipboardList, Command,
} from 'lucide-react'

type CommandCategory = 'navigation' | 'action' | 'recent'

interface CommandItem {
  id: string
  label: string
  icon: typeof Search
  category: CommandCategory
  path?: string
  action?: () => void
  shortcut?: string
  description?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onNewOrder?: () => void
  onNewPayment?: () => void
}

export default function CommandPalette({ open, onClose, onNewOrder, onNewPayment }: Props) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands: CommandItem[] = [
    // Actions
    { id: 'new-order', label: 'Yeni Sipariş Oluştur', icon: Plus, category: 'action', action: onNewOrder, shortcut: '⌘N', description: 'Yeni sipariş formu aç' },
    { id: 'new-payment', label: 'Tahsilat Kaydet', icon: CreditCard, category: 'action', action: onNewPayment, shortcut: '⌘P', description: 'Yeni tahsilat kaydı' },
    { id: 'new-quotation', label: 'Yeni Teklif Oluştur', icon: ClipboardList, category: 'action', path: '/quotations', description: 'Proforma / teklif hazırla' },
    { id: 'new-sample', label: 'Numune Gönder', icon: Palette, category: 'action', path: '/samples', description: 'Yeni numune kaydı oluştur' },
    { id: 'new-shipment', label: 'Sevkiyat Oluştur', icon: Ship, category: 'action', path: '/shipments', description: 'Yeni sevkiyat kaydı' },
    // Navigation
    { id: 'dashboard', label: 'Gösterge Paneli', icon: LayoutDashboard, category: 'navigation', path: '/' },
    { id: 'accounts', label: 'Cariler', icon: Users, category: 'navigation', path: '/accounts' },
    { id: 'quotations', label: 'Teklifler', icon: ClipboardList, category: 'navigation', path: '/quotations' },
    { id: 'orders', label: 'Siparişler', icon: ShoppingCart, category: 'navigation', path: '/orders' },
    { id: 'samples', label: 'Numuneler', icon: Palette, category: 'navigation', path: '/samples' },
    { id: 'inventory', label: 'Ürün Kataloğu', icon: Package, category: 'navigation', path: '/inventory' },
    { id: 'stock', label: 'Stok & Analiz', icon: TrendingUp, category: 'navigation', path: '/stock-analysis' },
    { id: 'shipments', label: 'Sevkiyat & Lojistik', icon: Ship, category: 'navigation', path: '/shipments' },
    { id: 'export-docs', label: 'İhracat Belgeleri', icon: Stamp, category: 'navigation', path: '/export-docs' },
    { id: 'invoices', label: 'Faturalar', icon: Receipt, category: 'navigation', path: '/invoices' },
    { id: 'commissions', label: 'Komisyonlar', icon: Handshake, category: 'navigation', path: '/commissions' },
    { id: 'performance', label: 'Performans', icon: Award, category: 'navigation', path: '/performance' },
    { id: 'accounting', label: 'Muhasebe', icon: BookOpen, category: 'navigation', path: '/accounting' },
    { id: 'profit', label: 'Kâr Analizi', icon: BarChart3, category: 'navigation', path: '/profit' },
    { id: 'reports', label: 'Raporlar', icon: FileText, category: 'navigation', path: '/reports' },
    { id: 'activity', label: 'Aktivite Günlüğü', icon: Activity, category: 'navigation', path: '/activity' },
    { id: 'settings', label: 'Ayarlar', icon: Settings, category: 'navigation', path: '/settings' },
  ]

  const filtered = query
    ? commands.filter((c) => {
        const q = query.toLowerCase()
        return c.label.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q) ?? false)
      })
    : commands

  const groupedActions = filtered.filter(c => c.category === 'action')
  const groupedNav = filtered.filter(c => c.category === 'navigation')
  const allFiltered = [...groupedActions, ...groupedNav]

  const handleSelect = useCallback((cmd: CommandItem) => {
    if (cmd.action) {
      cmd.action()
    } else if (cmd.path) {
      navigate(cmd.path)
    }
    setQuery('')
    setSelectedIndex(0)
    onClose()
  }, [navigate, onClose])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, allFiltered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (allFiltered[selectedIndex]) handleSelect(allFiltered[selectedIndex])
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, selectedIndex, allFiltered, handleSelect])

  // Reset selection on query change
  useEffect(() => { setSelectedIndex(0) }, [query])

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  let runningIndex = -1

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-[18%] z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl bg-white dark:bg-surface-dark-secondary shadow-glass border border-border dark:border-border-dark"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-border dark:border-border-dark px-4 py-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sayfa, komut veya işlem ara..."
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
              />
              <div className="flex items-center gap-1.5">
                <kbd className="rounded-md border border-border dark:border-border-dark px-1.5 py-0.5 text-[10px] font-medium text-gray-400">↑↓</kbd>
                <kbd className="rounded-md border border-border dark:border-border-dark px-1.5 py-0.5 text-[10px] font-medium text-gray-400">↵</kbd>
                <kbd className="rounded-md border border-border dark:border-border-dark px-1.5 py-0.5 text-[10px] font-medium text-gray-400">ESC</kbd>
              </div>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
              {allFiltered.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-gray-400">
                  Sonuç bulunamadı
                </p>
              )}

              {/* Actions */}
              {groupedActions.length > 0 && (
                <>
                  <div className="px-4 py-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Hızlı İşlemler</p>
                  </div>
                  {groupedActions.map((cmd) => {
                    runningIndex++
                    const idx = runningIndex
                    return (
                      <button
                        key={cmd.id}
                        data-index={idx}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          selectedIndex === idx
                            ? 'bg-brand-50 dark:bg-brand-900/20'
                            : 'hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary'
                        }`}
                      >
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          selectedIndex === idx ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600' : 'bg-surface-secondary dark:bg-surface-dark-tertiary text-gray-400'
                        }`}>
                          <cmd.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-medium ${selectedIndex === idx ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>
                            {cmd.label}
                          </p>
                          {cmd.description && (
                            <p className="text-[11px] text-gray-400 truncate">{cmd.description}</p>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className="shrink-0 rounded-md border border-border dark:border-border-dark px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        <ArrowRight className={`h-3 w-3 shrink-0 ${selectedIndex === idx ? 'text-brand-500' : 'text-transparent'}`} />
                      </button>
                    )
                  })}
                </>
              )}

              {/* Navigation */}
              {groupedNav.length > 0 && (
                <>
                  <div className="px-4 py-1.5 mt-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sayfalar</p>
                  </div>
                  {groupedNav.map((cmd) => {
                    runningIndex++
                    const idx = runningIndex
                    return (
                      <button
                        key={cmd.id}
                        data-index={idx}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                          selectedIndex === idx
                            ? 'bg-brand-50 dark:bg-brand-900/20'
                            : 'hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary'
                        }`}
                      >
                        <cmd.icon className={`h-4 w-4 ${selectedIndex === idx ? 'text-brand-600' : 'text-gray-400'}`} />
                        <span className={`text-[13px] ${selectedIndex === idx ? 'text-brand-700 dark:text-brand-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                          {cmd.label}
                        </span>
                        <ArrowRight className={`ml-auto h-3 w-3 ${selectedIndex === idx ? 'text-brand-500' : 'text-transparent'}`} />
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border dark:border-border-dark px-4 py-2">
              <div className="flex items-center gap-1">
                <Command className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">Komut Paleti</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span>⌘K aç/kapa</span>
                <span>⌘N yeni sipariş</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
