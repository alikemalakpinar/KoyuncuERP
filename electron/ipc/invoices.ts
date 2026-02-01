/**
 * Invoice IPC Handlers – Branch-Scoped & Protected
 *
 * - Proper invoice creation from orders with Decimal.js
 * - LedgerEntry ONLY created at invoice stage (not order)
 * - Account balance updated atomically
 * - $transaction for all multi-table writes
 * - Zod validation on inputs
 */

import type { IpcMain } from 'electron'
import Decimal from 'decimal.js'
import { z } from 'zod'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'
import { nextDocumentNo } from '../services/sequence'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// ─── Validation ─────────────────────────────────────────────
const createFromOrderSchema = z.object({
  orderId: z.string().min(1, 'Sipariş ID gerekli'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

const finalizeSchema = z.object({ id: z.string().min(1) })

const cancelSchema = z.object({
  id: z.string().min(1),
  reason: z.string().min(1, 'İptal sebebi gerekli'),
})

// ─── Handlers ───────────────────────────────────────────────
export function registerInvoiceHandlers(ipcMain: IpcMain) {
  // LIST
  ipcMain.handle('invoices:list', protectedProcedure('read', async (ctx, filters?: {
    status?: string; orderId?: string
  }) => {
    try {
      const where: any = { branchId: ctx.activeBranchId, isCancelled: false }
      if (filters?.status) where.status = filters.status
      if (filters?.orderId) where.orderId = filters.orderId

      return await ctx.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNo: true, account: { select: { id: true, code: true, name: true } } } },
          ledgerEntries: { where: { isCancelled: false } },
        },
      })
    } catch (error) {
      console.error('[IPC] invoices:list error:', error)
      return []
    }
  }))

  // GET
  ipcMain.handle('invoices:get', protectedProcedure('read', async (ctx, args: { id: string }) => {
    try {
      return await ctx.prisma.invoice.findFirst({
        where: { id: args.id, branchId: ctx.activeBranchId },
        include: {
          order: { include: { account: true, items: true } },
          ledgerEntries: { where: { isCancelled: false } },
        },
      })
    } catch (error) {
      console.error('[IPC] invoices:get error:', error)
      return null
    }
  }))

  // CREATE FROM ORDER — the key handler
  ipcMain.handle('invoices:createFromOrder', protectedProcedure('manage_ledger', async (ctx, rawData: any) => {
    const parsed = createFromOrderSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, error: `Geçersiz giriş: ${parsed.error.errors.map(e => e.message).join(', ')}` }
    }
    const data = parsed.data

    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        const order = await tx.order.findFirst({
          where: { id: data.orderId, branchId: ctx.activeBranchId },
          include: { account: true, items: true },
        })
        if (!order) return { success: false, error: 'Sipariş bulunamadı.' }
        if (order.isCancelled) return { success: false, error: 'İptal edilmiş siparişe fatura kesilemez.' }

        // Check if already invoiced
        const existingInv = await tx.invoice.findFirst({
          where: { orderId: data.orderId, isCancelled: false },
        })
        if (existingInv) return { success: false, error: `Bu sipariş zaten faturalandı: ${existingInv.invoiceNo}` }

        // Recalculate totals with Decimal.js
        let subtotal = new Decimal(0)
        for (const item of order.items) {
          const qty = new Decimal(String(item.quantity))
          const price = new Decimal(String(item.unitPrice))
          subtotal = subtotal.plus(qty.mul(price))
        }
        const vatRate = new Decimal(String(order.vatRate))
        const taxTotal = subtotal.mul(vatRate).div(100)
        const grandTotal = subtotal.plus(taxTotal)

        // Calculate due date
        const dueDate = data.dueDate
          ? new Date(data.dueDate)
          : order.account?.paymentTermDays
            ? new Date(Date.now() + order.account.paymentTermDays * 86400000)
            : null

        const invoiceNo = await nextDocumentNo(tx, ctx.activeBranchId, 'INVOICE')

        const invoice = await tx.invoice.create({
          data: {
            invoiceNo, orderId: order.id, branchId: ctx.activeBranchId,
            date: new Date(), dueDate,
            subtotal: subtotal.toFixed(2), taxTotal: taxTotal.toFixed(2),
            grandTotal: grandTotal.toFixed(2), currency: order.currency,
            status: 'FINALIZED',
          },
        })

        // Create Ledger Entry — THIS is where accounting happens
        const entryNo = await nextDocumentNo(tx, ctx.activeBranchId, 'LEDGER')
        await tx.ledgerEntry.create({
          data: {
            entryNo, accountId: order.accountId,
            branchId: ctx.activeBranchId, type: 'INVOICE',
            debit: grandTotal.toFixed(2), credit: '0',
            currency: order.currency,
            exchangeRate: String(order.orderExchangeRate),
            costCenter: 'SALES',
            description: `Satış Faturası: ${invoiceNo} (Sipariş: ${order.orderNo})`,
            referenceId: order.id, referenceType: 'ORDER',
            invoiceId: invoice.id,
          },
        })

        // Update account balance
        await tx.account.update({
          where: { id: order.accountId },
          data: { currentBalance: { increment: grandTotal.toNumber() } },
        })

        await writeAuditLog({
          entityType: 'Invoice', entityId: invoice.id, action: 'CREATE',
          newData: { invoiceNo, orderId: order.id, grandTotal: grandTotal.toFixed(2) },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Fatura kesildi: ${invoiceNo} – ${grandTotal.toFixed(2)} ${order.currency}`,
        })

        return { success: true, data: invoice }
      })
    } catch (error: any) {
      console.error('[IPC] invoices:createFromOrder error:', error)
      return { success: false, error: error.message }
    }
  }))

  // FINALIZE
  ipcMain.handle('invoices:finalize', protectedProcedure('manage_ledger', async (ctx, rawArgs: any) => {
    const parsed = finalizeSchema.safeParse(rawArgs)
    if (!parsed.success) return { success: false, error: 'Geçersiz giriş.' }

    try {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: parsed.data.id, branchId: ctx.activeBranchId },
      })
      if (!invoice) return { success: false, error: 'Fatura bulunamadı.' }
      if (invoice.isCancelled) return { success: false, error: 'İptal edilmiş fatura kesinleştirilemez.' }

      const updated = await ctx.prisma.invoice.update({
        where: { id: parsed.data.id },
        data: { status: 'FINALIZED' },
      })

      await writeAuditLog({
        entityType: 'Invoice', entityId: parsed.data.id, action: 'STATUS_CHANGE',
        previousData: { status: invoice.status }, newData: { status: 'FINALIZED' },
        userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Fatura kesinleştirildi: ${invoice.invoiceNo}`,
      })

      return { success: true, data: updated }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // CANCEL — with reversal ledger entry and account balance adjustment
  ipcMain.handle('invoices:cancel', protectedProcedure('manage_ledger', async (ctx, rawArgs: any) => {
    const parsed = cancelSchema.safeParse(rawArgs)
    if (!parsed.success) return { success: false, error: `Geçersiz giriş: ${parsed.error.errors.map(e => e.message).join(', ')}` }
    const args = parsed.data

    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        const invoice = await tx.invoice.findFirst({
          where: { id: args.id, branchId: ctx.activeBranchId },
          include: { order: true },
        })
        if (!invoice) return { success: false, error: 'Fatura bulunamadı.' }
        if (invoice.isCancelled) return { success: false, error: 'Zaten iptal edilmiş.' }

        await tx.invoice.update({
          where: { id: args.id },
          data: { isCancelled: true, status: 'CANCELLED' },
        })

        // Mark original ledger entries as cancelled
        await tx.ledgerEntry.updateMany({
          where: { invoiceId: args.id, isCancelled: false },
          data: { isCancelled: true },
        })

        // Create reversal ledger entry
        const grandTotal = new Decimal(String(invoice.grandTotal))
        const reversalNo = await nextDocumentNo(tx, ctx.activeBranchId, 'LEDGER')
        await tx.ledgerEntry.create({
          data: {
            entryNo: reversalNo, accountId: invoice.order.accountId,
            branchId: ctx.activeBranchId, type: 'REVERSAL',
            debit: '0', credit: grandTotal.toFixed(2),
            currency: invoice.currency,
            exchangeRate: String(invoice.order.orderExchangeRate),
            costCenter: 'SALES_REVERSAL',
            description: `Fatura İptali (Ters Fiş): ${invoice.invoiceNo} – ${args.reason}`,
            referenceId: args.id, referenceType: 'INVOICE',
            invoiceId: args.id,
          },
        })

        // Reverse account balance
        await tx.account.update({
          where: { id: invoice.order.accountId },
          data: { currentBalance: { decrement: grandTotal.toNumber() } },
        })

        await writeAuditLog({
          entityType: 'Invoice', entityId: args.id, action: 'CANCEL',
          previousData: { status: invoice.status },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Fatura iptal: ${invoice.invoiceNo} – ${args.reason}`,
        })

        return { success: true }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
