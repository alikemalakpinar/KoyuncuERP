/**
 * Seed script – Creates initial branches, OWNER user, and cash registers.
 *
 * Usage: npx ts-node prisma/seed.ts
 * Or add to package.json prisma.seed
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const BRANCHES = [
  { code: 'IST', name: 'Istanbul Merkez', city: 'Istanbul', address: 'Laleli, Istanbul' },
  { code: 'ANK', name: 'Ankara Şube', city: 'Ankara', address: 'Siteler, Ankara' },
  { code: 'IZM', name: 'İzmir Şube', city: 'İzmir', address: 'Kemeraltı, İzmir' },
  { code: 'GZT', name: 'Gaziantep Şube', city: 'Gaziantep', address: 'Şahinbey, Gaziantep' },
]

async function main() {
  console.log('Seeding database...')

  // Create branches
  const branchRecords = []
  for (const b of BRANCHES) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: {},
      create: { code: b.code, name: b.name, city: b.city, address: b.address },
    })
    branchRecords.push(branch)
    console.log(`  Branch: ${branch.code} - ${branch.name}`)
  }

  // Create OWNER user
  const passwordHash = await bcrypt.hash('Koyuncu2026!', 12)
  const owner = await prisma.user.upsert({
    where: { email: 'owner@koyuncu.com' },
    update: {},
    create: {
      email: 'owner@koyuncu.com',
      passwordHash,
      fullName: 'Koyuncu Patron',
    },
  })
  console.log(`  Owner user: ${owner.email}`)

  // Attach owner to all branches
  for (const branch of branchRecords) {
    await prisma.userBranch.upsert({
      where: { userId_branchId: { userId: owner.id, branchId: branch.id } },
      update: {},
      create: { userId: owner.id, branchId: branch.id, role: 'OWNER' },
    })
  }
  console.log(`  Owner attached to ${branchRecords.length} branches`)

  // Create a cash register per branch
  for (const branch of branchRecords) {
    await prisma.cashRegister.upsert({
      where: { id: `cr-${branch.code.toLowerCase()}` },
      update: {},
      create: {
        id: `cr-${branch.code.toLowerCase()}`,
        name: `${branch.name} Kasa`,
        branchId: branch.id,
        currency: 'TRY',
      },
    })
  }
  console.log(`  Cash registers created`)

  // Create a default warehouse per branch
  for (const branch of branchRecords) {
    const code = `WH-${branch.code}`
    const existing = await prisma.warehouse.findFirst({ where: { code } })
    if (!existing) {
      await prisma.warehouse.create({
        data: { code, name: `${branch.name} Depo`, location: branch.city ?? '' },
      })
    }
  }
  console.log(`  Warehouses created`)

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
