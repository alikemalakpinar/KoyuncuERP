/**
 * Products & Inventory IPC Handlers – Branch-Scoped & Protected
 *
 * Products/variants are global (shared catalog).
 * StockMovements and Invoices are branch-scoped.
 */

import type { IpcMain } from 'electron'
import { protectedProcedure } from './_secure'
import { writeAuditLog } from './audit'

export function registerProductHandlers(ipc: IpcMain) {
  // Products are global catalog – all branches can see
  ipc.handle('products:list', protectedProcedure('read', async (ctx, filters?: {
    search?: string; material?: string; collection?: string
  }) => {
    const where: any = { isActive: true }
    if (filters?.material) where.material = filters.material
    if (filters?.collection) where.collection = filters.collection
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    return ctx.prisma.product.findMany({
      where,
      include: { variants: { include: { stocks: { include: { warehouse: true } } } } },
      orderBy: { updatedAt: 'desc' },
    })
  }))

  ipc.handle('products:get', protectedProcedure('read', async (ctx, args: { id: string }) => {
    return ctx.prisma.product.findUnique({
      where: { id: args.id },
      include: {
        variants: { include: { stocks: { include: { warehouse: true } } } },
        stockMovements: {
          where: { branchId: ctx.activeBranchId },
          orderBy: { createdAt: 'desc' }, take: 50,
          include: { warehouse: true, variant: true },
        },
      },
    })
  }))

  ipc.handle('products:create', protectedProcedure('manage_inventory', async (ctx, data: any) => {
    try {
      const product = await ctx.prisma.product.create({
        data: {
          code: data.code, name: data.name,
          collection: data.collection || null,
          material: data.material || 'WOOL',
          description: data.description || null,
          images: data.images || [],
          variants: data.variants?.length ? {
            create: data.variants.map((v: any) => ({
              sku: v.sku, size: v.size, width: v.width, length: v.length,
              areaM2: (v.width * v.length) / 10000,
              color: v.color || null, barcode: v.barcode || null,
              listPrice: v.listPrice, baseCost: v.baseCost,
            })),
          } : undefined,
        },
        include: { variants: true },
      })
      await writeAuditLog({
        entityType: 'Product', entityId: product.id, action: 'CREATE',
        newData: product, userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Ürün oluşturuldu: ${product.code} – ${product.name}`,
      })
      return { success: true, data: product }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }))

  ipc.handle('products:update', protectedProcedure('manage_inventory', async (ctx, args: {
    id: string; data: any
  }) => {
    try {
      const previous = await ctx.prisma.product.findUnique({ where: { id: args.id } })
      const product = await ctx.prisma.product.update({
        where: { id: args.id },
        data: {
          name: args.data.name, collection: args.data.collection,
          material: args.data.material, description: args.data.description,
          images: args.data.images,
        },
      })
      await writeAuditLog({
        entityType: 'Product', entityId: args.id, action: 'UPDATE',
        previousData: previous, newData: product,
        userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Ürün güncellendi: ${product.code}`,
      })
      return { success: true, data: product }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }))

  ipc.handle('inventory:warehouses', protectedProcedure('read', async (ctx) => {
    return ctx.prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } })
  }))

  ipc.handle('inventory:stockByVariant', protectedProcedure('read', async (ctx, args: { variantId: string }) => {
    return ctx.prisma.stock.findMany({
      where: { variantId: args.variantId },
      include: { warehouse: true },
    })
  }))

  ipc.handle('invoices:createFromOrder', protectedProcedure('manage_orders', async (ctx, data: { orderId: string }) => {
    try {
      const order = await ctx.prisma.order.findFirst({
        where: { id: data.orderId, branchId: ctx.activeBranchId },
        include: { account: true, items: true },
      })
      if (!order) return { success: false, error: 'Sipariş bulunamadı' }

      const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`
      const invoice = await ctx.prisma.invoice.create({
        data: {
          invoiceNo, orderId: order.id, branchId: ctx.activeBranchId,
          date: new Date(),
          dueDate: order.account?.paymentTermDays
            ? new Date(Date.now() + order.account.paymentTermDays * 86400000) : null,
          subtotal: order.totalAmount, taxTotal: order.vatAmount,
          grandTotal: order.grandTotal, currency: order.currency,
          status: 'FINALIZED',
        },
      })

      const entryNo = `LE-${Date.now().toString(36).toUpperCase()}`
      await ctx.prisma.ledgerEntry.create({
        data: {
          entryNo, accountId: order.accountId, branchId: ctx.activeBranchId,
          type: 'INVOICE', debit: order.grandTotal, credit: 0,
          currency: order.currency, exchangeRate: order.orderExchangeRate,
          costCenter: 'SALES', description: `Fatura: ${invoiceNo}`,
          referenceId: order.id, referenceType: 'ORDER', invoiceId: invoice.id,
        },
      })

      await writeAuditLog({
        entityType: 'Invoice', entityId: invoice.id, action: 'CREATE',
        newData: invoice, userId: ctx.user.id, branchId: ctx.activeBranchId,
        description: `Fatura: ${invoiceNo} (Sipariş: ${order.orderNo})`,
      })
      return { success: true, data: invoice }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }))
}
