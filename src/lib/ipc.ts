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

  // Payments
  paymentCreate: (data: any) => ipcCall('payments:create', data),
}
