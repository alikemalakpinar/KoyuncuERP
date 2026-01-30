import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'

export default function OrdersPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Siparişler
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sipariş takibi ve yönetimi
        </p>
      </div>

      <div className="card flex flex-col items-center justify-center py-20">
        <ShoppingCart className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Sipariş listesi yakında burada görüntülenecek
        </p>
      </div>
    </motion.div>
  )
}
