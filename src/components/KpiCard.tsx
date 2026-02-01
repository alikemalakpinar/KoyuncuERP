import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { type LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

interface Props {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  chart?: React.ReactNode
  delay?: number
}

// Animated number/text that counts up on mount
function AnimatedValue({ value }: { value: string }) {
  const [displayed, setDisplayed] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    if (prevRef.current !== value) {
      setDisplayed(value)
      prevRef.current = value
    }
  }, [value])

  return (
    <motion.span
      key={displayed}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {displayed}
    </motion.span>
  )
}

const changeIcons = {
  positive: ArrowUpRight,
  negative: ArrowDownRight,
  neutral: Minus,
}

export default function KpiCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  chart,
  delay = 0,
}: Props) {
  const changeColor = {
    positive: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/15',
    negative: 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/15',
    neutral: 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800',
  }[changeType]

  const ChangeIcon = changeIcons[changeType]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: delay * 0.06 }}
      className="kpi-card group"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/15 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/25 transition-colors">
          <Icon className="h-[18px] w-[18px] text-brand-600 dark:text-brand-400" />
        </div>
        <div className={`flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[11px] font-semibold ${changeColor}`}>
          <ChangeIcon className="h-3 w-3" />
          {change}
        </div>
      </div>

      <div className="mt-2.5">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          {title}
        </p>
        <p className="mt-0.5 text-[22px] font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
          <AnimatedValue value={value} />
        </p>
      </div>

      {chart && <div className="mt-2 h-10">{chart}</div>}
    </motion.div>
  )
}
