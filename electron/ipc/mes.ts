/**
 * MES IPC Handlers – Manufacturing Execution System
 *
 * - BOM (Bill of Materials) CRUD
 * - Work Order lifecycle
 * - Material consumption
 * - Production receipt
 */

import type { IpcMain } from 'electron'
import { z } from 'zod'
import { protectedProcedure } from './_secure'
import { BomService, WorkOrderService } from '../services/manufacturing'
import { getDb } from '../db'
import { nextDocumentNo } from '../services/sequence'

export function registerMesHandlers(ipcMain: IpcMain) {
  const db = () => getDb()

  // ══ Bill of Materials ═════════════════════════════════════

  ipcMain.handle('bom:list', protectedProcedure('read', async (_ctx, args?: { productId?: string }) => {
    const svc = new BomService(db())
    return svc.list(args?.productId)
  }))

  ipcMain.handle('bom:get', protectedProcedure('read', async (_ctx, args: { id: string }) => {
    const svc = new BomService(db())
    return svc.get(args.id)
  }))

  ipcMain.handle('bom:create', protectedProcedure('manage_inventory', async (_ctx, data: any) => {
    const svc = new BomService(db())
    return svc.create(data)
  }))

  ipcMain.handle('bom:calculateCost', protectedProcedure('view_cost_price', async (_ctx, args: { bomId: string }) => {
    const svc = new BomService(db())
    const result = await svc.calculateCost(args.bomId)
    return {
      materialCost: result.materialCost.toFixed(2),
      laborCost: result.laborCost.toFixed(2),
      overheadCost: result.overheadCost.toFixed(2),
      totalCost: result.totalCost.toFixed(2),
      breakdown: result.breakdown.map(b => ({
        productName: b.productName,
        qty: b.qty.toFixed(4),
        unitCost: b.unitCost.toFixed(2),
        lineCost: b.lineCost.toFixed(2),
      })),
    }
  }))

  // ══ Work Orders ═══════════════════════════════════════════

  ipcMain.handle('workOrders:list', protectedProcedure('read', async (ctx, filters?: any) => {
    const svc = new WorkOrderService(db())
    return svc.list(ctx.activeBranchId, filters)
  }))

  ipcMain.handle('workOrders:get', protectedProcedure('read', async (_ctx, args: { id: string }) => {
    const svc = new WorkOrderService(db())
    return svc.get(args.id)
  }))

  ipcMain.handle('workOrders:create', protectedProcedure('manage_inventory', async (ctx, data: any) => {
    const workOrderNo = await nextDocumentNo(db(), ctx.activeBranchId, 'WORK_ORDER')
    const svc = new WorkOrderService(db())
    return svc.create({ ...data, workOrderNo, branchId: ctx.activeBranchId })
  }))

  ipcMain.handle('workOrders:release', protectedProcedure('manage_inventory', async (_ctx, args: { id: string }) => {
    const svc = new WorkOrderService(db())
    return svc.release(args.id)
  }))

  ipcMain.handle('workOrders:start', protectedProcedure('manage_inventory', async (_ctx, args: { id: string }) => {
    const svc = new WorkOrderService(db())
    return svc.startProduction(args.id)
  }))

  ipcMain.handle('workOrders:consume', protectedProcedure('manage_inventory', async (_ctx, args: {
    workOrderId: string; warehouseId: string
  }) => {
    const svc = new WorkOrderService(db())
    return svc.consumeMaterials(args.workOrderId, args.warehouseId)
  }))

  ipcMain.handle('workOrders:complete', protectedProcedure('manage_inventory', async (_ctx, args: {
    workOrderId: string; warehouseId: string; producedQty: number; wasteQty?: number
  }) => {
    const svc = new WorkOrderService(db())
    return svc.completeProduction(args.workOrderId, args.warehouseId, args.producedQty, args.wasteQty)
  }))

  ipcMain.handle('workOrders:cancel', protectedProcedure('manage_inventory', async (_ctx, args: { id: string }) => {
    const svc = new WorkOrderService(db())
    return svc.cancel(args.id)
  }))
}
