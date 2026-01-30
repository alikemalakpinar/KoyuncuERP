/**
 * Analytics hooks – Dashboard ve rapor sayfalarında kullanılır.
 * Gerçek uygulamada TanStack Query ile API'den çekilir.
 * Şu an demo data ile çalışır.
 */

import { useMemo } from 'react'

// Demo: Son 12 aylık gelir verisi
function generateMonthlyRevenue() {
  const months = [
    'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
  ]
  return months.map((month) => ({
    month,
    revenue: Math.round(180000 + Math.random() * 120000),
    collection: Math.round(150000 + Math.random() * 100000),
  }))
}

export function useDashboardKpis() {
  return useMemo(
    () => ({
      monthlyRevenue: '$284,520',
      revenueChange: '+12.5%',
      collectionRate: '87.3%',
      collectionChange: '+3.2%',
      pendingShipments: 14,
      urgentShipments: 3,
      overdueReceivables: '$42,180',
      overdueChange: '-8.1%',
    }),
    [],
  )
}

export function useRevenueChart() {
  return useMemo(() => generateMonthlyRevenue(), [])
}

// Demo: Acente performans verileri
export function useAgencyPerformance() {
  return useMemo(
    () => [
      {
        id: '1',
        name: 'ABC Trading LLC',
        region: 'Doğu ABD',
        totalSales: '892,450',
        commission: '44,622',
        commissionRate: '5.0',
        pendingCommission: '12,340',
        orderCount: 28,
      },
      {
        id: '2',
        name: 'West Coast Carpets',
        region: 'Batı ABD',
        totalSales: '654,200',
        commission: '29,439',
        commissionRate: '4.5',
        pendingCommission: '8,120',
        orderCount: 19,
      },
      {
        id: '3',
        name: 'Southern Flooring Co.',
        region: 'Güney ABD',
        totalSales: '421,800',
        commission: '21,090',
        commissionRate: '5.0',
        pendingCommission: '5,670',
        orderCount: 14,
      },
      {
        id: '4',
        name: 'Midwest Distributors',
        region: 'Orta ABD',
        totalSales: '318,600',
        commission: '12,744',
        commissionRate: '4.0',
        pendingCommission: '3,450',
        orderCount: 11,
      },
    ],
    [],
  )
}

// Demo: Sipariş kâr analizi
export function useProfitAnalysis() {
  return useMemo(
    () => [
      {
        orderId: '1',
        orderNo: 'ORD-2026-0147',
        customer: 'HomeStyle Inc.',
        sellingPrice: '48,500',
        purchaseCost: '28,200',
        freight: '3,400',
        customs: '1,920',
        warehouse: '450',
        insurance: '380',
        agencyFee: '2,425',
        totalCost: '36,775',
        netProfit: '11,725',
        netMargin: '24.2',
        status: 'DELIVERED',
      },
      {
        orderId: '2',
        orderNo: 'ORD-2026-0148',
        customer: 'Luxury Floors NY',
        sellingPrice: '72,300',
        purchaseCost: '41,800',
        freight: '4,200',
        customs: '2,880',
        warehouse: '620',
        insurance: '540',
        agencyFee: '3,615',
        totalCost: '53,655',
        netProfit: '18,645',
        netMargin: '25.8',
        status: 'DELIVERED',
      },
      {
        orderId: '3',
        orderNo: 'ORD-2026-0149',
        customer: 'Pacific Rugs',
        sellingPrice: '35,200',
        purchaseCost: '21,600',
        freight: '2,800',
        customs: '1,400',
        warehouse: '380',
        insurance: '290',
        agencyFee: '1,584',
        totalCost: '28,054',
        netProfit: '7,146',
        netMargin: '20.3',
        status: 'SHIPPED',
      },
      {
        orderId: '4',
        orderNo: 'ORD-2026-0150',
        customer: 'Desert Home Decor',
        sellingPrice: '28,900',
        purchaseCost: '17,400',
        freight: '2,100',
        customs: '1,150',
        warehouse: '310',
        insurance: '230',
        agencyFee: '1,156',
        totalCost: '22,346',
        netProfit: '6,554',
        netMargin: '22.7',
        status: 'IN_PRODUCTION',
      },
      {
        orderId: '5',
        orderNo: 'ORD-2026-0151',
        customer: 'Chicago Interiors',
        sellingPrice: '56,100',
        purchaseCost: '33,800',
        freight: '3,800',
        customs: '2,240',
        warehouse: '520',
        insurance: '440',
        agencyFee: '2,244',
        totalCost: '43,044',
        netProfit: '13,056',
        netMargin: '23.3',
        status: 'CONFIRMED',
      },
    ],
    [],
  )
}

// Demo: Hesap finansal sağlık
export function useAccountHealth(accountId?: string) {
  return useMemo(
    () => ({
      accountId: accountId || '1',
      totalRevenue12m: '284,520',
      avgPaymentDays: 34,
      overdueAmount: '12,450',
      riskScore: 78,
      monthlyRevenue: generateMonthlyRevenue().map((m) => ({
        month: m.month,
        amount: String(m.revenue),
      })),
    }),
    [accountId],
  )
}

// Demo: Cari listesi
export function useAccounts() {
  return useMemo(
    () => [
      {
        id: '1',
        code: 'C-001',
        name: 'HomeStyle Inc.',
        type: 'CUSTOMER' as const,
        city: 'New York',
        country: 'US',
        balance: '48,250',
        riskLimit: '100,000',
        paymentTermDays: 30,
        lastOrderDate: '2026-01-15',
        isActive: true,
      },
      {
        id: '2',
        code: 'C-002',
        name: 'Luxury Floors NY',
        type: 'CUSTOMER' as const,
        city: 'Los Angeles',
        country: 'US',
        balance: '72,100',
        riskLimit: '150,000',
        paymentTermDays: 45,
        lastOrderDate: '2026-01-22',
        isActive: true,
      },
      {
        id: '3',
        code: 'C-003',
        name: 'Pacific Rugs',
        type: 'CUSTOMER' as const,
        city: 'San Francisco',
        country: 'US',
        balance: '35,400',
        riskLimit: '80,000',
        paymentTermDays: 30,
        lastOrderDate: '2026-01-10',
        isActive: true,
      },
      {
        id: '4',
        code: 'A-001',
        name: 'ABC Trading LLC',
        type: 'AGENCY' as const,
        city: 'Miami',
        country: 'US',
        balance: '12,340',
        riskLimit: '0',
        paymentTermDays: 0,
        lastOrderDate: '2026-01-20',
        isActive: true,
      },
      {
        id: '5',
        code: 'S-001',
        name: 'Anadolu Dokuma A.Ş.',
        type: 'SUPPLIER' as const,
        city: 'Gaziantep',
        country: 'TR',
        balance: '-28,600',
        riskLimit: '0',
        paymentTermDays: 60,
        lastOrderDate: '2026-01-18',
        isActive: true,
      },
    ],
    [],
  )
}
