import type {
  BannerGridProps,
  BannerSliderProps,
  Block,
  BlockType,
  CategoryNavProps,
  FooterProps,
  HeaderProps,
  ProductListProps,
} from '@repo/types'

export const BLOCK_LABELS: Record<BlockType, string> = {
  BannerSlider: '배너 슬라이더',
  BannerGrid: '배너 그리드',
  ProductList: '상품 목록',
  CategoryNav: '카테고리 내비게이션',
  Header: '헤더',
  Footer: '푸터',
}

export function createDefaultBlock(type: BlockType, order: number, slot: string): Block {
  const id = crypto.randomUUID()

  switch (type) {
    case 'BannerSlider':
      return {
        id,
        type,
        order,
        slot,
        props: { images: [], autoplay: true, interval: 4000 } satisfies BannerSliderProps,
      }
    case 'BannerGrid':
      return {
        id,
        type,
        order,
        slot,
        props: { images: [], columns: { pc: 3, mo: 1 } } satisfies BannerGridProps,
      }
    case 'ProductList':
      return {
        id,
        type,
        order,
        slot,
        props: {
          title: '신상품',
          dataSource: 'api',
          apiParams: { pageSize: 8, sort: 'NEW' },
          layout: 'grid',
          columns: { pc: 4, mo: 2 },
        } satisfies ProductListProps,
      }
    case 'CategoryNav':
      return {
        id,
        type,
        order,
        slot,
        props: { showAll: true, depth: 1 } satisfies CategoryNavProps,
      }
    case 'Header':
      return {
        id,
        type,
        order,
        slot,
        props: {} satisfies HeaderProps,
      }
    case 'Footer':
      return {
        id,
        type,
        order,
        slot,
        props: { links: [] } satisfies FooterProps,
      }
  }
}

export function duplicateBlock(block: Block, order: number): Block {
  return {
    ...block,
    id: crypto.randomUUID(),
    order,
  }
}
