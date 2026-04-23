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
