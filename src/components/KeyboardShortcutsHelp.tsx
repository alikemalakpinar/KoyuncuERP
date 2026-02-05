/**
 * Keyboard Shortcuts Help Modal
 * Shows available keyboard shortcuts
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard, Command, ArrowUp } from 'lucide-react'
import { getAllShortcuts } from '../hooks/useKeyboardShortcuts'

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)
  const shortcuts = getAllShortcuts()

  // Listen for '?' key to open help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-[201] -translate-x-1/2 -translate-y-1/2 w-full max-w-lg"
          >
            <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border dark:border-border-dark px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
                    <Keyboard className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Klavye Kısayolları</h2>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">Hızlı erişim için kısayollar</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Navigation */}
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Navigasyon</h3>
                  <div className="space-y-2">
                    {shortcuts.navigation.map((item) => (
                      <div key={item.keys} className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-600 dark:text-gray-300">{item.description}</span>
                        <ShortcutKeys keys={item.keys} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Aksiyonlar</h3>
                  <div className="space-y-2">
                    {shortcuts.actions.map((item) => (
                      <div key={item.keys} className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-600 dark:text-gray-300">{item.description}</span>
                        <ShortcutKeys keys={item.keys} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border dark:border-border-dark px-5 py-3 bg-surface-secondary/50 dark:bg-surface-dark-tertiary/50">
                <p className="text-[11px] text-gray-400 text-center">
                  Bu pencereyi açmak için <ShortcutKeys keys="?" inline /> tuşuna basın
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Shortcut key badge component
function ShortcutKeys({ keys, inline = false }: { keys: string; inline?: boolean }) {
  const keyParts = keys.split('').map((char, i) => {
    // Handle special characters
    if (char === '⌘') return <Command key={i} className="h-3 w-3" />
    if (char === '⇧') return <ArrowUp key={i} className="h-3 w-3" />
    if (char === '⌥') return <span key={i} className="text-[10px]">Alt</span>
    return <span key={i} className="text-[11px] font-medium">{char}</span>
  })

  if (inline) {
    return (
      <kbd className="inline-flex items-center gap-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-gray-500 dark:text-gray-400 mx-1">
        {keyParts}
      </kbd>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {keys.split('').map((char, i) => (
        <kbd
          key={i}
          className="flex h-6 min-w-6 items-center justify-center rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 text-gray-500 dark:text-gray-400"
        >
          {char === '⌘' ? <Command className="h-3 w-3" /> :
           char === '⇧' ? <ArrowUp className="h-3 w-3" /> :
           char === '⌥' ? <span className="text-[10px]">Alt</span> :
           <span className="text-[11px] font-medium">{char}</span>}
        </kbd>
      ))}
    </div>
  )
}
