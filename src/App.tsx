import { useState } from 'react'
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
import NewOrderModal from './components/modals/NewOrderModal'
import NewPaymentModal from './components/modals/NewPaymentModal'
import { ToastProvider } from './components/Toast'

function AuthenticatedApp() {
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  return (
    <StandardLayout
      onNewOrder={() => setOrderModalOpen(true)}
      onNewPayment={() => setPaymentModalOpen(true)}
    >
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
        </Routes>
      </AnimatePresence>

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

function AppContent() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <AuthenticatedApp />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}
