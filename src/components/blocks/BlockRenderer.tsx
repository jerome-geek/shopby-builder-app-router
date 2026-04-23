import type { Block, BlockType } from '@/types/schema'
import dynamic from 'next/dynamic'

// 각 블록을 dynamic import로 코드 스플리팅
// → 쇼핑몰 방문자는 실제 사용된 블록 JS만 로드
const BLOCK_MAP: Record<BlockType, React.ComponentType<{ block: Block }>> = {
  BannerSlider: dynamic(() => import('./BannerSlider')),
  BannerGrid: dynamic(() => import('./BannerGrid')),
  ProductList: dynamic(() => import('./ProductList')),
  CategoryNav: dynamic(() => import('./CategoryNav')),
  Header: dynamic(() => import('./Header')),
  Footer: dynamic(() => import('./Footer')),
}

interface BlockRendererProps {
  blocks: Block[]
}

export default function BlockRenderer({ blocks }: BlockRendererProps) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order)

  return (
    <>
      {sorted.map((block) => {
        const Component = BLOCK_MAP[block.type]

        if (!Component) {
          // 개발 중 알 수 없는 블록 타입 표시
          if (process.env.NODE_ENV === 'development') {
            return (
              <div
                key={block.id}
                className="bg-yellow-100 border border-yellow-400 p-4 text-yellow-800 text-sm"
              >
                ⚠️ Unknown block type: <code>{block.type}</code>
              </div>
            )
          }
          return null
        }

        return (
          <div
            key={block.id}
            style={{
              marginTop: block.style?.marginTop,
              marginBottom: block.style?.marginBottom,
            }}
          >
            <Component block={block} />
          </div>
        )
      })}
    </>
  )
}
