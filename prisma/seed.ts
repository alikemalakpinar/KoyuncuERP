/**
 * Seed script – Creates initial data for KoyuncuERP
 * Includes: Branches, Users, Customers, Agencies, Products, Sample Orders
 *
 * Usage: npx ts-node prisma/seed.ts
 * Or add to package.json prisma.seed
 */

import { PrismaClient, AccountType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const BRANCHES = [
  { code: 'IST', name: 'Istanbul Merkez', city: 'Istanbul', address: 'Laleli, Istanbul' },
  { code: 'ANK', name: 'Ankara Şube', city: 'Ankara', address: 'Siteler, Ankara' },
  { code: 'IZM', name: 'İzmir Şube', city: 'İzmir', address: 'Kemeraltı, İzmir' },
  { code: 'GZT', name: 'Gaziantep Şube', city: 'Gaziantep', address: 'Şahinbey, Gaziantep' },
]

const USERS = [
  { email: 'owner@koyuncu.com', fullName: 'Koyuncu Patron', role: 'OWNER' as const },
  { email: 'ali.celik@koyuncu.com', fullName: 'Ali Çelik', role: 'MANAGER' as const },
  { email: 'fatma.ozkan@koyuncu.com', fullName: 'Fatma Özkan', role: 'SALES' as const },
  { email: 'hasan.demir@koyuncu.com', fullName: 'Hasan Demir', role: 'SALES' as const },
  { email: 'zeynep.yildiz@koyuncu.com', fullName: 'Zeynep Yıldız', role: 'SALES' as const },
]

const CUSTOMERS = [
  { code: 'C-001', name: 'HomeStyle Inc.', type: 'CUSTOMER' as AccountType, city: 'New York', country: 'USA', currency: 'USD', paymentTermDays: 30 },
  { code: 'C-002', name: 'Luxury Floors NY', type: 'CUSTOMER' as AccountType, city: 'Los Angeles', country: 'USA', currency: 'USD', paymentTermDays: 45 },
  { code: 'C-003', name: 'Pacific Rugs', type: 'CUSTOMER' as AccountType, city: 'San Francisco', country: 'USA', currency: 'USD', paymentTermDays: 30 },
  { code: 'C-004', name: 'Desert Home Decor', type: 'CUSTOMER' as AccountType, city: 'Phoenix', country: 'USA', currency: 'USD', paymentTermDays: 30 },
  { code: 'C-005', name: 'Chicago Interiors', type: 'CUSTOMER' as AccountType, city: 'Chicago', country: 'USA', currency: 'USD', paymentTermDays: 60 },
  { code: 'C-006', name: 'Texas Carpets & More', type: 'CUSTOMER' as AccountType, city: 'Houston', country: 'USA', currency: 'USD', paymentTermDays: 30 },
  { code: 'C-007', name: 'Berlin Teppich Haus', type: 'CUSTOMER' as AccountType, city: 'Berlin', country: 'Germany', currency: 'EUR', paymentTermDays: 45 },
  { code: 'C-008', name: 'Paris Décor Maison', type: 'CUSTOMER' as AccountType, city: 'Paris', country: 'France', currency: 'EUR', paymentTermDays: 30 },
  { code: 'C-009', name: 'London Rugs Ltd', type: 'CUSTOMER' as AccountType, city: 'London', country: 'UK', currency: 'GBP', paymentTermDays: 30 },
  { code: 'C-010', name: 'Dubai Luxury Interiors', type: 'CUSTOMER' as AccountType, city: 'Dubai', country: 'UAE', currency: 'USD', paymentTermDays: 15 },
]

const AGENCIES = [
  { code: 'AG-001', name: 'ABC Trading LLC', region: 'East Coast USA', defaultCommission: 5.0 },
  { code: 'AG-002', name: 'West Coast Carpets', region: 'West Coast USA', defaultCommission: 4.5 },
  { code: 'AG-003', name: 'Southern Flooring Co.', region: 'South USA', defaultCommission: 5.0 },
  { code: 'AG-004', name: 'Midwest Distributors', region: 'Midwest USA', defaultCommission: 4.0 },
  { code: 'AG-005', name: 'Texas Imports', region: 'Texas', defaultCommission: 4.0 },
  { code: 'AG-006', name: 'Euro Trade Partners', region: 'Europe', defaultCommission: 3.5 },
]

const AGENCY_STAFF = [
  { agencyCode: 'AG-001', name: 'Robert Johnson', commissionRate: 2.0 },
  { agencyCode: 'AG-001', name: 'Emily Davis', commissionRate: 1.5 },
  { agencyCode: 'AG-001', name: 'Michael Chen', commissionRate: 1.8 },
  { agencyCode: 'AG-002', name: 'Sarah Williams', commissionRate: 2.0 },
  { agencyCode: 'AG-002', name: 'David Kim', commissionRate: 1.5 },
  { agencyCode: 'AG-003', name: 'James Brown', commissionRate: 2.0 },
  { agencyCode: 'AG-003', name: 'Lisa Martinez', commissionRate: 1.5 },
  { agencyCode: 'AG-004', name: 'Tom Wilson', commissionRate: 1.5 },
  { agencyCode: 'AG-005', name: 'Anna Garcia', commissionRate: 1.5 },
  { agencyCode: 'AG-006', name: 'Hans Mueller', commissionRate: 1.5 },
]

const SUPPLIERS = [
  { code: 'S-001', name: 'Yün İplik A.Ş.', type: 'SUPPLIER' as AccountType, city: 'Gaziantep', country: 'Turkey', currency: 'TRY' },
  { code: 'S-002', name: 'İpek Hammadde Ltd.', type: 'SUPPLIER' as AccountType, city: 'Bursa', country: 'Turkey', currency: 'TRY' },
  { code: 'S-003', name: 'Boya Kimya San.', type: 'SUPPLIER' as AccountType, city: 'Kayseri', country: 'Turkey', currency: 'TRY' },
]

const PRODUCTS = [
  { code: 'KHK-001', name: 'Klasik Halı - Kırmızı', material: 'Yün', listPrice: 450, cost: 280, unit: 'm2' },
  { code: 'KHK-002', name: 'Klasik Halı - Mavi', material: 'Yün', listPrice: 450, cost: 280, unit: 'm2' },
  { code: 'KHK-003', name: 'Klasik Halı - Yeşil', material: 'Yün', listPrice: 450, cost: 280, unit: 'm2' },
  { code: 'MHK-001', name: 'Modern Halı - Gri', material: 'Akrilik', listPrice: 320, cost: 180, unit: 'm2' },
  { code: 'MHK-002', name: 'Modern Halı - Bej', material: 'Akrilik', listPrice: 320, cost: 180, unit: 'm2' },
  { code: 'IPK-001', name: 'İpek Halı - Premium', material: 'İpek', listPrice: 1200, cost: 750, unit: 'm2' },
  { code: 'IPK-002', name: 'İpek Halı - Deluxe', material: 'İpek', listPrice: 1500, cost: 950, unit: 'm2' },
  { code: 'YLK-001', name: 'Yolluk - Klasik', material: 'Yün', listPrice: 180, cost: 90, unit: 'mt' },
  { code: 'YLK-002', name: 'Yolluk - Modern', material: 'Akrilik', listPrice: 120, cost: 60, unit: 'mt' },
  { code: 'KLM-001', name: 'Kilim - Antik Desen', material: 'Pamuk', listPrice: 280, cost: 150, unit: 'm2' },
]

const PRICE_LISTS = [
  { name: 'USA Wholesale', multiplier: 0.85, currency: 'USD' },
  { name: 'USA Premium', multiplier: 0.92, currency: 'USD' },
  { name: '2026 Distributor', multiplier: 0.78, currency: 'USD' },
  { name: 'Europe Standard', multiplier: 0.88, currency: 'EUR' },
  { name: 'VIP Customer', multiplier: 0.75, currency: 'USD' },
]

async function main() {
  console.log('🌱 Seeding database...\n')

  // ═══════════════════════════════════════════════════════════
  // 1. BRANCHES
  // ═══════════════════════════════════════════════════════════
  console.log('📍 Creating branches...')
  const branchRecords: Record<string, any> = {}
  for (const b of BRANCHES) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: {},
      create: { code: b.code, name: b.name, city: b.city, address: b.address },
    })
    branchRecords[b.code] = branch
    console.log(`   ✓ ${branch.code} - ${branch.name}`)
  }

  // ═══════════════════════════════════════════════════════════
  // 2. USERS
  // ═══════════════════════════════════════════════════════════
  console.log('\n👤 Creating users...')
  const passwordHash = await bcrypt.hash('Koyuncu2026!', 12)
  const userRecords: Record<string, any> = {}

  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        fullName: u.fullName,
      },
    })
    userRecords[u.email] = user
    console.log(`   ✓ ${user.fullName} (${u.role})`)

    // Attach to branches
    const branches = u.role === 'OWNER' ? Object.values(branchRecords) : [branchRecords['IST']]
    for (const branch of branches) {
      await prisma.userBranch.upsert({
        where: { userId_branchId: { userId: user.id, branchId: branch.id } },
        update: {},
        create: { userId: user.id, branchId: branch.id, role: u.role },
      })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 3. CASH REGISTERS & WAREHOUSES
  // ═══════════════════════════════════════════════════════════
  console.log('\n🏦 Creating cash registers & warehouses...')
  const warehouseRecords: Record<string, any> = {}

  for (const branch of Object.values(branchRecords)) {
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

    const whCode = `WH-${branch.code}`
    const warehouse = await prisma.warehouse.upsert({
      where: { code: whCode },
      update: {},
      create: { code: whCode, name: `${branch.name} Depo`, location: branch.city ?? '' },
    })
    warehouseRecords[branch.code] = warehouse
    console.log(`   ✓ ${branch.code} - Kasa & Depo`)
  }

  // ═══════════════════════════════════════════════════════════
  // 4. PRICE LISTS
  // ═══════════════════════════════════════════════════════════
  console.log('\n💰 Creating price lists...')
  const priceListRecords: Record<string, any> = {}

  for (const pl of PRICE_LISTS) {
    const priceList = await prisma.priceList.upsert({
      where: { name: pl.name },
      update: {},
      create: {
        name: pl.name,
        currency: pl.currency,
        isActive: true,
      },
    })
    priceListRecords[pl.name] = { ...priceList, multiplier: pl.multiplier }
    console.log(`   ✓ ${pl.name} (x${pl.multiplier})`)
  }

  // ═══════════════════════════════════════════════════════════
  // 5. CUSTOMERS (ACCOUNTS)
  // ═══════════════════════════════════════════════════════════
  console.log('\n🏢 Creating customers...')
  const customerRecords: Record<string, any> = {}

  for (let i = 0; i < CUSTOMERS.length; i++) {
    const c = CUSTOMERS[i]
    // Assign price lists to some customers
    const priceListName = i < 3 ? 'USA Wholesale' : i < 5 ? 'USA Premium' : null
    const priceListId = priceListName ? priceListRecords[priceListName]?.id : null

    const customer = await prisma.account.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        type: c.type,
        city: c.city,
        country: c.country,
        currency: c.currency,
        paymentTermDays: c.paymentTermDays,
        priceListId,
        branchId: branchRecords['IST'].id,
      },
    })
    customerRecords[c.code] = customer
    console.log(`   ✓ ${customer.code} - ${customer.name}`)
  }

  // ═══════════════════════════════════════════════════════════
  // 6. SUPPLIERS (ACCOUNTS)
  // ═══════════════════════════════════════════════════════════
  console.log('\n📦 Creating suppliers...')

  for (const s of SUPPLIERS) {
    const supplier = await prisma.account.upsert({
      where: { code: s.code },
      update: {},
      create: {
        code: s.code,
        name: s.name,
        type: s.type,
        city: s.city,
        country: s.country,
        currency: s.currency,
        branchId: branchRecords['IST'].id,
      },
    })
    console.log(`   ✓ ${supplier.code} - ${supplier.name}`)
  }

  // ═══════════════════════════════════════════════════════════
  // 7. AGENCIES (ACCOUNTS + AGENCY RECORDS)
  // ═══════════════════════════════════════════════════════════
  console.log('\n🚢 Creating agencies...')
  const agencyRecords: Record<string, any> = {}

  for (const a of AGENCIES) {
    // Create account first
    const account = await prisma.account.upsert({
      where: { code: a.code },
      update: {},
      create: {
        code: a.code,
        name: a.name,
        type: 'AGENCY',
        currency: 'USD',
        branchId: branchRecords['IST'].id,
      },
    })

    // Create agency record
    const agency = await prisma.agency.upsert({
      where: { accountId: account.id },
      update: {},
      create: {
        accountId: account.id,
        region: a.region,
        defaultCommission: a.defaultCommission,
      },
    })
    agencyRecords[a.code] = { ...agency, accountId: account.id }
    console.log(`   ✓ ${a.code} - ${a.name} (${a.region})`)
  }

  // ═══════════════════════════════════════════════════════════
  // 8. AGENCY STAFF
  // ═══════════════════════════════════════════════════════════
  console.log('\n👥 Creating agency staff...')

  for (const staff of AGENCY_STAFF) {
    const agency = agencyRecords[staff.agencyCode]
    if (!agency) continue

    await prisma.agencyStaff.create({
      data: {
        agencyId: agency.id,
        name: staff.name,
        commissionRate: staff.commissionRate,
        isActive: true,
      },
    })
    console.log(`   ✓ ${staff.name} @ ${staff.agencyCode}`)
  }

  // ═══════════════════════════════════════════════════════════
  // 9. PRODUCTS & VARIANTS
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧶 Creating products...')
  const productRecords: Record<string, any> = {}

  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        name: p.name,
        material: p.material,
        unit: p.unit,
        isActive: true,
      },
    })

    // Create default variant
    const variantSku = `${p.code}-STD`
    const variant = await prisma.productVariant.upsert({
      where: { sku: variantSku },
      update: {},
      create: {
        productId: product.id,
        sku: variantSku,
        name: p.name,
        baseCost: p.cost,
        listPrice: p.listPrice,
      },
    })

    // Add initial stock to Istanbul warehouse
    await prisma.inventoryItem.upsert({
      where: {
        warehouseId_variantId: {
          warehouseId: warehouseRecords['IST'].id,
          variantId: variant.id,
        },
      },
      update: {},
      create: {
        warehouseId: warehouseRecords['IST'].id,
        variantId: variant.id,
        quantity: Math.floor(Math.random() * 500) + 100, // 100-600 m2/adet
        reservedQty: 0,
      },
    })

    productRecords[p.code] = { product, variant }
    console.log(`   ✓ ${product.code} - ${product.name} ($${p.listPrice}/${p.unit})`)
  }

  // ═══════════════════════════════════════════════════════════
  // 10. SAMPLE ORDERS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📋 Creating sample orders...')
  const sellerUser = userRecords['ali.celik@koyuncu.com']
  const statuses = ['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED']

  // Create 15 sample orders
  for (let i = 1; i <= 15; i++) {
    const customerCode = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)].code
    const customer = customerRecords[customerCode]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const orderDate = new Date()
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 60)) // Last 60 days

    const orderNo = `ORD-${String(i).padStart(5, '0')}`

    // Check if order exists
    const existingOrder = await prisma.order.findFirst({ where: { orderNo } })
    if (existingOrder) continue

    // Pick 2-4 random products
    const numItems = Math.floor(Math.random() * 3) + 2
    const selectedProducts = PRODUCTS.sort(() => 0.5 - Math.random()).slice(0, numItems)

    let totalAmount = 0
    const items = selectedProducts.map((p) => {
      const qty = Math.floor(Math.random() * 50) + 10
      const unitPrice = p.listPrice * (0.8 + Math.random() * 0.2) // 80-100% of list price
      const lineTotal = qty * unitPrice
      totalAmount += lineTotal
      return {
        productName: p.name,
        sku: `${p.code}-STD`,
        variantId: productRecords[p.code].variant.id,
        quantity: qty,
        unit: p.unit,
        unitPrice,
        purchasePrice: p.cost,
        lineTotal,
      }
    })

    await prisma.order.create({
      data: {
        orderNo,
        accountId: customer.id,
        sellerId: sellerUser.id,
        branchId: branchRecords['IST'].id,
        status,
        currency: customer.currency || 'USD',
        totalAmount,
        createdAt: orderDate,
        items: {
          create: items,
        },
      },
    })
    console.log(`   ✓ ${orderNo} - ${customer.name} ($${totalAmount.toFixed(0)}) [${status}]`)
  }

  // ═══════════════════════════════════════════════════════════
  console.log('\n✅ Seed complete!')
  console.log(`
Summary:
  - ${BRANCHES.length} branches
  - ${USERS.length} users
  - ${CUSTOMERS.length} customers
  - ${SUPPLIERS.length} suppliers
  - ${AGENCIES.length} agencies
  - ${AGENCY_STAFF.length} agency staff
  - ${PRODUCTS.length} products
  - ${PRICE_LISTS.length} price lists
  - 15 sample orders
`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
