import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, LogIn, Shield, AlertCircle } from 'lucide-react'
import { useAuth, roleLabels, type UserRole } from '../contexts/AuthContext'

const roleCards: { email: string; password: string; role: UserRole; description: string }[] = [
  { email: 'patron@koyuncu.com', password: 'patron123', role: 'patron', description: 'Tam erişim - Tüm maliyet, kâr ve yönetim bilgileri' },
  { email: 'mudur@koyuncu.com', password: 'mudur123', role: 'mudur', description: 'Operasyonel erişim - Kısmi maliyet ve raporlar' },
  { email: 'muhasebe@koyuncu.com', password: 'muhasebe123', role: 'muhasebeci', description: 'Finans odaklı - Muhasebe, fatura ve raporlar' },
  { email: 'satis@koyuncu.com', password: 'satis123', role: 'satis_elemani', description: 'Satış odaklı - Sadece satış fiyatları ve siparişler' },
  { email: 'acente@koyuncu.com', password: 'acente123', role: 'acente', description: 'Acente görünümü - Kendi komisyon ve siparişleri' },
]

const roleColors: Record<UserRole, string> = {
  patron: 'from-amber-500 to-orange-600',
  mudur: 'from-blue-500 to-indigo-600',
  muhasebeci: 'from-emerald-500 to-teal-600',
  satis_elemani: 'from-purple-500 to-violet-600',
  acente: 'from-rose-500 to-pink-600',
}

const roleIcons: Record<UserRole, string> = {
  patron: 'P',
  mudur: 'M',
  muhasebeci: 'H',
  satis_elemani: 'S',
  acente: 'A',
}

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const success = await login(email, password)
    if (!success) {
      setError('Geçersiz e-posta veya şifre')
    }
    setLoading(false)
  }

  const quickLogin = async (card: typeof roleCards[0]) => {
    setEmail(card.email)
    setPassword(card.password)
    setError('')
    setLoading(true)
    await login(card.email, card.password)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-2xl shadow-xl shadow-brand-600/30">
              K
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Koyuncu</h1>
              <p className="text-lg text-blue-300">Enterprise Resource Planning</p>
            </div>
          </div>

          <p className="text-xl text-slate-300 leading-relaxed max-w-md mb-12">
            Halı ve tekstil ticaretinizi uçtan uca yönetin. Siparişler, stok, muhasebe, faturalar ve raporlar tek platformda.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { label: 'Siparişler', value: '2,847' },
              { label: 'Aktif Cariler', value: '156' },
              { label: 'Ürün Çeşidi', value: '1,240' },
              { label: 'Aylık Ciro', value: '$1.2M' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm"
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side - login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-xl">
              K
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Koyuncu ERP</h1>
            </div>
          </div>

          <div className="rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Giriş Yap</h2>
              <p className="text-sm text-slate-400 mt-1">Hesabınıza giriş yapın</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">E-posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors text-sm"
                  placeholder="ornek@koyuncu.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Şifre</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors text-sm pr-11"
                    placeholder="Şifrenizi girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 py-3 text-sm font-semibold text-white hover:from-brand-500 hover:to-brand-600 transition-all disabled:opacity-50 shadow-lg shadow-brand-600/25"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Giriş Yap
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick login role cards */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-slate-500" />
              <p className="text-xs text-slate-500 font-medium">Hızlı Giriş (Demo)</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {roleCards.map((card) => (
                <button
                  key={card.role}
                  onClick={() => quickLogin(card)}
                  className="group flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 text-left hover:bg-white/[0.07] hover:border-white/10 transition-all"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${roleColors[card.role]} text-white font-bold text-sm shrink-0 shadow-lg`}>
                    {roleIcons[card.role]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{roleLabels[card.role]}</p>
                    <p className="text-xs text-slate-500 truncate">{card.description}</p>
                  </div>
                  <LogIn className="h-4 w-4 text-slate-600 group-hover:text-brand-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
