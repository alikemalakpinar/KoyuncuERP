import { motion } from 'framer-motion'
import { Building2, ArrowRight } from 'lucide-react'
import { useAuth, roleLabels } from '../contexts/AuthContext'

export default function BranchSelectorPage() {
  const { user, branches, selectBranch, logout } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-2xl shadow-xl shadow-brand-600/30">
            K
          </div>
          <h1 className="text-2xl font-bold text-white">Şube Seçin</h1>
          <p className="mt-1 text-sm text-slate-400">
            Merhaba {user?.fullName}, devam etmek için bir şube seçin
          </p>
        </div>

        <div className="space-y-3">
          {branches.map((branch) => (
            <button
              key={branch.branchId}
              onClick={() => selectBranch(branch.branchId)}
              className="group flex w-full items-center gap-4 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/10 p-5 text-left hover:bg-white/[0.12] hover:border-brand-500/30 transition-all"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600/20 text-brand-400">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-white">{branch.branchName}</p>
                <p className="text-sm text-slate-400">
                  {branch.branchCode} &middot; {roleLabels[branch.role]}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-brand-400 transition-colors" />
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          className="mt-6 w-full text-center text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Farklı hesapla giriş yap
        </button>
      </motion.div>
    </div>
  )
}
