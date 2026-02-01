/**
 * IPC Data Hooks
 *
 * Wraps window.api calls with TanStack Query for caching.
 * Falls back to demo data when running outside Electron (Vite dev server).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hasIpc, getApi, api } from '../lib/ipc'
import {
  useAccounts as useDemoAccounts,
  useAccountHealth as useDemoAccountHealth,
  useProfitAnalysis as useDemoProfitAnalysis,
  useAgencyPerformance as useDemoAgencyPerformance,
  useDashboardKpis as useDemoKpis,
} from './useAnalytics'
import { DEMO_ORDERS } from './useDemoOrders'
import { DEMO_PRODUCTS, DEMO_WAREHOUSES } from './useDemoProducts'

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

// ── Products & Inventory ──────────────────────────────────

export function useProductsQuery(filters?: { search?: string; material?: string }) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      if (hasIpc()) return getApi().products.list(filters)
      let result: any[] = DEMO_PRODUCTS
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        result = result.filter(
          (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
        )
      }
      if (filters?.material) {
        result = result.filter((p) => p.material === filters.material)
      }
      return result
    },
    staleTime: 30_000,
  })
}

export function useProductQuery(id: string | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null
      if (hasIpc()) return getApi().products.get(id)
      return DEMO_PRODUCTS.find((p) => p.id === id) || null
    },
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return getApi().products.create(data)
      return { success: true, data: { id: crypto.randomUUID(), ...data } }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useWarehousesQuery() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      if (hasIpc()) return getApi().inventory.warehouses()
      return DEMO_WAREHOUSES
    },
    staleTime: 300_000,
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { orderId: string }) => {
      if (hasIpc()) return getApi().invoices.createFromOrder(data)
      return { success: true, data: { id: crypto.randomUUID(), invoiceNo: `INV-DEMO-${Date.now().toString(36).toUpperCase()}` } }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

// ── Ledger Statement ──────────────────────────────────────

export function useAccountStatement(accountId: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['ledger', 'statement', accountId, dateFrom, dateTo],
    queryFn: async () => {
      if (hasIpc()) return getApi().ledger.statement(accountId, dateFrom, dateTo)
      return null
    },
    enabled: !!accountId,
    staleTime: 30_000,
  })
}

// ── Returns ───────────────────────────────────────────────

export function useReturnsQuery(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['returns', filters],
    queryFn: async () => {
      if (hasIpc()) return getApi().returns.list(filters)
      return []
    },
    staleTime: 30_000,
  })
}

export function useCreateReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return getApi().returns.create(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
  })
}

export function useApproveReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (hasIpc()) return getApi().returns.approve(id)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
  })
}

export function useCompleteReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, warehouseId }: { id: string; warehouseId: string }) => {
      if (hasIpc()) return getApi().returns.complete(id, warehouseId)
      return { success: true }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['returns'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useCancelReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      if (hasIpc()) return getApi().returns.cancel(id, reason)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns'] }),
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

// ── PIM: Attributes ─────────────────────────────────────────

export function usePimAttributesQuery() {
  return useQuery({
    queryKey: ['pim', 'attributes'],
    queryFn: async () => {
      if (hasIpc()) return api.pimAttributesList()
      return []
    },
    staleTime: 60_000,
  })
}

export function useCreatePimAttribute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.pimAttributesCreate(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pim', 'attributes'] }),
  })
}

export function usePimProductAttributes(productId: string | null) {
  return useQuery({
    queryKey: ['pim', 'productAttributes', productId],
    queryFn: async () => {
      if (!productId) return []
      if (hasIpc()) return api.pimAttributesGetProduct(productId)
      return []
    },
    enabled: !!productId,
  })
}

export function useSetPimAttributeValue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.pimAttributesSetValue(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pim', 'productAttributes'] }),
  })
}

// ── PIM: Categories ─────────────────────────────────────────

export function usePimCategoriesQuery() {
  return useQuery({
    queryKey: ['pim', 'categories'],
    queryFn: async () => {
      if (hasIpc()) return api.pimCategoriesList()
      return []
    },
    staleTime: 60_000,
  })
}

export function useCreatePimCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.pimCategoriesCreate(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pim', 'categories'] }),
  })
}

// ── PIM: UoM ────────────────────────────────────────────────

export function usePimUomQuery(category?: string) {
  return useQuery({
    queryKey: ['pim', 'uom', category],
    queryFn: async () => {
      if (hasIpc()) return api.pimUomList(category)
      return []
    },
    staleTime: 60_000,
  })
}

export function useCreatePimUom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.pimUomCreate(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pim', 'uom'] }),
  })
}

export function useAddPimUomConversion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.pimUomAddConversion(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pim', 'uom'] }),
  })
}

export function usePimUomConversionsQuery(productId?: string) {
  return useQuery({
    queryKey: ['pim', 'uomConversions', productId],
    queryFn: async () => {
      if (hasIpc()) return api.pimUomConversions(productId)
      return []
    },
    staleTime: 60_000,
  })
}

// ── PIM: Dimensions ─────────────────────────────────────────

export function usePimDimensionsQuery() {
  return useQuery({
    queryKey: ['pim', 'dimensions'],
    queryFn: async () => {
      if (hasIpc()) return api.pimDimensionsList()
      return []
    },
    staleTime: 60_000,
  })
}

export function useCreatePimDimension() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.pimDimensionsCreate(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pim', 'dimensions'] }),
  })
}

export function useAddPimDimensionValue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.pimDimensionsAddValue(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pim', 'dimensions'] }),
  })
}

export function useGeneratePimVariants() {
  return useMutation({
    mutationFn: async (axes: Record<string, string[]>) => {
      if (hasIpc()) return api.pimDimensionsGenerate(axes)
      return []
    },
  })
}

// ── Finance++: Chart of Accounts ────────────────────────────

export function useCoaListQuery() {
  return useQuery({
    queryKey: ['coa', 'list'],
    queryFn: async () => {
      if (hasIpc()) return api.coaList()
      return []
    },
    staleTime: 60_000,
  })
}

export function useCoaTreeQuery() {
  return useQuery({
    queryKey: ['coa', 'tree'],
    queryFn: async () => {
      if (hasIpc()) return api.coaTree()
      return []
    },
    staleTime: 60_000,
  })
}

export function useCreateCoaAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.coaCreate(data)
      return { success: true }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coa'] })
    },
  })
}

// ── Finance++: Cheques ──────────────────────────────────────

export function useChequesQuery(filters?: any) {
  return useQuery({
    queryKey: ['cheques', filters],
    queryFn: async () => {
      if (hasIpc()) return api.chequesList(filters)
      return []
    },
    staleTime: 30_000,
  })
}

export function useCreateCheque() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.chequesCreate(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cheques'] }),
  })
}

export function useTransitionCheque() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.chequesTransition(data)
      return { success: true }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cheques'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useChequeHistoryQuery(chequeId: string | null) {
  return useQuery({
    queryKey: ['cheques', 'history', chequeId],
    queryFn: async () => {
      if (!chequeId) return []
      if (hasIpc()) return api.chequesHistory(chequeId)
      return []
    },
    enabled: !!chequeId,
  })
}

// ── Finance++: Cost Centers ─────────────────────────────────

export function useCostCentersQuery() {
  return useQuery({
    queryKey: ['costCenters', 'list'],
    queryFn: async () => {
      if (hasIpc()) return api.costCentersList()
      return []
    },
    staleTime: 60_000,
  })
}

export function useCostCentersTreeQuery() {
  return useQuery({
    queryKey: ['costCenters', 'tree'],
    queryFn: async () => {
      if (hasIpc()) return api.costCentersTree()
      return []
    },
    staleTime: 60_000,
  })
}

export function useCreateCostCenter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.costCentersCreate(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['costCenters'] }),
  })
}

// ── MES: BOM ────────────────────────────────────────────────

export function useBomListQuery(productId?: string) {
  return useQuery({
    queryKey: ['bom', 'list', productId],
    queryFn: async () => {
      if (hasIpc()) return api.bomList(productId)
      return []
    },
    staleTime: 30_000,
  })
}

export function useBomQuery(id: string | null) {
  return useQuery({
    queryKey: ['bom', id],
    queryFn: async () => {
      if (!id) return null
      if (hasIpc()) return api.bomGet(id)
      return null
    },
    enabled: !!id,
  })
}

export function useCreateBom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.bomCreate(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bom'] }),
  })
}

export function useBomCostQuery(bomId: string | null) {
  return useQuery({
    queryKey: ['bom', 'cost', bomId],
    queryFn: async () => {
      if (!bomId) return null
      if (hasIpc()) return api.bomCalculateCost(bomId)
      return null
    },
    enabled: !!bomId,
  })
}

// ── MES: Work Orders ────────────────────────────────────────

export function useWorkOrdersQuery(filters?: any) {
  return useQuery({
    queryKey: ['workOrders', filters],
    queryFn: async () => {
      if (hasIpc()) return api.workOrdersList(filters)
      return []
    },
    staleTime: 30_000,
  })
}

export function useWorkOrderQuery(id: string | null) {
  return useQuery({
    queryKey: ['workOrder', id],
    queryFn: async () => {
      if (!id) return null
      if (hasIpc()) return api.workOrdersGet(id)
      return null
    },
    enabled: !!id,
  })
}

export function useCreateWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      if (hasIpc()) return api.workOrdersCreate(data)
      return { success: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workOrders'] }),
  })
}

export function useWorkOrderAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ action, ...params }: { action: string; [key: string]: any }) => {
      if (!hasIpc()) return { success: true }
      switch (action) {
        case 'release': return api.workOrdersRelease(params.id)
        case 'start': return api.workOrdersStart(params.id)
        case 'consume': return api.workOrdersConsume(params.workOrderId, params.warehouseId)
        case 'complete': return api.workOrdersComplete(params.workOrderId, params.warehouseId, params.producedQty, params.wasteQty)
        case 'cancel': return api.workOrdersCancel(params.id)
        default: throw new Error(`Unknown action: ${action}`)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workOrders'] })
      qc.invalidateQueries({ queryKey: ['workOrder'] })
    },
  })
}
