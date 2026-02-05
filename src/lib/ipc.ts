/**
 * IPC Bridge – Renderer Side
 *
 * Type-safe wrapper around window.api.invoke.
 * Token and branchId are injected automatically from session store.
 */

declare global {
  interface Window {
    api?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
}

// ── Session store (in-memory only) ─────────────────────────

let _token: string | null = null
let _activeBranchId: string | null = null

export function hasIpc(): boolean {
  return !!window.api
}

export function getApi() {
  return {
    accounts: {
      list: (filters?: any) => ipcCall('accounts:list', filters),
      get: (id: string) => ipcCall('accounts:get', { id }),
      create: (data: any) => ipcCall('accounts:create', data),
      update: (id: string, data: any) => ipcCall('accounts:update', { id, data }),
    },
    orders: {
      list: (filters?: any) => ipcCall('orders:list', filters),
      get: (id: string) => ipcCall('orders:get', { id }),
      create: (data: any) => ipcCall('orders:create', data),
      updateStatus: (id: string, status: string) => ipcCall('orders:updateStatus', { id, status }),
      cancel: (id: string, reason: string) => ipcCall('orders:cancel', { id, reason }),
    },
    ledger: {
      list: (filters?: any) => ipcCall('ledger:list', filters),
      collection: (data: any) => ipcCall('ledger:collection', data),
      payment: (data: any) => ipcCall('ledger:payment', data),
      reversal: (originalEntryId: string, reason: string) => ipcCall('ledger:reversal', { originalEntryId, reason }),
      statement: (accountId: string, dateFrom?: string, dateTo?: string) => ipcCall('ledger:statement', { accountId, dateFrom, dateTo }),
    },
    products: {
      list: (filters?: any) => ipcCall('products:list', filters),
      get: (id: string) => ipcCall('products:get', { id }),
      create: (data: any) => ipcCall('products:create', data),
      update: (id: string, data: any) => ipcCall('products:update', { id, data }),
    },
    inventory: {
      warehouses: () => ipcCall('inventory:warehouses'),
      stockByVariant: (variantId: string) => ipcCall('inventory:stockByVariant', { variantId }),
    },
    invoices: {
      createFromOrder: (data: any) => ipcCall('invoices:createFromOrder', data),
    },
    returns: {
      list: (filters?: any) => ipcCall('returns:list', filters),
      get: (id: string) => ipcCall('returns:get', { id }),
      create: (data: any) => ipcCall('returns:create', data),
      approve: (id: string) => ipcCall('returns:approve', { id }),
      complete: (id: string, warehouseId: string) => ipcCall('returns:complete', { id, warehouseId }),
      cancel: (id: string, reason?: string) => ipcCall('returns:cancel', { id, reason }),
    },
    analytics: {
      dashboardKpis: () => ipcCall('analytics:dashboardKpis'),
      profitAnalysis: () => ipcCall('analytics:profitAnalysis'),
      agencyPerformance: () => ipcCall('analytics:agencyPerformance'),
      accountHealth: (accountId: string) => ipcCall('analytics:accountHealth', { accountId }),
    },
  }
}

export function setAuthToken(token: string | null) { _token = token }
export function getAuthToken() { return _token }
export function setActiveBranch(branchId: string | null) { _activeBranchId = branchId }
export function getActiveBranch() { return _activeBranchId }

// ── Generic IPC call (auto-injects token + branchId) ───────

export async function ipcCall<T = any>(channel: string, data?: any): Promise<T> {
  const isAuthChannel = channel.startsWith('auth:')

  const payload = isAuthChannel
    ? data
    : { token: _token, branchId: _activeBranchId, ...(data ?? {}) }

  if (window.api) {
    return window.api.invoke(channel, payload)
  }

  console.warn(`[IPC] No Electron API for channel: ${channel}`)
  return Promise.reject(new Error('Electron API not available'))
}

// ── Typed helpers ──────────────────────────────────────────

export const api = {
  // Auth
  login: (email: string, password: string) =>
    ipcCall('auth:login', { email, password }),
  logout: (token: string) =>
    ipcCall('auth:logout', { token }),
  me: (token: string) =>
    ipcCall('auth:me', { token }),
  branches: () =>
    ipcCall('auth:branches'),
  branchUsers: (branchId: string) =>
    ipcCall('auth:branchUsers', { branchId }),

  // Accounts
  accountsList: (filters?: any) => ipcCall('accounts:list', filters),
  accountsGet: (id: string) => ipcCall('accounts:get', { id }),
  accountsCreate: (data: any) => ipcCall('accounts:create', data),
  accountsUpdate: (id: string, data: any) => ipcCall('accounts:update', { id, data }),

  // Orders
  ordersList: (filters?: any) => ipcCall('orders:list', filters),
  ordersGet: (id: string) => ipcCall('orders:get', { id }),
  ordersCreate: (data: any) => ipcCall('orders:create', data),
  ordersUpdateStatus: (id: string, status: string) => ipcCall('orders:updateStatus', { id, status }),
  ordersCancel: (id: string, reason: string) => ipcCall('orders:cancel', { id, reason }),

  // Ledger
  ledgerList: (filters?: any) => ipcCall('ledger:list', filters),
  ledgerCollection: (data: any) => ipcCall('ledger:collection', data),
  ledgerPayment: (data: any) => ipcCall('ledger:payment', data),
  ledgerReversal: (originalEntryId: string, reason: string) => ipcCall('ledger:reversal', { originalEntryId, reason }),

  // Products
  productsList: (filters?: any) => ipcCall('products:list', filters),
  productsGet: (id: string) => ipcCall('products:get', { id }),
  productsCreate: (data: any) => ipcCall('products:create', data),
  productsUpdate: (id: string, data: any) => ipcCall('products:update', { id, data }),

  // Inventory
  warehouses: () => ipcCall('inventory:warehouses'),
  stockByVariant: (variantId: string) => ipcCall('inventory:stockByVariant', { variantId }),
  invoiceCreateFromOrder: (orderId: string) => ipcCall('invoices:createFromOrder', { orderId }),

  // Platinum - Inventory
  receiveLot: (data: any) => ipcCall('inventory:receiveLot', data),
  allocate: (data: any) => ipcCall('inventory:allocate', data),
  fulfill: (data: any) => ipcCall('inventory:fulfill', data),
  lots: (variantId: string, warehouseId?: string) => ipcCall('inventory:lots', { variantId, warehouseId }),
  transactions: (variantId: string, limit?: number) => ipcCall('inventory:transactions', { variantId, limit }),

  // Platinum - Pricing
  priceResolve: (data: any) => ipcCall('pricing:resolve', data),
  priceResolveBatch: (data: any) => ipcCall('pricing:resolveBatch', data),
  priceLists: () => ipcCall('pricing:lists'),
  priceCreateList: (data: any) => ipcCall('pricing:createList', data),
  priceAddItem: (data: any) => ipcCall('pricing:addItem', data),
  priceAssignToAccount: (accountId: string, priceListId: string) => ipcCall('pricing:assignToAccount', { accountId, priceListId }),

  // Platinum - Finance
  lockPeriod: (data: any) => ipcCall('finance:lockPeriod', data),
  getLatestLock: () => ipcCall('finance:getLatestLock'),
  isDateLocked: (date: string) => ipcCall('finance:isDateLocked', { date }),
  agingReport: () => ipcCall('finance:agingReport'),
  fxRevaluation: (currentRates: Record<string, number>) => ipcCall('finance:fxRevaluation', { currentRates }),
  postFxRevaluation: (items: any[]) => ipcCall('finance:postFxRevaluation', { items }),

  // Analytics
  dashboardKpis: () => ipcCall('analytics:dashboardKpis'),
  profitAnalysis: () => ipcCall('analytics:profitAnalysis'),
  agencyPerformance: () => ipcCall('analytics:agencyPerformance'),
  accountHealth: (accountId: string) => ipcCall('analytics:accountHealth', { accountId }),

  // Cash Register
  cashRegisters: () => ipcCall('cash:registers'),
  cashOpen: (registerId: string, openingBalance: string) => ipcCall('cash:open', { registerId, openingBalance }),
  cashClose: (registerId: string, actualCash: string) => ipcCall('cash:close', { registerId, actualCash }),
  cashTransact: (data: any) => ipcCall('cash:transact', data),
  cashTransactions: (registerId: string, date?: string) => ipcCall('cash:transactions', { registerId, date }),

  // Returns
  returnsList: (filters?: any) => ipcCall('returns:list', filters),
  returnsGet: (id: string) => ipcCall('returns:get', { id }),
  returnsCreate: (data: any) => ipcCall('returns:create', data),
  returnsApprove: (id: string) => ipcCall('returns:approve', { id }),
  returnsComplete: (id: string, warehouseId: string) => ipcCall('returns:complete', { id, warehouseId }),
  returnsCancel: (id: string, reason?: string) => ipcCall('returns:cancel', { id, reason }),

  // Payments
  paymentCreate: (data: any) => ipcCall('payments:create', data),

  // ── PIM ──────────────────────────────────────────────────
  pimAttributesList: () => ipcCall('pim:attributes:list'),
  pimAttributesCreate: (data: any) => ipcCall('pim:attributes:create', data),
  pimAttributesSetValue: (data: any) => ipcCall('pim:attributes:setValue', data),
  pimAttributesGetProduct: (productId: string) => ipcCall('pim:attributes:getProduct', { productId }),
  pimCategoriesList: () => ipcCall('pim:categories:list'),
  pimCategoriesCreate: (data: any) => ipcCall('pim:categories:create', data),
  pimUomList: (category?: string) => ipcCall('pim:uom:list', { category }),
  pimUomCreate: (data: any) => ipcCall('pim:uom:create', data),
  pimUomAddConversion: (data: any) => ipcCall('pim:uom:addConversion', data),
  pimUomConvert: (qty: number, fromUomCode: string, toUomCode: string, productId?: string) =>
    ipcCall('pim:uom:convert', { qty, fromUomCode, toUomCode, productId }),
  pimUomConversions: (productId?: string) => ipcCall('pim:uom:conversions', { productId }),
  pimDimensionsList: () => ipcCall('pim:dimensions:list'),
  pimDimensionsCreate: (data: any) => ipcCall('pim:dimensions:create', data),
  pimDimensionsAddValue: (data: any) => ipcCall('pim:dimensions:addValue', data),
  pimDimensionsGenerate: (axes: Record<string, string[]>) => ipcCall('pim:dimensions:generate', { axes }),

  // ── Finance++ ────────────────────────────────────────────
  coaList: () => ipcCall('coa:list'),
  coaCreate: (data: any) => ipcCall('coa:create', data),
  coaUpdate: (id: string, data: any) => ipcCall('coa:update', { id, data }),
  coaTree: () => ipcCall('coa:tree'),
  chequesList: (filters?: any) => ipcCall('cheques:list', filters),
  chequesCreate: (data: any) => ipcCall('cheques:create', data),
  chequesTransition: (data: any) => ipcCall('cheques:transition', data),
  chequesHistory: (chequeId: string) => ipcCall('cheques:history', { chequeId }),
  costCentersList: () => ipcCall('costCenters:list'),
  costCentersCreate: (data: any) => ipcCall('costCenters:create', data),
  costCentersTree: () => ipcCall('costCenters:tree'),
  costCentersUpdate: (id: string, data: any) => ipcCall('costCenters:update', { id, data }),

  // ── MES ──────────────────────────────────────────────────
  bomList: (productId?: string) => ipcCall('bom:list', { productId }),
  bomGet: (id: string) => ipcCall('bom:get', { id }),
  bomCreate: (data: any) => ipcCall('bom:create', data),
  bomCalculateCost: (bomId: string) => ipcCall('bom:calculateCost', { bomId }),
  workOrdersList: (filters?: any) => ipcCall('workOrders:list', filters),
  workOrdersGet: (id: string) => ipcCall('workOrders:get', { id }),
  workOrdersCreate: (data: any) => ipcCall('workOrders:create', data),
  workOrdersRelease: (id: string) => ipcCall('workOrders:release', { id }),
  workOrdersStart: (id: string) => ipcCall('workOrders:start', { id }),
  workOrdersConsume: (workOrderId: string, warehouseId: string) =>
    ipcCall('workOrders:consume', { workOrderId, warehouseId }),
  workOrdersComplete: (workOrderId: string, warehouseId: string, producedQty: number, wasteQty?: number) =>
    ipcCall('workOrders:complete', { workOrderId, warehouseId, producedQty, wasteQty }),
  workOrdersCancel: (id: string) => ipcCall('workOrders:cancel', { id }),
}
