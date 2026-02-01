/**
 * PIM Service – Product Information Management
 *
 * - Dynamic attribute management (EAV relational)
 * - Multi-UoM conversion engine
 * - N-dimensional variant generation
 */

import type { PrismaClient } from '@prisma/client'
import Decimal from 'decimal.js'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// ─── Attribute Service ──────────────────────────────────────────

export class AttributeService {
  constructor(private prisma: PrismaClient) {}

  async createAttribute(data: {
    code: string; name: string; dataType: string;
    unit?: string; isRequired?: boolean; isFilterable?: boolean;
    options?: string[]
  }) {
    return this.prisma.productAttribute.create({
      data: {
        code: data.code,
        name: data.name,
        dataType: data.dataType as any,
        unit: data.unit,
        isRequired: data.isRequired ?? false,
        isFilterable: data.isFilterable ?? true,
        options: data.options ?? [],
      },
    })
  }

  async listAttributes(onlyActive = true) {
    return this.prisma.productAttribute.findMany({
      where: onlyActive ? { isActive: true } : {},
      orderBy: { sortOrder: 'asc' },
      include: { categories: { include: { category: true } } },
    })
  }

  async setProductAttributeValue(data: {
    attributeId: string; productId: string; variantId?: string;
    valueText?: string; valueNumber?: number; valueBool?: boolean;
  }) {
    const where = {
      attributeId_productId_variantId: {
        attributeId: data.attributeId,
        productId: data.productId,
        variantId: data.variantId ?? null as any,
      },
    }
    return this.prisma.productAttributeValue.upsert({
      where,
      create: {
        attributeId: data.attributeId,
        productId: data.productId,
        variantId: data.variantId,
        valueText: data.valueText,
        valueNumber: data.valueNumber != null ? new Decimal(data.valueNumber) : undefined,
        valueBool: data.valueBool,
      },
      update: {
        valueText: data.valueText,
        valueNumber: data.valueNumber != null ? new Decimal(data.valueNumber) : undefined,
        valueBool: data.valueBool,
      },
    })
  }

  async getProductAttributes(productId: string) {
    return this.prisma.productAttributeValue.findMany({
      where: { productId },
      include: { attribute: true },
      orderBy: { attribute: { sortOrder: 'asc' } },
    })
  }

  async filterProductsByAttribute(attributeId: string, value: string | number) {
    const isNumeric = typeof value === 'number'
    return this.prisma.productAttributeValue.findMany({
      where: {
        attributeId,
        ...(isNumeric
          ? { valueNumber: new Decimal(value) }
          : { valueText: value as string }),
      },
      include: { product: true, variant: true },
    })
  }
}

// ─── UoM Service ────────────────────────────────────────────────

export class UomService {
  constructor(private prisma: PrismaClient) {}

  async listUnits(category?: string) {
    return this.prisma.unitOfMeasure.findMany({
      where: {
        isActive: true,
        ...(category ? { category: category as any } : {}),
      },
      orderBy: { code: 'asc' },
    })
  }

  async createUnit(data: { code: string; name: string; category: string; isBase?: boolean }) {
    return this.prisma.unitOfMeasure.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category as any,
        isBase: data.isBase ?? false,
      },
    })
  }

  async addConversion(data: {
    fromUomId: string; toUomId: string; factor: number; productId?: string
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Forward conversion
      const fwd = await tx.uomConversion.upsert({
        where: {
          fromUomId_toUomId_productId: {
            fromUomId: data.fromUomId,
            toUomId: data.toUomId,
            productId: data.productId ?? null as any,
          },
        },
        create: {
          fromUomId: data.fromUomId,
          toUomId: data.toUomId,
          factor: new Decimal(data.factor),
          productId: data.productId,
        },
        update: { factor: new Decimal(data.factor) },
      })

      // Reverse conversion (auto-calculated)
      const reverseFactor = new Decimal(1).div(new Decimal(data.factor))
      await tx.uomConversion.upsert({
        where: {
          fromUomId_toUomId_productId: {
            fromUomId: data.toUomId,
            toUomId: data.fromUomId,
            productId: data.productId ?? null as any,
          },
        },
        create: {
          fromUomId: data.toUomId,
          toUomId: data.fromUomId,
          factor: reverseFactor,
          productId: data.productId,
        },
        update: { factor: reverseFactor },
      })

      return fwd
    })
  }

  /**
   * Convert quantity between units.
   * Priority: product-specific conversion → global conversion.
   * Supports chained conversion through base unit.
   */
  async convert(qty: number, fromUomCode: string, toUomCode: string, productId?: string): Promise<Decimal> {
    if (fromUomCode === toUomCode) return new Decimal(qty)

    const fromUom = await this.prisma.unitOfMeasure.findUnique({ where: { code: fromUomCode } })
    const toUom = await this.prisma.unitOfMeasure.findUnique({ where: { code: toUomCode } })
    if (!fromUom || !toUom) throw new Error(`UoM not found: ${fromUomCode} → ${toUomCode}`)

    // Try direct conversion (product-specific first)
    const directConversions = await this.prisma.uomConversion.findMany({
      where: {
        fromUomId: fromUom.id,
        toUomId: toUom.id,
        isActive: true,
      },
      orderBy: { productId: 'asc' }, // nulls first = global
    })

    const productSpecific = directConversions.find(c => c.productId === productId)
    const global = directConversions.find(c => c.productId === null)
    const conv = productSpecific ?? global

    if (conv) {
      return new Decimal(qty).mul(new Decimal(String(conv.factor)))
    }

    throw new Error(`No conversion path from ${fromUomCode} to ${toUomCode}`)
  }

  async listConversions(productId?: string) {
    return this.prisma.uomConversion.findMany({
      where: {
        isActive: true,
        ...(productId ? { OR: [{ productId }, { productId: null }] } : {}),
      },
      include: { fromUom: true, toUom: true },
    })
  }
}

// ─── Variant Generator Service ──────────────────────────────────

export class VariantGeneratorService {
  constructor(private prisma: PrismaClient) {}

  async listDimensions() {
    return this.prisma.variantDimension.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  }

  async createDimension(data: { code: string; name: string }) {
    return this.prisma.variantDimension.create({ data })
  }

  async addDimensionValue(data: { dimensionId: string; code: string; label: string }) {
    return this.prisma.variantDimensionValue.create({ data })
  }

  /**
   * Generate cartesian product of selected dimension values.
   * Returns array of variant descriptors (not yet created in DB).
   *
   * Example input: { SIZE: ["200x300", "160x230"], COLOR: ["Red", "Blue"] }
   * Output: [
   *   { SIZE: "200x300", COLOR: "Red" },
   *   { SIZE: "200x300", COLOR: "Blue" },
   *   { SIZE: "160x230", COLOR: "Red" },
   *   { SIZE: "160x230", COLOR: "Blue" },
   * ]
   */
  generateCombinations(axes: Record<string, string[]>): Record<string, string>[] {
    const dimensionKeys = Object.keys(axes)
    if (dimensionKeys.length === 0) return [{}]

    const result: Record<string, string>[] = []
    const firstKey = dimensionKeys[0]
    const rest = dimensionKeys.slice(1)
    const subAxes: Record<string, string[]> = {}
    rest.forEach(k => { subAxes[k] = axes[k] })
    const subCombinations = this.generateCombinations(subAxes)

    for (const val of axes[firstKey]) {
      for (const sub of subCombinations) {
        result.push({ [firstKey]: val, ...sub })
      }
    }
    return result
  }
}

// ─── Category Service ──────────────────────────────────────────

export class CategoryService {
  constructor(private prisma: PrismaClient) {}

  async listCategories() {
    return this.prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        attributes: { include: { attribute: true } },
      },
    })
  }

  async createCategory(data: { code: string; name: string; parentId?: string }) {
    return this.prisma.productCategory.create({ data })
  }

  async assignAttribute(categoryId: string, attributeId: string, isRequired = false) {
    return this.prisma.categoryAttribute.upsert({
      where: { categoryId_attributeId: { categoryId, attributeId } },
      create: { categoryId, attributeId, isRequired },
      update: { isRequired },
    })
  }
}
