import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

export default function AccountsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Cariler
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Müşteri ve tedarikçi hesaplarını yönetin
        </p>
      </div>

      <div className="card flex flex-col items-center justify-center py-20">
        <Users className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Cari listesi yakında burada görüntülenecek
        </p>
      </div>
    </motion.div>
  )
}
