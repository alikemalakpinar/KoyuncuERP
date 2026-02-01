/**
 * Invoice IPC Handlers – Branch-Scoped & Protected
 *
 * invoices:createFromOrder — Creates an invoice from an existing order
 * and ONLY at this stage creates the LedgerEntry (debit/credit).
 *
 * All financial math via Decimal.js, wrapped in $transaction.
 */

import type { IpcMain } from 'electron'
import Decimal from 'decimal.js'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// ─── Atomic Sequence (shared pattern with orders.ts) ────────
async function nextSequenceValue(tx: any, key: string): Promise<number> {
  const result = await tx.$queryRaw`
    INSERT INTO sequences (id, key, value)
    VALUES (gen_random_uuid(), ${key}, 1)
    ON CONFLICT (key)
    DO UPDATE SET value = sequences.value + 1
    RETURNING value
  ` as { value: number }[]
  return result[0].value
}

async function generateInvoiceNo(tx: any): Promise<string> {
  const year = new Date().getFullYear()
  const seq = await nextSequenceValue(tx, `invoice-${year}`)
  return `INV-${year}-${String(seq).padStart(5, '0')}`
}

async function generateEntryNo(tx: any, prefix = 'LED'): Promise<string> {
  const year = new Date().getFullYear()
  const seq = await nextSequenceValue(tx, `${prefix.toLowerCase()}-${year}`)
  return `${prefix}-${year}-${String(seq).padStart(5, '0')}`
}

// ─── Handlers ───────────────────────────────────────────────
export function registerInvoiceHandlers(ipcMain: IpcMain) {
  // LIST
  ipcMain.handle('invoices:list', protectedProcedure('read', async (ctx, filters?: {
    status?: string; type?: string; accountId?: string
  }) => {
    try {
      const where: any = { branchId: ctx.activeBranchId, isCancelled: false }
      if (filters?.status) where.status = filters.status
      if (filters?.type) where.type = filters.type

      return await ctx.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true, orderNo: true, accountId: true,
              account: { select: { id: true, code: true, name: true } },
            },
          },
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
          ledgerEntries: true,
        },
      })
    } catch (error) {
      console.error('[IPC] invoices:get error:', error)
      return null
    }
  }))

  // CREATE FROM ORDER — the key handler
  ipcMain.handle('invoices:createFromOrder', protectedProcedure('manage_ledger', async (ctx, data: {
    orderId: string
    dueDate?: string
    notes?: string
  }) => {
    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        // 1. Fetch order with items
        const order = await tx.order.findFirst({
          where: { id: data.orderId, branchId: ctx.activeBranchId },
          include: { items: true, account: true },
        })

        if (!order) return { success: false, error: 'Sipariş bulunamadı.' }
        if (order.isCancelled) return { success: false, error: 'İptal edilmiş siparişten fatura kesilemez.' }

        // 2. Check if already invoiced
        const existingInvoice = await tx.invoice.findFirst({
          where: { orderId: data.orderId, isCancelled: false },
        })
        if (existingInvoice) {
          return { success: false, error: `Bu sipariş zaten faturalandı: ${existingInvoice.invoiceNo}` }
        }

        // 3. Recalculate totals with Decimal.js for precision
        let totalAmount = new Decimal(0)
        for (const item of order.items) {
          const qty = new Decimal(String(item.quantity))
          const price = new Decimal(String(item.unitPrice))
          totalAmount = totalAmount.plus(qty.mul(price))
        }

        const vatRate = new Decimal(String(order.vatRate))
        const vatAmount = totalAmount.mul(vatRate).div(100)
        const grandTotal = totalAmount.plus(vatAmount)

        // 4. Create invoice
        const invoiceNo = await generateInvoiceNo(tx)
        const invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            orderId: order.id,
            branchId: ctx.activeBranchId,
            type: 'SALES',
            currency: order.currency,
            totalAmount: totalAmount.toFixed(2),
            vatRate: String(order.vatRate),
            vatAmount: vatAmount.toFixed(2),
            grandTotal: grandTotal.toFixed(2),
            exchangeRate: String(order.orderExchangeRate),
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            notes: data.notes,
            status: 'DRAFT',
          },
        })

        // 5. Create LedgerEntry — THIS is when the accounting entry happens
        const entryNo = await generateEntryNo(tx, 'INV')

        // Debit: Customer owes us (Accounts Receivable)
        await tx.ledgerEntry.create({
          data: {
            entryNo,
            accountId: order.accountId,
            branchId: ctx.activeBranchId,
            type: 'INVOICE',
            debit: grandTotal.toFixed(2),
            credit: '0',
            currency: order.currency,
            exchangeRate: String(order.orderExchangeRate),
            costCenter: 'SALES',
            description: `Satış faturası – ${invoiceNo} (Sipariş: ${order.orderNo})`,
            referenceId: invoice.id,
            referenceType: 'INVOICE',
            invoiceId: invoice.id,
          },
        })

        // 6. Update account balance
        const currentBalance = new Decimal(String(order.account.currentBalance ?? 0))
        const newBalance = currentBalance.plus(grandTotal)
        await tx.account.update({
          where: { id: order.accountId },
          data: { currentBalance: newBalance.toFixed(2) },
        })

        // 7. Audit log
        await writeAuditLog({
          entityType: 'Invoice', entityId: invoice.id, action: 'CREATE',
          newData: { invoice, orderId: order.id, orderNo: order.orderNo },
          userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Fatura oluşturuldu: ${invoiceNo} (Sipariş: ${order.orderNo})`,
        })

        return { success: true, data: invoice }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // FINALIZE — mark invoice as finalized
  ipcMain.handle('invoices:finalize', protectedProcedure('manage_ledger', async (ctx, args: { id: string }) => {
    try {
      const invoice = await ctx.prisma.invoice.findFirst({
        where: { id: args.id, branchId: ctx.activeBranchId },
      })
      if (!invoice) return { success: false, error: 'Fatura bulunamadı.' }
      if (invoice.isCancelled) return { success: false, error: 'İptal edilmiş fatura kesinleştirilemez.' }
      if (invoice.status === 'FINALIZED') return { success: false, error: 'Fatura zaten kesinleştirilmiş.' }

      const updated = await ctx.prisma.invoice.update({
        where: { id: args.id },
        data: { status: 'FINALIZED' },
      })

      await writeAuditLog({
        entityType: 'Invoice', entityId: args.id, action: 'STATUS_CHANGE',
        previousData: { status: invoice.status }, newData: { status: 'FINALIZED' },
        userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Fatura kesinleştirildi: ${invoice.invoiceNo}`,
      })

      return { success: true, data: updated }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))

  // CANCEL
  ipcMain.handle('invoices:cancel', protectedProcedure('manage_ledger', async (ctx, args: {
    id: string; reason: string
  }) => {
    try {
      return await ctx.prisma.$transaction(async (tx: any) => {
        const invoice = await tx.invoice.findFirst({
          where: { id: args.id, branchId: ctx.activeBranchId },
          include: { order: { select: { accountId: true, orderExchangeRate: true } } },
        })
        if (!invoice) return { success: false, error: 'Fatura bulunamadı.' }
        if (invoice.isCancelled) return { success: false, error: 'Zaten iptal edilmiş.' }

        // Cancel invoice
        await tx.invoice.update({
          where: { id: args.id },
          data: { isCancelled: true, status: 'CANCELLED' },
        })

        // Reversal ledger entry
        const entryNo = await generateEntryNo(tx, 'REV')
        const grandTotal = new Decimal(String(invoice.grandTotal))

        await tx.ledgerEntry.create({
          data: {
            entryNo,
            accountId: invoice.order!.accountId,
            branchId: ctx.activeBranchId,
            type: 'REVERSAL',
            debit: '0',
            credit: grandTotal.toFixed(2),
            currency: invoice.currency,
            exchangeRate: String(invoice.exchangeRate ?? invoice.order!.orderExchangeRate),
            costCenter: 'SALES_REVERSAL',
            description: `Fatura iptali (Ters Fiş) – ${invoice.invoiceNo}: ${args.reason}`,
            referenceId: args.id,
            referenceType: 'INVOICE',
            invoiceId: args.id,
          },
        })

        // Update account balance
        if (invoice.order?.accountId) {
          const account = await tx.account.findUnique({ where: { id: invoice.order.accountId } })
          if (account) {
            const currentBalance = new Decimal(String(account.currentBalance ?? 0))
            const newBalance = currentBalance.minus(grandTotal)
            await tx.account.update({
              where: { id: account.id },
              data: { currentBalance: newBalance.toFixed(2) },
            })
          }
        }

        await writeAuditLog({
          entityType: 'Invoice', entityId: args.id, action: 'CANCEL',
          previousData: invoice, userId: ctx.user.id, branchId: ctx.activeBranchId,
          description: `Fatura iptal: ${invoice.invoiceNo} – ${args.reason}`,
        })

        return { success: true }
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }))
}
