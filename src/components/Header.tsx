import { Link } from 'react-router-dom'
import { Search, Plus, CreditCard, ChevronRight } from 'lucide-react'

interface Props {
  breadcrumbs: { label: string; href: string }[]
  onSearchClick: () => void
}

export default function Header({ breadcrumbs, onSearchClick }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border dark:border-border-dark px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-[13px]">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            )}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-900 dark:text-white">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.href}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search bar */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 rounded-xl border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-dark-secondary px-3 py-1.5 text-[13px] text-gray-500 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Ara...</span>
          <kbd className="ml-4 rounded-md border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ⌘K
          </kbd>
        </button>

        {/* Quick actions */}
        <button className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-brand-700 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Yeni Sipariş
        </button>
        <button className="flex items-center gap-1.5 rounded-xl border border-border dark:border-border-dark px-3 py-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors">
          <CreditCard className="h-3.5 w-3.5" />
          Tahsilat
        </button>
      </div>
    </header>
  )
}
