// ============================================================
// Block Schema Types
// ============================================================

export type BlockType =
  | 'BannerSlider'
  | 'BannerGrid'
  | 'ProductList'
  | 'CategoryNav'
  | 'Header'
  | 'Footer'

export interface BannerSliderProps {
  images: Array<{
    url: string
    link?: string
    alt?: string
  }>
  autoplay?: boolean
  interval?: number
  height?: { pc?: number; mo?: number }
}

export interface BannerGridProps {
  images: Array<{
    url: string
    link?: string
    alt?: string
  }>
  columns?: { pc?: number; mo?: number }
}

export interface ProductListProps {
  title?: string
  dataSource: 'api'
  apiParams: {
    categoryNo?: number
    pageSize?: number
    soldout?: boolean
    sort?: 'NEW' | 'BEST' | 'SALE' | 'LOW_PRICE' | 'HIGH_PRICE'
  }
  layout?: 'grid' | 'list'
  columns?: { pc?: number; mo?: number }
}

export interface CategoryNavProps {
  showAll?: boolean
  depth?: number
}

export interface HeaderProps {
  logoUrl?: string
  logoLink?: string
}

export interface FooterProps {
  copyright?: string
  links?: Array<{ label: string; href: string }>
}

type BlockPropsMap = {
  BannerSlider: BannerSliderProps
  BannerGrid: BannerGridProps
  ProductList: ProductListProps
  CategoryNav: CategoryNavProps
  Header: HeaderProps
  Footer: FooterProps
}

export type Block<T extends BlockType = BlockType> = {
  id: string
  type: T
  order: number
  // Named placement region within the page (see policy.ts). Omitted (or
  // 'main') means the page's single default region — every page type
  // shipped so far ('home') only has one, so existing data without a
  // `slot` stays valid.
  slot?: string
  props: BlockPropsMap[T]
  style?: {
    marginTop?: number
    marginBottom?: number
  }
  mobileProps?: Partial<BlockPropsMap[T]>
}

export interface PageSchema {
  blocks: Block[]
}

/**
 * A genuine discriminated union over block type, unlike the bare `Block`
 * alias — `Block` (= `Block<BlockType>`) has `type: BlockType` and
 * `props: BlockPropsMap[BlockType]` as two independently-unioned fields
 * on a single object type, so narrowing on `.type` does not narrow
 * `.props`. Use `AnyBlock` wherever code switches/narrows on block type
 * (editor forms, per-type renderers).
 */
export type AnyBlock = { [K in BlockType]: Block<K> }[BlockType]

// ============================================================
// Versioned PageSchema envelope
//
// Storage/publish target shape going forward: `{ schemaVersion, blocks }`
// as a native JSON object (not a JSON-encoded string). The legacy
// `PageSchema` shape above stays until the backfill migration and
// dual-read window (see openspec change align-multitenant-builder-architecture)
// complete and callers switch over.
// ============================================================

export const CURRENT_PAGE_SCHEMA_VERSION = 1 as const

export interface VersionedPageSchema {
  schemaVersion: typeof CURRENT_PAGE_SCHEMA_VERSION
  blocks: Block[]
}

const BLOCK_TYPES: readonly BlockType[] = [
  'BannerSlider',
  'BannerGrid',
  'ProductList',
  'CategoryNav',
  'Header',
  'Footer',
]

export class PageSchemaValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PageSchemaValidationError'
  }
}

function isBlockType(value: unknown): value is BlockType {
  return typeof value === 'string' && (BLOCK_TYPES as readonly string[]).includes(value)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Structural check only (type discrimination + required fields). Does not
 * validate that `props` matches the specific shape for `type` — per-type
 * prop validation is covered by task 3.2 (page-type-aware schema validation).
 */
export function isBlock(value: unknown): value is Block {
  if (!isPlainObject(value)) return false
  return (
    typeof value.id === 'string' &&
    isBlockType(value.type) &&
    typeof value.order === 'number' &&
    isPlainObject(value.props)
  )
}

export function isVersionedPageSchema(value: unknown): value is VersionedPageSchema {
  if (!isPlainObject(value)) return false
  return (
    value.schemaVersion === CURRENT_PAGE_SCHEMA_VERSION &&
    Array.isArray(value.blocks) &&
    value.blocks.every(isBlock)
  )
}

export function parseVersionedPageSchema(value: unknown): VersionedPageSchema {
  if (!isVersionedPageSchema(value)) {
    throw new PageSchemaValidationError(
      'Invalid PageSchema: expected { schemaVersion: ' +
        CURRENT_PAGE_SCHEMA_VERSION +
        ', blocks: Block[] }'
    )
  }
  return value
}

// ============================================================
// ShopBy API Response Types (최소한의 타입만)
// ============================================================

export interface ShopByProduct {
  productNo: number
  productName: string
  imageUrls: string[]
  salePrice: number
  immediateDiscountAmt: number
  stockCnt: number
  liked: boolean
  salePeriodType: string
}

export interface ShopByProductListResponse {
  items: ShopByProduct[]
  totalCount: number
}

export interface ShopByCategory {
  categoryNo: number
  label: string
  depth: number
  children?: ShopByCategory[]
}
