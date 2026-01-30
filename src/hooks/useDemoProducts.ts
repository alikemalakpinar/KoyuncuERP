/**
 * Demo product data for Vite dev mode (no Electron IPC).
 */

export interface DemoVariant {
  id: string
  sku: string
  size: string
  width: number
  length: number
  areaM2: number
  color?: string
  barcode?: string
  listPrice: string
  baseCost: string
  stocks: { warehouse: { code: string; name: string }; quantity: number; reservedQuantity: number }[]
}

export interface DemoProduct {
  id: string
  code: string
  name: string
  collection: string
  material: string
  description: string
  images: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  variants: DemoVariant[]
}

const makeVariant = (
  id: string, sku: string, size: string, w: number, l: number,
  color: string, listPrice: string, baseCost: string,
  trQty: number, usaQty: number,
): DemoVariant => ({
  id,
  sku,
  size,
  width: w,
  length: l,
  areaM2: (w * l) / 10000,
  color,
  listPrice,
  baseCost,
  stocks: [
    { warehouse: { code: 'TR_MAIN', name: 'Türkiye Ana Depo' }, quantity: trQty, reservedQuantity: 0 },
    { warehouse: { code: 'USA_NJ', name: 'USA New Jersey' }, quantity: usaQty, reservedQuantity: 0 },
  ],
})

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'prod-1',
    code: 'ANT-RD',
    name: 'Anatolia Red',
    collection: 'Anatolia 2025',
    material: 'WOOL',
    description: 'Geleneksel Anadolu deseni, el ipeği karışımı yün halı. Kırmızı tonları.',
    images: [],
    isActive: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-11-20T14:30:00Z',
    variants: [
      makeVariant('v-1a', 'ANT-RD-80x150', '80x150', 80, 150, 'Red', '89.00', '42.00', 120, 45),
      makeVariant('v-1b', 'ANT-RD-120x180', '120x180', 120, 180, 'Red', '149.00', '68.00', 85, 32),
      makeVariant('v-1c', 'ANT-RD-200x300', '200x300', 200, 300, 'Red', '349.00', '155.00', 40, 18),
      makeVariant('v-1d', 'ANT-RD-250x350', '250x350', 250, 350, 'Red', '549.00', '240.00', 22, 8),
    ],
  },
  {
    id: 'prod-2',
    code: 'CAP-BL',
    name: 'Cappadocia Blue',
    collection: 'Anatolia 2025',
    material: 'WOOL',
    description: 'Kapadokya ilhamlı mavi tonlarda modern yün halı.',
    images: [],
    isActive: true,
    createdAt: '2025-02-10T09:00:00Z',
    updatedAt: '2025-11-18T11:00:00Z',
    variants: [
      makeVariant('v-2a', 'CAP-BL-80x150', '80x150', 80, 150, 'Blue', '95.00', '45.00', 95, 38),
      makeVariant('v-2b', 'CAP-BL-160x230', '160x230', 160, 230, 'Blue', '245.00', '110.00', 55, 22),
      makeVariant('v-2c', 'CAP-BL-200x300', '200x300', 200, 300, 'Blue', '369.00', '165.00', 35, 14),
    ],
  },
  {
    id: 'prod-3',
    code: 'EGE-GR',
    name: 'Aegean Grey',
    collection: 'Modern Line',
    material: 'ACRYLIC',
    description: 'Minimalist gri tonlarda akrilik halı. Kolay bakım.',
    images: [],
    isActive: true,
    createdAt: '2025-03-01T08:00:00Z',
    updatedAt: '2025-11-22T16:00:00Z',
    variants: [
      makeVariant('v-3a', 'EGE-GR-80x150', '80x150', 80, 150, 'Grey', '65.00', '28.00', 200, 80),
      makeVariant('v-3b', 'EGE-GR-120x180', '120x180', 120, 180, 'Grey', '109.00', '48.00', 150, 55),
      makeVariant('v-3c', 'EGE-GR-200x300', '200x300', 200, 300, 'Grey', '259.00', '112.00', 70, 30),
      makeVariant('v-3d', 'EGE-GR-300x400', '300x400', 300, 400, 'Grey', '489.00', '210.00', 15, 5),
    ],
  },
  {
    id: 'prod-4',
    code: 'IST-GD',
    name: 'Istanbul Gold',
    collection: 'Premium Heritage',
    material: 'SILK',
    description: 'Premium ipek karışımlı altın tonlarında lüks halı.',
    images: [],
    isActive: true,
    createdAt: '2025-04-15T12:00:00Z',
    updatedAt: '2025-11-25T10:00:00Z',
    variants: [
      makeVariant('v-4a', 'IST-GD-120x180', '120x180', 120, 180, 'Gold', '289.00', '135.00', 30, 12),
      makeVariant('v-4b', 'IST-GD-200x300', '200x300', 200, 300, 'Gold', '689.00', '310.00', 18, 6),
    ],
  },
  {
    id: 'prod-5',
    code: 'BOD-WH',
    name: 'Bodrum White',
    collection: 'Coastal',
    material: 'COTTON',
    description: 'Pamuk bazlı, kıyı temalı beyaz/krem kilim.',
    images: [],
    isActive: true,
    createdAt: '2025-05-20T09:30:00Z',
    updatedAt: '2025-11-21T13:00:00Z',
    variants: [
      makeVariant('v-5a', 'BOD-WH-80x150', '80x150', 80, 150, 'White', '55.00', '22.00', 180, 70),
      makeVariant('v-5b', 'BOD-WH-160x230', '160x230', 160, 230, 'White', '139.00', '58.00', 100, 40),
      makeVariant('v-5c', 'BOD-WH-200x300', '200x300', 200, 300, 'White', '219.00', '92.00', 60, 25),
    ],
  },
  {
    id: 'prod-6',
    code: 'KON-MX',
    name: 'Konya Multi',
    collection: 'Anatolia 2025',
    material: 'BLEND',
    description: 'Çok renkli geleneksel Konya motifli karışım halı.',
    images: [],
    isActive: true,
    createdAt: '2025-06-10T11:00:00Z',
    updatedAt: '2025-11-19T09:00:00Z',
    variants: [
      makeVariant('v-6a', 'KON-MX-120x180', '120x180', 120, 180, 'Multi', '175.00', '78.00', 65, 28),
      makeVariant('v-6b', 'KON-MX-200x300', '200x300', 200, 300, 'Multi', '395.00', '175.00', 28, 10),
      makeVariant('v-6c', 'KON-MX-250x350', '250x350', 250, 350, 'Multi', '595.00', '260.00', 12, 4),
    ],
  },
]

export const DEMO_WAREHOUSES = [
  { id: 'wh-1', code: 'TR_MAIN', name: 'Türkiye Ana Depo', country: 'TR', city: 'Gaziantep' },
  { id: 'wh-2', code: 'USA_NJ', name: 'USA New Jersey', country: 'US', city: 'Newark' },
  { id: 'wh-3', code: 'VIRTUAL_TRANSIT', name: 'Transit (Yolda)', country: '-', city: null },
]
