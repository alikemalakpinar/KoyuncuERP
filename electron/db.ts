/**
 * Prisma Database Service – Main Process Only
 *
 * Singleton PrismaClient. Renderer process NEVER touches this directly.
 * All access is through IPC handlers.
 */

import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | null = null

export function getDb(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })
  }
  return prisma
}

export async function disconnectDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}
