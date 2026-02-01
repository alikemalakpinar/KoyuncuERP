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
  // PIM
  'pim:attributes:list', 'pim:attributes:create', 'pim:attributes:setValue',
  'pim:attributes:getProduct', 'pim:attributes:filter',
  'pim:categories:list', 'pim:categories:create', 'pim:categories:assignAttribute',
  'pim:uom:list', 'pim:uom:create', 'pim:uom:addConversion', 'pim:uom:convert', 'pim:uom:conversions',
  'pim:dimensions:list', 'pim:dimensions:create', 'pim:dimensions:addValue', 'pim:dimensions:generate',
  // Finance++
  'coa:list', 'coa:create', 'coa:update', 'coa:tree',
  'cheques:list', 'cheques:create', 'cheques:transition', 'cheques:history',
  'costCenters:list', 'costCenters:create', 'costCenters:tree', 'costCenters:update',
  // MES
  'bom:list', 'bom:get', 'bom:create', 'bom:calculateCost',
  'workOrders:list', 'workOrders:get', 'workOrders:create', 'workOrders:release',
  'workOrders:start', 'workOrders:consume', 'workOrders:complete', 'workOrders:cancel',
]

contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, ...args: any[]) => {
    if (!ALLOWED_CHANNELS.includes(channel)) {
      return Promise.reject(new Error(`IPC channel not allowed: ${channel}`))
    }
    return ipcRenderer.invoke(channel, ...args)
  },
})
