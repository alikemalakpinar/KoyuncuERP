import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import StandardLayout from './layouts/StandardLayout'
import Dashboard from './pages/Dashboard'
import AccountsPage from './pages/AccountsPage'
import OrdersPage from './pages/OrdersPage'
import InventoryPage from './pages/InventoryPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProfitAnalysisPage from './pages/ProfitAnalysisPage'
import AgencyCommissionsPage from './pages/AgencyCommissionsPage'
import NewOrderModal from './components/modals/NewOrderModal'
import NewPaymentModal from './components/modals/NewPaymentModal'
import { ToastProvider } from './components/Toast'

export default function App() {
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  return (
    <ToastProvider>
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
    </ToastProvider>
  )
}
