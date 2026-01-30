/**
 * Preload Script – Secure IPC Bridge
 *
 * Renderer process NEVER has direct access to Node.js or Prisma.
 * All data flows through these typed IPC channels.
 */

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,

  // ── Accounts ─────────────────────────────────────────────
  accounts: {
    list: (filters?: { type?: string; isActive?: boolean; search?: string }) =>
      ipcRenderer.invoke('accounts:list', filters),
    get: (id: string) =>
      ipcRenderer.invoke('accounts:get', id),
    create: (data: any) =>
      ipcRenderer.invoke('accounts:create', data),
    update: (id: string, data: any) =>
      ipcRenderer.invoke('accounts:update', id, data),
  },

  // ── Orders ───────────────────────────────────────────────
  orders: {
    list: (filters?: { status?: string; accountId?: string; isCancelled?: boolean }) =>
      ipcRenderer.invoke('orders:list', filters),
    get: (id: string) =>
      ipcRenderer.invoke('orders:get', id),
    create: (data: any) =>
      ipcRenderer.invoke('orders:create', data),
    updateStatus: (id: string, status: string) =>
      ipcRenderer.invoke('orders:updateStatus', id, status),
    cancel: (id: string, reason: string) =>
      ipcRenderer.invoke('orders:cancel', id, reason),
  },

  // ── Ledger ───────────────────────────────────────────────
  ledger: {
    list: (filters?: { accountId?: string; type?: string; costCenter?: string; limit?: number }) =>
      ipcRenderer.invoke('ledger:list', filters),
    collection: (data: any) =>
      ipcRenderer.invoke('ledger:collection', data),
    payment: (data: any) =>
      ipcRenderer.invoke('ledger:payment', data),
    reversal: (originalEntryId: string, reason: string) =>
      ipcRenderer.invoke('ledger:reversal', originalEntryId, reason),
  },

  // ── Products & Inventory ────────────────────────────────
  products: {
    list: (filters?: { search?: string; material?: string; collection?: string }) =>
      ipcRenderer.invoke('products:list', filters),
    get: (id: string) =>
      ipcRenderer.invoke('products:get', id),
    create: (data: any) =>
      ipcRenderer.invoke('products:create', data),
    update: (id: string, data: any) =>
      ipcRenderer.invoke('products:update', id, data),
  },

  inventory: {
    warehouses: () =>
      ipcRenderer.invoke('inventory:warehouses'),
    stockByVariant: (variantId: string) =>
      ipcRenderer.invoke('inventory:stockByVariant', variantId),
  },

  invoices: {
    createFromOrder: (data: { orderId: string }) =>
      ipcRenderer.invoke('invoices:createFromOrder', data),
  },

  // ── Analytics ────────────────────────────────────────────
  analytics: {
    dashboardKpis: () =>
      ipcRenderer.invoke('analytics:dashboardKpis'),
    profitAnalysis: () =>
      ipcRenderer.invoke('analytics:profitAnalysis'),
    agencyPerformance: () =>
      ipcRenderer.invoke('analytics:agencyPerformance'),
    accountHealth: (accountId: string) =>
      ipcRenderer.invoke('analytics:accountHealth', accountId),
  },
})
