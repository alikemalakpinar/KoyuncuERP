/**
 * IPC Handlers – Products & Inventory
 */

import type { IpcMain } from 'electron'
import { getDb } from '../db'
import { writeAuditLog } from './audit'

export function registerProductHandlers(ipc: IpcMain) {
  const db = () => {
    try { return getDb() } catch { return null }
  }

  // ── Products CRUD ─────────────────────────────────────────

  ipc.handle('products:list', async (_e, filters?: { search?: string; material?: string; collection?: string }) => {
    const d = db()
    if (!d) return []
    const where: any = { isActive: true }
    if (filters?.material) where.material = filters.material
    if (filters?.collection) where.collection = filters.collection
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    return d.product.findMany({
      where,
      include: {
        variants: { include: { stocks: { include: { warehouse: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  })

  ipc.handle('products:get', async (_e, id: string) => {
    const d = db()
    if (!d) return null
    return d.product.findUnique({
      where: { id },
      include: {
        variants: { include: { stocks: { include: { warehouse: true } } } },
        stockMovements: { orderBy: { createdAt: 'desc' }, take: 50, include: { warehouse: true, variant: true } },
      },
    })
  })

  ipc.handle('products:create', async (_e, data: any) => {
    const d = db()
    if (!d) return { success: false, error: 'DB not available' }
    try {
      const product = await d.product.create({
        data: {
          code: data.code,
          name: data.name,
          collection: data.collection || null,
          material: data.material || 'WOOL',
          description: data.description || null,
          images: data.images || [],
          variants: data.variants?.length
            ? {
                create: data.variants.map((v: any) => ({
                  sku: v.sku,
                  size: v.size,
                  width: v.width,
                  length: v.length,
                  areaM2: (v.width * v.length) / 10000,
                  color: v.color || null,
                  barcode: v.barcode || null,
                  listPrice: v.listPrice,
                  baseCost: v.baseCost,
                })),
              }
            : undefined,
        },
        include: { variants: true },
      })
      await writeAuditLog(d as any, {
        entityType: 'Product',
        entityId: product.id,
        action: 'CREATE',
        newData: product,
        description: `Ürün oluşturuldu: ${product.code} – ${product.name}`,
      })
      return { success: true, data: product }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipc.handle('products:update', async (_e, id: string, data: any) => {
    const d = db()
    if (!d) return { success: false, error: 'DB not available' }
    try {
      const previous = await d.product.findUnique({ where: { id } })
      const product = await d.product.update({
        where: { id },
        data: {
          name: data.name,
          collection: data.collection,
          material: data.material,
          description: data.description,
          images: data.images,
        },
      })
      await writeAuditLog(d as any, {
        entityType: 'Product',
        entityId: id,
        action: 'UPDATE',
        previousData: previous,
        newData: product,
        description: `Ürün güncellendi: ${product.code}`,
      })
      return { success: true, data: product }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ── Inventory / Stock ─────────────────────────────────────

  ipc.handle('inventory:warehouses', async () => {
    const d = db()
    if (!d) return []
    return d.warehouse.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } })
  })

  ipc.handle('inventory:stockByVariant', async (_e, variantId: string) => {
    const d = db()
    if (!d) return []
    return d.stock.findMany({
      where: { variantId },
      include: { warehouse: true },
    })
  })

  // ── Invoice ───────────────────────────────────────────────

  ipc.handle('invoices:createFromOrder', async (_e, data: { orderId: string }) => {
    const d = db()
    if (!d) return { success: false, error: 'DB not available' }
    try {
      const order = await d.order.findUnique({
        where: { id: data.orderId },
        include: { account: true, items: true },
      })
      if (!order) return { success: false, error: 'Order not found' }

      const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`
      const invoice = await d.invoice.create({
        data: {
          invoiceNo,
          orderId: order.id,
          date: new Date(),
          dueDate: order.account?.paymentTermDays
            ? new Date(Date.now() + order.account.paymentTermDays * 86400000)
            : null,
          subtotal: order.totalAmount,
          taxTotal: order.vatAmount,
          grandTotal: order.grandTotal,
          currency: order.currency,
          status: 'FINALIZED',
        },
      })

      // Post SALES ledger entry
      const entryNo = `LE-${Date.now().toString(36).toUpperCase()}`
      await d.ledgerEntry.create({
        data: {
          entryNo,
          accountId: order.accountId,
          type: 'INVOICE',
          debit: order.grandTotal,
          credit: 0,
          currency: order.currency,
          exchangeRate: order.orderExchangeRate,
          costCenter: 'SALES',
          description: `Fatura: ${invoiceNo}`,
          referenceId: order.id,
          referenceType: 'ORDER',
          invoiceId: invoice.id,
        },
      })

      await writeAuditLog(d as any, {
        entityType: 'Invoice',
        entityId: invoice.id,
        action: 'CREATE',
        newData: invoice,
        description: `Fatura oluşturuldu: ${invoiceNo} (Sipariş: ${order.orderNo})`,
      })

      return { success: true, data: invoice }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
