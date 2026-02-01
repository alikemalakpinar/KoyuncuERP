/**
 * Skeleton loading placeholder components.
 */

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />
}

export function KpiSkeleton() {
  return (
    <div className="kpi-card animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-9 w-9 rounded-xl skeleton" />
        <div className="h-5 w-14 rounded-lg skeleton" />
      </div>
      <div className="mt-2.5 space-y-2">
        <div className="h-3 w-20 rounded skeleton" />
        <div className="h-7 w-28 rounded skeleton" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className={`h-4 rounded skeleton ${i === 0 ? 'w-32' : 'w-16'}`} />
        </td>
      ))}
    </tr>
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-5 animate-pulse space-y-3">
      <div className="h-4 w-24 rounded skeleton" />
      <div className="h-20 w-full rounded-xl skeleton" />
      <div className="h-3 w-16 rounded skeleton" />
    </div>
  )
}
