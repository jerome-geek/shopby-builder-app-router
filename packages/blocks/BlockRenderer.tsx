import type { Block, BlockType } from '@repo/types'
import dynamic from 'next/dynamic'

// Each block module's default export is typed against its own specific
// `Block<'X'>`, not the general `Block` union — a `Record<BlockType, ...>`
// keyed map is necessarily heterogeneous in its value types, which
// TypeScript can't express without this alias. The cast is safe by
// construction: each entry below is only ever looked up and invoked
// through its own matching key (see the `.map` below).
type AnyBlockComponent = React.ComponentType<{ block: Block }>

// 각 블록을 dynamic import로 코드 스플리팅
// → 쇼핑몰 방문자는 실제 사용된 블록 JS만 로드
const BLOCK_MAP: Record<BlockType, AnyBlockComponent> = {
  BannerSlider: dynamic(() => import('./BannerSlider')) as AnyBlockComponent,
  BannerGrid: dynamic(() => import('./BannerGrid')) as AnyBlockComponent,
  ProductList: dynamic(() => import('./ProductList')) as AnyBlockComponent,
  CategoryNav: dynamic(() => import('./CategoryNav')) as AnyBlockComponent,
  Header: dynamic(() => import('./Header')) as AnyBlockComponent,
  Footer: dynamic(() => import('./Footer')) as AnyBlockComponent,
}

interface BlockRendererProps {
  blocks: Block[]
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
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
