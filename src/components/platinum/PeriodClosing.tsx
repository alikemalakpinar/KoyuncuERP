/**
 * Period Closing Modal – Lock financial periods
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Shield, AlertTriangle, Calendar, CheckCircle, Info } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
}

// Demo: current lock state
const demoCurrentLock = {
  closingDate: '2025-12-31',
  lockedBy: 'Ahmet Koyuncu',
  createdAt: '2026-01-05',
}

const lockHistory = [
  { date: '2025-12-31', by: 'Ahmet Koyuncu', at: '05 Oca 2026' },
  { date: '2025-09-30', by: 'Ahmet Koyuncu', at: '03 Eki 2025' },
  { date: '2025-06-30', by: 'Mehmet Yılmaz', at: '02 Tem 2025' },
  { date: '2025-03-31', by: 'Ahmet Koyuncu', at: '02 Nis 2025' },
]

export default function PeriodClosing({ open, onClose }: Props) {
  const { user } = useAuth()
  const [closingDate, setClosingDate] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')

  const canLock = closingDate && new Date(closingDate) <= new Date() && new Date(closingDate) > new Date(demoCurrentLock.closingDate)
  const confirmMatch = confirmText === 'KİLİTLE'

  const handleLock = () => {
    if (!confirmMatch) return
    // In production: call window.api.finance.lockPeriod(...)
    setStep('success')
  }

  const handleClose = () => {
    setStep('form')
    setClosingDate('')
    setNotes('')
    setConfirmText('')
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 dark:border-border-dark/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Dönem Kilitleme</h2>
                <p className="text-xs text-gray-500">Geçmiş dönem kayıtlarını koruma altına alın</p>
              </div>
            </div>
            <button onClick={handleClose} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {step === 'success' ? (
              <div className="text-center py-6 space-y-3">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dönem Kilitlendi</h3>
                <p className="text-sm text-gray-500">
                  {closingDate} tarihine kadar olan tüm kayıtlar artık değiştirilemez.
                </p>
                <button onClick={handleClose} className="mt-4 rounded-xl bg-brand-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-brand-700 transition-colors">
                  Kapat
                </button>
              </div>
            ) : (
              <>
                {/* Current Status */}
                <div className="rounded-xl bg-surface-secondary/50 dark:bg-surface-dark-secondary/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Mevcut Kilit</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400">Kilit Tarihi</p>
                      <p className="font-medium text-gray-900 dark:text-white">{new Date(demoCurrentLock.closingDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Kilitleyen</p>
                      <p className="font-medium text-gray-900 dark:text-white">{demoCurrentLock.lockedBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Tarih</p>
                      <p className="font-medium text-gray-900 dark:text-white">{new Date(demoCurrentLock.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                </div>

                {step === 'form' ? (
                  <>
                    {/* Date Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                        <Calendar className="inline h-4 w-4 mr-1 -mt-0.5" />
                        Yeni Kapanış Tarihi
                      </label>
                      <input
                        type="date"
                        value={closingDate}
                        onChange={e => setClosingDate(e.target.value)}
                        min={demoCurrentLock.closingDate}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                      {closingDate && new Date(closingDate) <= new Date(demoCurrentLock.closingDate) && (
                        <p className="text-xs text-red-500 mt-1">Yeni tarih mevcut kilit tarihinden sonra olmalıdır</p>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Notlar (Opsiyonel)</label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Dönem kapanış notu..."
                        className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                      />
                    </div>

                    {/* Warning */}
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                          <p className="font-medium">Bu işlem geri alınamaz!</p>
                          <p>Kilitlenen dönem için hiçbir yevmiye kaydı, stok hareketi veya fatura oluşturulamaz, düzenlenemez veya silinemez.</p>
                        </div>
                      </div>
                    </div>

                    {/* Lock History */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Geçmiş Kilitler</p>
                      <div className="space-y-1">
                        {lockHistory.map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-gray-400 py-1">
                            <span className="font-mono">{new Date(h.date).toLocaleDateString('tr-TR')}</span>
                            <span>{h.by}</span>
                            <span>{h.at}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => canLock && setStep('confirm')}
                      disabled={!canLock}
                      className="w-full rounded-xl bg-amber-600 text-white py-2.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Devam Et
                    </button>
                  </>
                ) : (
                  <>
                    {/* Confirm Step */}
                    <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 text-center">
                      <Lock className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        {new Date(closingDate).toLocaleDateString('tr-TR')} tarihine kadar tüm kayıtları kilitlemek üzeresiniz.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                        Onaylamak için <span className="font-bold text-red-600">KİLİTLE</span> yazın
                      </label>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={e => setConfirmText(e.target.value)}
                        placeholder="KİLİTLE"
                        className="w-full rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-surface-dark px-4 py-2.5 text-sm text-center font-mono tracking-widest focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setStep('form'); setConfirmText('') }}
                        className="flex-1 rounded-xl border border-border dark:border-border-dark py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-surface-secondary transition-colors"
                      >
                        Geri
                      </button>
                      <button
                        onClick={handleLock}
                        disabled={!confirmMatch}
                        className="flex-1 rounded-xl bg-red-600 text-white py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Dönemi Kilitle
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
