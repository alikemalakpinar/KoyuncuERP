import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  chart?: React.ReactNode
}

export default function KpiCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  chart,
}: Props) {
  const changeColor = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-red-500 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400',
  }[changeType]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="kpi-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
          <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        </div>
        <span className={`text-xs font-medium ${changeColor}`}>{change}</span>
      </div>

      <div className="mt-3">
        <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {value}
        </p>
      </div>

      {chart && <div className="mt-3 h-12">{chart}</div>}
    </motion.div>
  )
}
