/**
 * Skeleton Loader Components
 * Beautiful loading placeholders for various UI elements
 */

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
}

// Base skeleton with shimmer animation
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />
}

// Text line skeleton
export function SkeletonText({ width = 'w-full', className = '' }: { width?: string; className?: string }) {
  return <Skeleton className={`h-4 rounded-lg ${width} ${className}`} />
}

// Circle skeleton (for avatars)
export function SkeletonCircle({ size = 'h-10 w-10' }: { size?: string }) {
  return <Skeleton className={`${size} rounded-full`} />
}

// KPI Card skeleton
export function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-3 w-16 rounded mb-2" />
          <Skeleton className="h-6 w-20 rounded" />
        </div>
      </div>
    </div>
  )
}

// Table row skeleton
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-border/50 dark:border-border-dark/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 rounded ${i === 0 ? 'w-16' : i === 1 ? 'w-32' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border dark:border-border-dark">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-3 w-16 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-5">
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle size="h-8 w-8" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 rounded mb-2" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
      <Skeleton className="h-4 w-full rounded mb-2" />
      <Skeleton className="h-4 w-3/4 rounded" />
    </div>
  )
}

// Activity feed skeleton
export function ActivityFeedSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="divide-y divide-border/50 dark:divide-border-dark/50">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40 rounded mb-1.5" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      ))}
    </div>
  )
}

// Chart skeleton with animated bars
export function ChartSkeleton({ height = 'h-48' }: { height?: string }) {
  return (
    <div className={`rounded-xl bg-surface-secondary dark:bg-surface-dark-tertiary p-4 ${height}`}>
      <div className="flex items-end justify-between h-full gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ height: '20%' }}
            animate={{ height: `${30 + Math.random() * 50}%` }}
            transition={{ duration: 0.5, delay: i * 0.05, repeat: Infinity, repeatType: 'reverse', repeatDelay: 1 }}
            className="flex-1 skeleton rounded-t-lg"
          />
        ))}
      </div>
    </div>
  )
}

// Pipeline skeleton (for order pipeline)
export function PipelineSkeleton() {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-1 rounded-lg bg-surface-secondary dark:bg-surface-dark-tertiary p-3">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton className="h-5 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}

// List skeleton
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-4">
          <SkeletonCircle size="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 rounded mb-2" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

// Form skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-24 rounded mb-2" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  )
}

// Dashboard skeleton - full page loading state
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48 rounded mb-2" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-12 gap-4">
        {/* Activity feed */}
        <div className="col-span-5 rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary overflow-hidden">
          <div className="p-4 border-b border-border dark:border-border-dark">
            <Skeleton className="h-5 w-32 rounded" />
          </div>
          <ActivityFeedSkeleton items={5} />
        </div>

        {/* Chart */}
        <div className="col-span-4 rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary p-5">
          <Skeleton className="h-5 w-28 rounded mb-4" />
          <ChartSkeleton />
        </div>

        {/* Quick actions */}
        <div className="col-span-3 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// Top customers table skeleton
export function TopCustomersSkeleton() {
  return (
    <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-secondary overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border dark:border-border-dark">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border/50 dark:border-border-dark/50">
            {['#', 'Müşteri', 'Ciro', 'Sipariş', 'Trend'].map((_, i) => (
              <th key={i} className="px-5 py-2 text-left">
                <Skeleton className="h-3 w-12 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border/30 dark:border-border-dark/30">
              <td className="px-5 py-2"><Skeleton className="h-3 w-4 rounded" /></td>
              <td className="px-5 py-2">
                <Skeleton className="h-4 w-32 rounded mb-1" />
                <Skeleton className="h-3 w-20 rounded" />
              </td>
              <td className="px-5 py-2"><Skeleton className="h-4 w-20 rounded" /></td>
              <td className="px-5 py-2"><Skeleton className="h-4 w-8 rounded" /></td>
              <td className="px-5 py-2"><Skeleton className="h-4 w-12 rounded" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
