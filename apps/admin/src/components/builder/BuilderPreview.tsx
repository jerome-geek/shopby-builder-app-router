'use client'

// Imported by file path, not the `@repo/blocks` barrel: the barrel also
// re-exports ProductList/CategoryNav (server-only, `next/headers`), and
// bundlers trace the whole barrel module graph for a client boundary
// even when only these named bindings are used — pulling in the
// server-only files would break the client build.
import BannerGridBlock from '@repo/blocks/BannerGrid'
import BannerSliderBlock from '@repo/blocks/BannerSlider'
import FooterBlock from '@repo/blocks/Footer'
import HeaderBlock from '@repo/blocks/Header'
import type { AnyBlock } from '@repo/types'
import { BLOCK_LABELS } from './block-defaults'

interface BuilderPreviewProps {
  blocks: AnyBlock[]
}

/**
 * Renders the *same* `@repo/blocks` implementations Storefront uses, for
 * every block type that doesn't require request-scoped server context
 * (`next/headers`) or a live ShopBy/DB call. `ProductList` and
 * `CategoryNav` need those, which only exist inside a real Server
 * Component render — a Client Component canvas can't import them (Next
 * refuses to bundle `next/headers` for the client). Showing their real
 * output here needs either a saved draft + server-rendered preview
 * route (depends on task 8.5) or a dedicated preview round-trip; until
 * then this shows a labeled placeholder for those two types instead of
 * silently rendering nothing.
 */
export function BuilderPreview({ blocks }: BuilderPreviewProps) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order)

  return (
    <>
      {sorted.map((block) => {
        switch (block.type) {
          case 'BannerSlider':
            return <BannerSliderBlock key={block.id} block={block} />
          case 'BannerGrid':
            return <BannerGridBlock key={block.id} block={block} />
          case 'Header':
            return <HeaderBlock key={block.id} block={block} />
          case 'Footer':
            return <FooterBlock key={block.id} block={block} />
          case 'ProductList':
          case 'CategoryNav':
            return (
              <div
                key={block.id}
                className="bg-gray-50 border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400"
              >
                &apos;{BLOCK_LABELS[block.type]}&apos;은 실제 데이터로 게시 후 스토어프론트에서 확인할 수 있습니다.
              </div>
            )
        }
      })}
    </>
  )
}
