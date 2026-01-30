/**
 * IPC Data Hooks
 *
 * Wraps window.api calls with TanStack Query for caching.
 * Falls back to demo data when running outside Electron (Vite dev server).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hasIpc, getApi } from '../lib/ipc'
import {
  useAccounts as useDemoAccounts,
  useAccountHealth as useDemoAccountHealth,
  useProfitAnalysis as useDemoProfitAnalysis,
  useAgencyPerformance as useDemoAgencyPerformance,
  useDashboardKpis as useDemoKpis,
} from './useAnalytics'
import { DEMO_ORDERS } from './useDemoOrders'

// ── Accounts ───────────────────────────────────────────────

export function useAccountsQuery(filters?: { type?: string; search?: string }) {
  const demoData = useDemoAccounts()

  return useQuery({
    queryKey: ['accounts', filters],
    queryFn: async () => {
      if (hasIpc()) return getApi().accounts.list(filters)
      // Demo fallback with client-side filtering
      let result = demoData
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        result = result.filter(
          (a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q),
        )
      }
      if (filters?.type) {
        result = result.filter((a) => a.type === filters.type)
      }
      return result
    },
    staleTime: 30_000,
  })
}

export function useAccountQuery(id: string | null) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      if (!id) return null
      if (hasIpc()) return getApi().accounts.get(id)
      return null
    },
    enabled: !!id,
  })
}

export function useAccountHealthQuery(accountId: string | null) {
  const demoHealth = useDemoAccountHealth(accountId || undefined)

  return useQuery({
    queryKey: ['accountHealth', accountId],
    queryFn: async () => {
      if (!accountId) return null
      if (hasIpc()) return getApi().analytics.accountHealth(accountId)
      return demoHealth
    },
    enabled: !!accountId,
    staleTime: 60_000,
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return getApi().accounts.create(data)
      return { success: true, data: { id: crypto.randomUUID(), ...data } }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

// ── Orders ─────────────────────────────────────────────────

export function useOrdersQuery(filters?: { status?: string; accountId?: string }) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      if (hasIpc()) return getApi().orders.list(filters)
      // Demo fallback
      let result = DEMO_ORDERS
      if (filters?.status) result = result.filter((o) => o.status === filters.status)
      return result
    },
    staleTime: 30_000,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return getApi().orders.create(data)
      return { success: true, data: { id: crypto.randomUUID(), orderNo: 'ORD-DEMO', ...data } }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (hasIpc()) return getApi().orders.updateStatus(id, status)
      return { success: true }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (hasIpc()) return getApi().orders.cancel(id, reason)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

// ── Ledger ─────────────────────────────────────────────────

export function useRecordCollection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return getApi().ledger.collection(data)
      return { success: true }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return getApi().ledger.payment(data)
      return { success: true }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

// ── Analytics ──────────────────────────────────────────────

export function useDashboardKpisQuery() {
  const demoKpis = useDemoKpis()

  return useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: async () => {
      if (hasIpc()) return getApi().analytics.dashboardKpis()
      return demoKpis
    },
    staleTime: 60_000,
  })
}

export function useProfitAnalysisQuery() {
  const demoData = useDemoProfitAnalysis()

  return useQuery({
    queryKey: ['analytics', 'profit'],
    queryFn: async () => {
      if (hasIpc()) return getApi().analytics.profitAnalysis()
      return demoData
    },
    staleTime: 60_000,
  })
}

export function useAgencyPerformanceQuery() {
  const demoData = useDemoAgencyPerformance()

  return useQuery({
    queryKey: ['analytics', 'agency'],
    queryFn: async () => {
      if (hasIpc()) return getApi().analytics.agencyPerformance()
      return demoData
    },
    staleTime: 60_000,
  })
}
