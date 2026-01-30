/**
 * Prisma Database Service – Main Process Only
 *
 * Singleton PrismaClient. Renderer process NEVER touches this directly.
 * All access is through IPC handlers.
 */

// In a real build, PrismaClient would be available here.
// For development without a running DB, we export a mock-compatible interface.
// Replace with: import { PrismaClient } from '@prisma/client'

export interface DbClient {
  account: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
  }
  order: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
  }
  orderItem: {
    createMany: (args: any) => Promise<any>
  }
  ledgerEntry: {
    findMany: (args?: any) => Promise<any[]>
    create: (args: any) => Promise<any>
  }
  commissionRecord: {
    findMany: (args?: any) => Promise<any[]>
    create: (args: any) => Promise<any>
  }
  landedCost: {
    findMany: (args?: any) => Promise<any[]>
  }
  product: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
  }
  productVariant: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any>
  }
  warehouse: {
    findMany: (args?: any) => Promise<any[]>
  }
  stock: {
    findMany: (args?: any) => Promise<any[]>
    upsert: (args: any) => Promise<any>
  }
  stockMovement: {
    findMany: (args?: any) => Promise<any[]>
    create: (args: any) => Promise<any>
  }
  invoice: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
  }
  exchangeRate: {
    findFirst: (args: any) => Promise<any>
  }
  auditLog: {
    create: (args: any) => Promise<any>
    findMany: (args?: any) => Promise<any[]>
  }
  inventoryLot: {
    findMany: (args?: any) => Promise<any[]>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
  }
  inventoryTransaction: {
    findMany: (args?: any) => Promise<any[]>
    create: (args: any) => Promise<any>
  }
  priceList: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
  }
  priceListItem: {
    findMany: (args?: any) => Promise<any[]>
    upsert: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
  }
  periodLock: {
    findMany: (args?: any) => Promise<any[]>
    create: (args: any) => Promise<any>
  }
  $transaction: (fn: (tx: any) => Promise<any>) => Promise<any>
}

let prisma: DbClient | null = null

export function getDb(): DbClient {
  if (!prisma) {
    // In production: prisma = new PrismaClient()
    // For now, this is a type placeholder.
    // The actual PrismaClient instantiation requires a running PostgreSQL.
    throw new Error(
      'Database not initialized. Set DATABASE_URL and run prisma generate.',
    )
  }
  return prisma
}

export function initDb(client: DbClient) {
  prisma = client
}
