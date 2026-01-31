import { useState, Component, type ReactNode } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import StandardLayout from './layouts/StandardLayout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import AccountsPage from './pages/AccountsPage'
import OrdersPage from './pages/OrdersPage'
import InventoryPage from './pages/InventoryPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProfitAnalysisPage from './pages/ProfitAnalysisPage'
import AgencyCommissionsPage from './pages/AgencyCommissionsPage'
import AccountingPage from './pages/AccountingPage'
import InvoicePage from './pages/InvoicePage'
import ReportsPage from './pages/ReportsPage'
import StockAnalysisPage from './pages/StockAnalysisPage'
import PerformancePage from './pages/PerformancePage'
import SettingsPage from './pages/SettingsPage'
import OrderDetailPage from './pages/OrderDetailPage'
import ActivityLogPage from './pages/ActivityLogPage'
import QuotationsPage from './pages/QuotationsPage'
import ShipmentsPage from './pages/ShipmentsPage'
import SamplesPage from './pages/SamplesPage'
import ExportDocsPage from './pages/ExportDocsPage'
import NewOrderModal from './components/modals/NewOrderModal'
import NewPaymentModal from './components/modals/NewPaymentModal'
import { ToastProvider } from './components/Toast'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// ── Error Boundary ─────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-screen items-center justify-center bg-surface dark:bg-surface-dark p-6">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Bir hata olustu
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'Beklenmeyen bir hata meydana geldi.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Sayfayi Yenile
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ── Page Error Boundary (lighter, inline) ──────────────────

class PageErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Sayfa yuklenemedi
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm text-center">
            {this.state.error?.message || 'Bu sayfada bir hata olustu.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tekrar Dene
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// ── Authenticated App ──────────────────────────────────────

function AuthenticatedApp() {
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  return (
    <StandardLayout
      onNewOrder={() => setOrderModalOpen(true)}
      onNewPayment={() => setPaymentModalOpen(true)}
    >
      <PageErrorBoundary>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/:id" element={<ProductDetailPage />} />
            <Route path="/profit" element={<ProfitAnalysisPage />} />
            <Route path="/commissions" element={<AgencyCommissionsPage />} />
            <Route path="/accounting" element={<AccountingPage />} />
            <Route path="/invoices" element={<InvoicePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/stock-analysis" element={<StockAnalysisPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/activity" element={<ActivityLogPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/samples" element={<SamplesPage />} />
            <Route path="/export-docs" element={<ExportDocsPage />} />
          </Routes>
        </AnimatePresence>
      </PageErrorBoundary>

      <NewOrderModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
      />
      <NewPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </StandardLayout>
  )
}

// ── App Content ────────────────────────────────────────────

function AppContent() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <AuthenticatedApp />
}

// ── Root App ───────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
