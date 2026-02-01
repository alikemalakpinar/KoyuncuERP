/**
 * PIM IPC Handlers – Product Information Management
 *
 * - Product attributes (dynamic EAV)
 * - Categories with required attributes
 * - Unit of Measure + conversions
 * - Variant dimensions (n-axis generator)
 */

import type { IpcMain } from 'electron'
import { protectedProcedure } from './_secure'
import { AttributeService, UomService, VariantGeneratorService, CategoryService } from '../services/pim'
import { getDb } from '../db'

export function registerPimHandlers(ipcMain: IpcMain) {
  const db = () => getDb()

  // ── Attributes ────────────────────────────────────────────

  ipcMain.handle('pim:attributes:list', protectedProcedure('read', async () => {
    const svc = new AttributeService(db())
    return svc.listAttributes()
  }))

  ipcMain.handle('pim:attributes:create', protectedProcedure('manage_inventory', async (_ctx, data: any) => {
    const svc = new AttributeService(db())
    return svc.createAttribute(data)
  }))

  ipcMain.handle('pim:attributes:setValue', protectedProcedure('manage_inventory', async (_ctx, data: any) => {
    const svc = new AttributeService(db())
    return svc.setProductAttributeValue(data)
  }))

  ipcMain.handle('pim:attributes:getProduct', protectedProcedure('read', async (_ctx, args: { productId: string }) => {
    const svc = new AttributeService(db())
    return svc.getProductAttributes(args.productId)
  }))

  ipcMain.handle('pim:attributes:filter', protectedProcedure('read', async (_ctx, args: { attributeId: string; value: string | number }) => {
    const svc = new AttributeService(db())
    return svc.filterProductsByAttribute(args.attributeId, args.value)
  }))

  // ── Categories ────────────────────────────────────────────

  ipcMain.handle('pim:categories:list', protectedProcedure('read', async () => {
    const svc = new CategoryService(db())
    return svc.listCategories()
  }))

  ipcMain.handle('pim:categories:create', protectedProcedure('manage_inventory', async (_ctx, data: any) => {
    const svc = new CategoryService(db())
    return svc.createCategory(data)
  }))

  ipcMain.handle('pim:categories:assignAttribute', protectedProcedure('manage_inventory', async (_ctx, data: {
    categoryId: string; attributeId: string; isRequired?: boolean
  }) => {
    const svc = new CategoryService(db())
    return svc.assignAttribute(data.categoryId, data.attributeId, data.isRequired)
  }))

  // ── Units of Measure ──────────────────────────────────────

  ipcMain.handle('pim:uom:list', protectedProcedure('read', async (_ctx, args?: { category?: string }) => {
    const svc = new UomService(db())
    return svc.listUnits(args?.category)
  }))

  ipcMain.handle('pim:uom:create', protectedProcedure('manage_inventory', async (_ctx, data: any) => {
    const svc = new UomService(db())
    return svc.createUnit(data)
  }))

  ipcMain.handle('pim:uom:addConversion', protectedProcedure('manage_inventory', async (_ctx, data: any) => {
    const svc = new UomService(db())
    return svc.addConversion(data)
  }))

  ipcMain.handle('pim:uom:convert', protectedProcedure('read', async (_ctx, args: {
    qty: number; fromUomCode: string; toUomCode: string; productId?: string
  }) => {
    const svc = new UomService(db())
    const result = await svc.convert(args.qty, args.fromUomCode, args.toUomCode, args.productId)
    return { result: result.toFixed(4), fromUnit: args.fromUomCode, toUnit: args.toUomCode }
  }))

  ipcMain.handle('pim:uom:conversions', protectedProcedure('read', async (_ctx, args?: { productId?: string }) => {
    const svc = new UomService(db())
    return svc.listConversions(args?.productId)
  }))

  // ── Variant Dimensions ────────────────────────────────────

  ipcMain.handle('pim:dimensions:list', protectedProcedure('read', async () => {
    const svc = new VariantGeneratorService(db())
    return svc.listDimensions()
  }))

  ipcMain.handle('pim:dimensions:create', protectedProcedure('manage_inventory', async (_ctx, data: { code: string; name: string }) => {
    const svc = new VariantGeneratorService(db())
    return svc.createDimension(data)
  }))

  ipcMain.handle('pim:dimensions:addValue', protectedProcedure('manage_inventory', async (_ctx, data: {
    dimensionId: string; code: string; label: string
  }) => {
    const svc = new VariantGeneratorService(db())
    return svc.addDimensionValue(data)
  }))

  ipcMain.handle('pim:dimensions:generate', protectedProcedure('read', async (_ctx, args: {
    axes: Record<string, string[]>
  }) => {
    const svc = new VariantGeneratorService(db())
    return svc.generateCombinations(args.axes)
  }))
}
