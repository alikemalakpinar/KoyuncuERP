/**
 * Order IPC Handlers – Main Process
 *
 * Handles order CRUD, status transitions, and auto-commission on DELIVERED.
 * Immutability: cancelled orders get isCancelled=true + reversal entries.
 */

import type { IpcMain } from 'electron'
import { getDb } from '../db'
import { writeAuditLog } from './audit'
import {
  calculateCommission,
  buildCommissionLedgerEntry,
  percentage,
} from '../../src/services/finance'

let orderSequence = 151 // demo starting point

function generateOrderNo(): string {
  orderSequence++
  const year = new Date().getFullYear()
  return `ORD-${year}-${String(orderSequence).padStart(4, '0')}`
}

function generateEntryNo(): string {
  const ts = Date.now().toString(36).toUpperCase()
  return `LED-${ts}`
}

export function registerOrderHandlers(ipcMain: IpcMain) {
  // ── List orders ────────────────────────────────────────
  ipcMain.handle('orders:list', async (_event, filters?: {
    status?: string
    accountId?: string
    isCancelled?: boolean
  }) => {
    try {
      const db = getDb()
      const where: any = { isCancelled: filters?.isCancelled ?? false }
      if (filters?.status) where.status = filters.status
      if (filters?.accountId) where.accountId = filters.accountId

      return await db.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          account: { select: { id: true, code: true, name: true } },
          items: true,
          agencyStaff: { select: { id: true, name: true, agency: { select: { id: true, account: { select: { name: true } } } } } },
        },
      })
    } catch (error) {
      console.error('[IPC] orders:list error:', error)
      return []
    }
  })

  // ── Get single order ───────────────────────────────────
  ipcMain.handle('orders:get', async (_event, id: string) => {
    try {
      const db = getDb()
      return await db.order.findUnique({
        where: { id },
        include: {
          account: true,
          items: true,
          shipments: { where: { isCancelled: false } },
          landedCosts: { where: { isCancelled: false } },
          commissionRecords: { where: { isCancelled: false } },
          agencyStaff: { include: { agency: { include: { account: true } } } },
        },
      })
    } catch (error) {
      console.error('[IPC] orders:get error:', error)
      return null
    }
  })

  // ── Create order ───────────────────────────────────────
  ipcMain.handle('orders:create', async (_event, data: {
    accountId: string
    currency: string
    vatRate: string
    agencyStaffId?: string
    agencyCommissionRate?: string
    staffCommissionRate?: string
    exchangeRate: string
    notes?: string
    items: {
      productName: string
      productGroup?: string
      sku?: string
      quantity: string
      unit: string
      unitPrice: string
      purchasePrice?: string
    }[]
  }) => {
    try {
      const db = getDb()

      // Calculate totals using Decimal-safe arithmetic
      let totalAmount = 0
      const itemsData = data.items.map((item) => {
        const qty = parseFloat(item.quantity)
        const price = parseFloat(item.unitPrice)
        const lineTotal = qty * price
        totalAmount += lineTotal
        return {
          productName: item.productName,
          productGroup: item.productGroup,
          sku: item.sku,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: lineTotal.toFixed(2),
          purchasePrice: item.purchasePrice ?? '0',
        }
      })

      const vatRate = parseFloat(data.vatRate)
      const vatAmount = totalAmount * (vatRate / 100)
      const grandTotal = totalAmount + vatAmount

      const order = await db.order.create({
        data: {
          orderNo: generateOrderNo(),
          accountId: data.accountId,
          currency: data.currency,
          totalAmount: totalAmount.toFixed(2),
          vatRate: data.vatRate,
          vatAmount: vatAmount.toFixed(2),
          grandTotal: grandTotal.toFixed(2),
          agencyStaffId: data.agencyStaffId,
          agencyCommissionRate: data.agencyCommissionRate ?? '0',
          staffCommissionRate: data.staffCommissionRate ?? '0',
          orderExchangeRate: data.exchangeRate,
          notes: data.notes,
        },
      })

      await db.orderItem.createMany({
        data: itemsData.map((item) => ({ ...item, orderId: order.id })),
      })

      // Ledger: record the invoice
      await db.ledgerEntry.create({
        data: {
          entryNo: generateEntryNo(),
          accountId: data.accountId,
          type: 'INVOICE',
          debit: grandTotal.toFixed(2),
          credit: '0',
          currency: data.currency,
          exchangeRate: data.exchangeRate,
          costCenter: 'SALES',
          description: `Satış faturası – ${order.orderNo}`,
          referenceId: order.id,
          referenceType: 'ORDER',
        },
      })

      await writeAuditLog({
        entityType: 'Order',
        entityId: order.id,
        action: 'CREATE',
        newData: { order, items: itemsData },
        description: `Yeni sipariş: ${order.orderNo}`,
      })

      return { success: true, data: order }
    } catch (error: any) {
      console.error('[IPC] orders:create error:', error)
      return { success: false, error: error.message }
    }
  })

  // ── Update order status ────────────────────────────────
  // When status → DELIVERED, auto-generate commission ledger entries
  ipcMain.handle('orders:updateStatus', async (_event, id: string, newStatus: string) => {
    try {
      const db = getDb()
      const order = await db.order.findUnique({
        where: { id },
        include: {
          account: true,
          agencyStaff: { include: { agency: { include: { account: true } } } },
        },
      })

      if (!order) return { success: false, error: 'Sipariş bulunamadı' }
      if (order.isCancelled) return { success: false, error: 'İptal edilmiş sipariş güncellenemez' }

      const previousStatus = order.status

      const updated = await db.order.update({
        where: { id },
        data: { status: newStatus as any },
      })

      // ── Auto-commission on DELIVERED ───────────────────
      if (newStatus === 'DELIVERED' && order.agencyStaff) {
        const commissionRate = String(order.agencyCommissionRate)
        const staffRate = String(order.staffCommissionRate)
        const grandTotal = String(order.grandTotal)

        const result = calculateCommission({
          orderId: id,
          orderTotal: grandTotal,
          agencyCommissionRate: commissionRate,
          staffCommissionRate: staffRate,
          agencyId: order.agencyStaff.agency.id,
          agencyStaffId: order.agencyStaff.id,
        })

        // Create commission record
        await db.commissionRecord.create({
          data: {
            orderId: id,
            agencyId: order.agencyStaff.agency.id,
            agencyStaffId: order.agencyStaff.id,
            commissionRate: commissionRate,
            baseAmount: grandTotal,
            commissionAmount: result.totalCommission,
          },
        })

        // Ledger entry for commission (Alacak to agency)
        const agencyAccountId = order.agencyStaff.agency.accountId
        const ledgerData = buildCommissionLedgerEntry(
          id,
          order.orderNo,
          agencyAccountId,
          result.totalCommission,
          String(order.currency),
          String(order.orderExchangeRate),
        )

        await db.ledgerEntry.create({
          data: {
            entryNo: generateEntryNo(),
            ...ledgerData,
          },
        })
      }

      await writeAuditLog({
        entityType: 'Order',
        entityId: id,
        action: 'STATUS_CHANGE',
        previousData: { status: previousStatus },
        newData: { status: newStatus },
        description: `Sipariş durumu: ${previousStatus} → ${newStatus} (${order.orderNo})`,
      })

      return { success: true, data: updated }
    } catch (error: any) {
      console.error('[IPC] orders:updateStatus error:', error)
      return { success: false, error: error.message }
    }
  })

  // ── Cancel order (Immutability: reversal entry) ────────
  ipcMain.handle('orders:cancel', async (_event, id: string, reason: string) => {
    try {
      const db = getDb()
      const order = await db.order.findUnique({ where: { id } })
      if (!order) return { success: false, error: 'Sipariş bulunamadı' }
      if (order.isCancelled) return { success: false, error: 'Zaten iptal edilmiş' }

      // Mark as cancelled (immutability – no delete)
      await db.order.update({
        where: { id },
        data: { isCancelled: true, status: 'CANCELLED' },
      })

      // Create reversal ledger entry (ters fiş)
      await db.ledgerEntry.create({
        data: {
          entryNo: generateEntryNo(),
          accountId: order.accountId,
          type: 'REVERSAL',
          debit: '0',
          credit: String(order.grandTotal),
          currency: order.currency,
          exchangeRate: String(order.orderExchangeRate),
          costCenter: 'SALES_REVERSAL',
          description: `Sipariş iptali (Ters Fiş) – ${order.orderNo}: ${reason}`,
          referenceId: id,
          referenceType: 'ORDER',
        },
      })

      await writeAuditLog({
        entityType: 'Order',
        entityId: id,
        action: 'CANCEL',
        previousData: order,
        description: `Sipariş iptal edildi: ${order.orderNo} – Sebep: ${reason}`,
      })

      return { success: true }
    } catch (error: any) {
      console.error('[IPC] orders:cancel error:', error)
      return { success: false, error: error.message }
    }
  })
}
