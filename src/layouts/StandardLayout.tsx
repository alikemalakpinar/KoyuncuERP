import { useState, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import CommandPalette from '../components/CommandPalette'

interface Props {
  children: ReactNode
  onNewOrder?: () => void
  onNewPayment?: () => void
}

export default function StandardLayout({ children, onNewOrder, onNewPayment }: Props) {
  const [commandOpen, setCommandOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const breadcrumbs = buildBreadcrumbs(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-surface dark:bg-surface-dark">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          breadcrumbs={breadcrumbs}
          onSearchClick={() => setCommandOpen(true)}
          onNewOrder={onNewOrder}
          onNewPayment={onNewPayment}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  )
}

function buildBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const map: Record<string, string> = {
    '/': 'Gösterge Paneli',
    '/accounts': 'Cariler',
    '/orders': 'Siparişler',
    '/inventory': 'Ürün Kataloğu',
    '/stock-analysis': 'Stok & Analiz',
    '/invoices': 'Faturalar',
    '/commissions': 'Komisyonlar',
    '/performance': 'Performans',
    '/accounting': 'Muhasebe',
    '/profit': 'Kâr Analizi',
    '/reports': 'Raporlar',
    '/settings': 'Ayarlar',
    '/activity': 'Aktivite Günlüğü',
  }

  if (pathname === '/') {
    return [{ label: 'Gösterge Paneli', href: '/' }]
  }

  const crumbs = [{ label: 'Ana Sayfa', href: '/' }]
  const segments = pathname.split('/').filter(Boolean)
  let path = ''
  for (const seg of segments) {
    path += `/${seg}`
    crumbs.push({ label: map[path] || seg, href: path })
  }
  return crumbs
}
