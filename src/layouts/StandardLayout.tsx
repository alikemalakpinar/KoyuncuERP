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
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen((v) => !v)
      }
      // New order shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault()
        onNewOrder?.()
      }
      // New payment shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === 'p' && e.shiftKey) {
        e.preventDefault()
        onNewPayment?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNewOrder, onNewPayment])

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

        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNewOrder={onNewOrder}
        onNewPayment={onNewPayment}
      />
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
    '/quotations': 'Teklifler',
    '/shipments': 'Sevkiyat',
    '/samples': 'Numuneler',
    '/export-docs': 'İhracat Belgeleri',
    '/cheques': 'Çek / Senet',
    '/waybills': 'İrsaliyeler',
    '/cash-book': 'Kasa Defteri',
    '/returns': 'Satış İadeleri',
    '/stock-count': 'Stok Sayım',
    '/pim': 'PIM (Ürün Bilgi)',
    '/chart-of-accounts': 'Hesap Planı',
    '/cost-centers': 'Maliyet Merkezleri',
    '/manufacturing': 'Üretim (MES)',
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
