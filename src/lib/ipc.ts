/**
 * IPC Client Types & Access
 *
 * Type-safe window.api access for the renderer process.
 * Falls back to demo data when running outside Electron (npm run dev).
 */

export interface IpcApi {
  platform: string

  accounts: {
    list: (filters?: { type?: string; isActive?: boolean; search?: string }) => Promise<any[]>
    get: (id: string) => Promise<any>
    create: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>
    update: (id: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>
  }

  orders: {
    list: (filters?: { status?: string; accountId?: string; isCancelled?: boolean }) => Promise<any[]>
    get: (id: string) => Promise<any>
    create: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>
    updateStatus: (id: string, status: string) => Promise<{ success: boolean; data?: any; error?: string }>
    cancel: (id: string, reason: string) => Promise<{ success: boolean; error?: string }>
  }

  ledger: {
    list: (filters?: { accountId?: string; type?: string; costCenter?: string; limit?: number }) => Promise<any[]>
    collection: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>
    payment: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>
    reversal: (originalEntryId: string, reason: string) => Promise<{ success: boolean; data?: any; error?: string }>
  }

  analytics: {
    dashboardKpis: () => Promise<any>
    profitAnalysis: () => Promise<any[]>
    agencyPerformance: () => Promise<any[]>
    accountHealth: (accountId: string) => Promise<any>
  }
}

declare global {
  interface Window {
    api?: IpcApi
  }
}

/**
 * Returns true if running inside Electron with IPC bridge.
 */
export function hasIpc(): boolean {
  return typeof window !== 'undefined' && !!window.api?.accounts
}

/**
 * Get the IPC API. Throws if not available.
 */
export function getApi(): IpcApi {
  if (!window.api) {
    throw new Error('IPC API not available. Running outside Electron?')
  }
  return window.api
}
