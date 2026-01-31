/**
 * Preload Script – Secure IPC Bridge
 *
 * contextIsolation: true, nodeIntegration: false, sandbox: true
 * Only whitelisted channels are exposed via contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron'

const ALLOWED_CHANNELS = [
  'auth:login', 'auth:logout', 'auth:me',
  'accounts:list', 'accounts:get', 'accounts:create', 'accounts:update',
  'orders:list', 'orders:get', 'orders:create', 'orders:updateStatus', 'orders:cancel',
  'ledger:list', 'ledger:collection', 'ledger:payment', 'ledger:reversal',
  'products:list', 'products:get', 'products:create', 'products:update',
  'inventory:warehouses', 'inventory:stockByVariant',
  'invoices:createFromOrder',
  'inventory:receiveLot', 'inventory:allocate', 'inventory:fulfill',
  'inventory:lots', 'inventory:transactions',
  'pricing:resolve', 'pricing:resolveBatch', 'pricing:lists',
  'pricing:createList', 'pricing:addItem', 'pricing:assignToAccount',
  'finance:lockPeriod', 'finance:getLatestLock', 'finance:isDateLocked',
  'finance:agingReport', 'finance:fxRevaluation', 'finance:postFxRevaluation',
  'analytics:dashboardKpis', 'analytics:profitAnalysis',
  'analytics:agencyPerformance', 'analytics:accountHealth',
  'cash:registers', 'cash:open', 'cash:close', 'cash:transact', 'cash:transactions',
  'payments:create',
]

contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, ...args: any[]) => {
    if (!ALLOWED_CHANNELS.includes(channel)) {
      return Promise.reject(new Error(`IPC channel not allowed: ${channel}`))
    }
    return ipcRenderer.invoke(channel, ...args)
  },
})
