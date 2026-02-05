/**
 * Seed script – Creates initial data for KoyuncuERP
 * Minimal version: Users, Branches, Warehouses, Sample Accounts
 */

import { PrismaClient, AccountType, ProductMaterial, OrderStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...\n')

  // ═══════════════════════════════════════════════════════════
  // 1. WAREHOUSES (must be created before branches)
  // ═══════════════════════════════════════════════════════════
  console.log('🏭 Creating warehouses...')

  const warehouseIST = await prisma.warehouse.upsert({
    where: { code: 'WH-IST' },
    update: {},
    create: { code: 'WH-IST', name: 'Istanbul Depo', city: 'Istanbul', country: 'TR' },
  })
  console.log(`   ✓ ${warehouseIST.name}`)

  const warehouseUSA = await prisma.warehouse.upsert({
    where: { code: 'WH-USA' },
    update: {},
    create: { code: 'WH-USA', name: 'USA Warehouse', city: 'New Jersey', country: 'US' },
  })
  console.log(`   ✓ ${warehouseUSA.name}`)

  // ═══════════════════════════════════════════════════════════
  // 2. BRANCHES
  // ═══════════════════════════════════════════════════════════
  console.log('\n📍 Creating branches...')

  const branchIST = await prisma.branch.upsert({
    where: { code: 'IST' },
    update: {},
    create: {
      code: 'IST',
      name: 'Istanbul Merkez',
      address: 'Laleli, Istanbul',
      warehouseId: warehouseIST.id,
    },
  })
  console.log(`   ✓ ${branchIST.name}`)

  const branchUSA = await prisma.branch.upsert({
    where: { code: 'USA' },
    update: {},
    create: {
      code: 'USA',
      name: 'USA Office',
      address: 'New Jersey, USA',
      warehouseId: warehouseUSA.id,
    },
  })
  console.log(`   ✓ ${branchUSA.name}`)

  // ═══════════════════════════════════════════════════════════
  // 3. USERS
  // ═══════════════════════════════════════════════════════════
  console.log('\n👤 Creating users...')
  const passwordHash = await bcrypt.hash('Koyuncu2026!', 12)

  const users = [
    { email: 'owner@koyuncu.com', fullName: 'Koyuncu Patron', role: 'OWNER' as const },
    { email: 'ali.celik@koyuncu.com', fullName: 'Ali Çelik', role: 'MANAGER' as const },
    { email: 'fatma.ozkan@koyuncu.com', fullName: 'Fatma Özkan', role: 'SALES' as const },
  ]

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        fullName: u.fullName,
      },
    })
    console.log(`   ✓ ${user.fullName} (${u.role})`)

    // Attach to branches - OWNER gets all branches
    const branches = u.role === 'OWNER' ? [branchIST, branchUSA] : [branchIST]
    for (const branch of branches) {
      await prisma.userBranch.upsert({
        where: { userId_branchId: { userId: user.id, branchId: branch.id } },
        update: {},
        create: { userId: user.id, branchId: branch.id, role: u.role },
      })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 4. SAMPLE ACCOUNTS (Customers)
  // ═══════════════════════════════════════════════════════════
  console.log('\n👥 Creating sample accounts...')

  const customers = [
    { code: 'C-001', name: 'HomeStyle Inc.', city: 'New York', country: 'USA' },
    { code: 'C-002', name: 'Luxury Floors NY', city: 'Los Angeles', country: 'USA' },
    { code: 'C-003', name: 'Berlin Teppich GmbH', city: 'Berlin', country: 'Germany' },
    { code: 'C-004', name: 'Dubai Interiors LLC', city: 'Dubai', country: 'UAE' },
    { code: 'C-005', name: 'London Carpets Ltd', city: 'London', country: 'UK' },
  ]

  for (const c of customers) {
    const account = await prisma.account.upsert({
      where: { branchId_code: { branchId: branchIST.id, code: c.code } },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        type: AccountType.CUSTOMER,
        branchId: branchIST.id,
        city: c.city,
        country: c.country,
        currency: 'USD',
        paymentTermDays: 30,
        riskLimit: 100000,
      },
    })
    console.log(`   ✓ ${account.name}`)
  }

  // ═══════════════════════════════════════════════════════════
  // 5. SAMPLE PRODUCTS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📦 Creating sample products...')

  const products = [
    { code: 'KHK-001', name: 'Klasik Halı Kırmızı', material: ProductMaterial.WOOL },
    { code: 'KHK-002', name: 'Klasik Halı Mavi', material: ProductMaterial.WOOL },
    { code: 'MHK-001', name: 'Modern Halı Gri', material: ProductMaterial.ACRYLIC },
    { code: 'IPK-001', name: 'İpek Halı Premium', material: ProductMaterial.SILK },
    { code: 'BMB-001', name: 'Bambu Halı Doğal', material: ProductMaterial.BAMBOO },
  ]

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        name: p.name,
        material: p.material,
      },
    })

    // Create a variant for each product
    const sku = `${p.code}-200x300`
    await prisma.productVariant.upsert({
      where: { sku },
      update: {},
      create: {
        productId: product.id,
        sku,
        size: '200x300',
        width: 200,
        length: 300,
        areaM2: 6.0,
        listPrice: 450,
        baseCost: 280,
      },
    })

    console.log(`   ✓ ${product.name}`)
  }

  // ═══════════════════════════════════════════════════════════
  // 6. PRICE LISTS
  // ═══════════════════════════════════════════════════════════
  console.log('\n💰 Creating price lists...')

  const priceLists = [
    { name: 'USA Wholesale', currency: 'USD' },
    { name: 'Europe Standard', currency: 'EUR' },
    { name: 'VIP Customer', currency: 'USD' },
  ]

  for (const pl of priceLists) {
    const priceList = await prisma.priceList.create({
      data: {
        name: pl.name,
        currency: pl.currency,
      },
    })
    console.log(`   ✓ ${priceList.name}`)
  }

  // ═══════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════
  console.log('\n✅ Seed completed successfully!')
  console.log('\n📋 Login credentials:')
  console.log('   Email: owner@koyuncu.com')
  console.log('   Password: Koyuncu2026!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
