import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, AlertCircle, ArrowLeft, Building2,
  MapPin, Users, Lock, ChevronRight,
} from 'lucide-react'
import { useAuth, roleLabels, type BranchInfo, type BranchUser } from '../contexts/AuthContext'

// ── Animations ─────────────────────────────────────────────

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
  }),
}

const transition = { type: 'spring', stiffness: 300, damping: 30 }

// ── Branch Card ────────────────────────────────────────────

const branchIcons: Record<string, string> = {
  IST: 'from-blue-500 to-indigo-600',
  ANK: 'from-red-500 to-rose-600',
  IZM: 'from-cyan-500 to-teal-600',
  USA: 'from-purple-500 to-violet-600',
}

function BranchCard({ branch, onClick }: { branch: BranchInfo; onClick: () => void }) {
  const gradient = branchIcons[branch.branchCode] ?? 'from-gray-500 to-gray-600'

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex flex-col items-center gap-3 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/10 p-6 hover:bg-white/[0.12] hover:border-white/20 transition-all overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity`} />

      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
        <Building2 className="h-8 w-8" />
      </div>

      <div className="text-center relative z-10">
        <p className="text-sm font-semibold text-white">{branch.branchName}</p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <MapPin className="h-3 w-3 text-slate-500" />
          <span className="text-xs text-slate-400">{branch.city}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
        <Users className="h-3 w-3 text-slate-400" />
        <span className="text-[11px] text-slate-400">{branch.userCount} kullanici</span>
      </div>
    </motion.button>
  )
}

// ── User Card ──────────────────────────────────────────────

function UserCard({ user, onClick }: { user: BranchUser; onClick: () => void }) {
  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/10 p-4 hover:bg-white/[0.12] hover:border-white/20 transition-all w-full text-left"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${user.avatarColor} text-white font-bold text-sm shadow-lg`}>
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
        <p className="text-xs text-slate-400">{roleLabels[user.role]}</p>
      </div>

      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
    </motion.button>
  )
}

// ── Main Login Page ────────────────────────────────────────

export default function LoginPage() {
  const {
    step, availableBranches, selectBranch, selectedBranchInfo,
    branchUsers, selectUser, selectedUser,
    login, goBackToUsers, goBackToBranches,
  } = useAuth()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(1)

  const handleSelectBranch = (branchId: string) => {
    setDirection(1)
    selectBranch(branchId)
  }

  const handleSelectUser = (userId: string) => {
    setDirection(1)
    setPassword('')
    setError('')
    selectUser(userId)
  }

  const handleBack = (target: 'branches' | 'users') => {
    setDirection(-1)
    setError('')
    setPassword('')
    if (target === 'branches') goBackToBranches()
    else goBackToUsers()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Sifre giriniz')
      return
    }
    setError('')
    setLoading(true)
    const success = await login(password)
    if (!success) {
      setError('Yanlis sifre. Tekrar deneyin.')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />

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
            Hali ve tekstil ticaretinizi uctan uca yonetin. Siparisler, stok, muhasebe, faturalar ve raporlar tek platformda.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { label: 'Coklu Sube', value: '4' },
              { label: 'Sube Izolasyonu', value: 'Tam' },
              { label: 'Cift Tarafli', value: 'Muhasebe' },
              { label: 'FIFO Stok', value: 'Aktif' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side - Netflix flow */}
      <div className="flex w-full lg:w-[55%] items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-xl">
              K
            </div>
            <h1 className="text-2xl font-bold text-white">Koyuncu ERP</h1>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Branch Selection */}
            {step === 'branch' && (
              <motion.div
                key="branch"
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-white">Sube Secin</h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Giris yapmak istediginiz subeyi secin
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {availableBranches.map((branch) => (
                    <BranchCard
                      key={branch.branchId}
                      branch={branch}
                      onClick={() => handleSelectBranch(branch.branchId)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: User Selection */}
            {step === 'user' && selectedBranchInfo && (
              <motion.div
                key="user"
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                <button
                  onClick={() => handleBack('branches')}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Subelere don
                </button>

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${branchIcons[selectedBranchInfo.branchCode] ?? 'from-gray-500 to-gray-600'} text-white`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedBranchInfo.branchName}</h2>
                      <p className="text-xs text-slate-400">{selectedBranchInfo.city}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mt-3">Kullaniciyi secin</p>
                </div>

                <div className="space-y-2">
                  {branchUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onClick={() => handleSelectUser(user.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Password Entry */}
            {step === 'password' && selectedUser && selectedBranchInfo && (
              <motion.div
                key="password"
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                <button
                  onClick={() => handleBack('users')}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kullanicilara don
                </button>

                <div className="rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/10 p-8">
                  {/* User avatar */}
                  <div className="flex flex-col items-center mb-8">
                    <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${selectedUser.avatarColor} text-white font-bold text-2xl shadow-xl mb-4`}>
                      {selectedUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <h3 className="text-lg font-bold text-white">{selectedUser.fullName}</h3>
                    <p className="text-sm text-slate-400">
                      {roleLabels[selectedUser.role]} &middot; {selectedBranchInfo.branchName}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Sifre
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError('') }}
                          className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-11 py-3 text-white placeholder-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors text-sm"
                          placeholder="Sifrenizi girin"
                          autoFocus
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
                        'Giris Yap'
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
