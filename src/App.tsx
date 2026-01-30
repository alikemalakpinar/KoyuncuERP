import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import StandardLayout from './layouts/StandardLayout'
import Dashboard from './pages/Dashboard'
import AccountsPage from './pages/AccountsPage'
import OrdersPage from './pages/OrdersPage'

export default function App() {
  return (
    <StandardLayout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Routes>
      </AnimatePresence>
    </StandardLayout>
  )
}
