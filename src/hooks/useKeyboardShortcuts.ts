/**
 * Keyboard Shortcuts System
 * Global keyboard shortcuts for power users
 */

import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface ShortcutAction {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

// Global shortcuts registry
const shortcuts: ShortcutAction[] = []

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  // Navigation shortcuts
  const navigationShortcuts: ShortcutAction[] = [
    { key: 'h', ctrl: true, action: () => navigate('/'), description: 'Ana Sayfa' },
    { key: 'o', ctrl: true, action: () => navigate('/orders'), description: 'Siparişler' },
    { key: 'c', ctrl: true, shift: true, action: () => navigate('/accounts'), description: 'Cariler' },
    { key: 'p', ctrl: true, action: () => navigate('/products'), description: 'Ürünler' },
    { key: 's', ctrl: true, shift: true, action: () => navigate('/shipments'), description: 'Sevkiyatlar' },
    { key: 'r', ctrl: true, action: () => navigate('/reports'), description: 'Raporlar' },
  ]

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in an input
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    const allShortcuts = [...shortcuts, ...navigationShortcuts]

    for (const shortcut of allShortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey)
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
      const altMatch = shortcut.alt ? event.altKey : !event.altKey
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault()
        shortcut.action()
        return
      }
    }
  }, [navigate])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    shortcuts: [...shortcuts],
    navigationShortcuts,
  }
}

// Hook for registering page-specific shortcuts
export function useRegisterShortcut(shortcut: ShortcutAction) {
  useEffect(() => {
    shortcuts.push(shortcut)
    return () => {
      const index = shortcuts.findIndex(
        s => s.key === shortcut.key && s.ctrl === shortcut.ctrl && s.shift === shortcut.shift
      )
      if (index > -1) shortcuts.splice(index, 1)
    }
  }, [shortcut.key, shortcut.ctrl, shortcut.shift])
}

// Format shortcut key for display
export function formatShortcut(shortcut: ShortcutAction): string {
  const parts: string[] = []
  if (shortcut.ctrl) parts.push('⌘')
  if (shortcut.shift) parts.push('⇧')
  if (shortcut.alt) parts.push('⌥')
  parts.push(shortcut.key.toUpperCase())
  return parts.join('')
}

// All available shortcuts for help modal
export function getAllShortcuts() {
  return {
    navigation: [
      { keys: '⌘H', description: 'Ana Sayfa' },
      { keys: '⌘O', description: 'Siparişler' },
      { keys: '⌘⇧C', description: 'Cariler' },
      { keys: '⌘P', description: 'Ürünler' },
      { keys: '⌘⇧S', description: 'Sevkiyatlar' },
      { keys: '⌘R', description: 'Raporlar' },
    ],
    actions: [
      { keys: '⌘K', description: 'Hızlı Arama (Yakında)' },
      { keys: '⌘N', description: 'Yeni Kayıt (Yakında)' },
      { keys: 'Esc', description: 'Modal/Panel Kapat' },
      { keys: '?', description: 'Kısayol Yardımı' },
    ],
  }
}
