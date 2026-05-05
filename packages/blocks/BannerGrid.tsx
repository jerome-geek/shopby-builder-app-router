import type { Block, BannerGridProps } from '@repo/types'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  block: Block<'BannerGrid'>
}

export default function BannerGrid({ block }: Props) {
  const { images = [], columns = { pc: 3, mo: 2 } } = block.props as BannerGridProps

  const colClass = `grid-cols-${columns.mo ?? 2} md:grid-cols-${columns.pc ?? 3}`

  if (images.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gray-100 rounded-xl h-40 flex items-center justify-center text-gray-400">
          배너 이미지를 추가해 주세요
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className={`grid ${colClass} gap-3`}>
        {images.map((img, i) => {
          const inner = (
            <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-100 hover:opacity-90 transition-opacity">
              <Image
                src={img.url}
                alt={img.alt ?? `배너 ${i + 1}`}
                fill
                className="object-cover"
              />
            </div>
          )

          return img.link ? (
            <Link key={i} href={img.link}>{inner}</Link>
          ) : (
            <div key={i}>{inner}</div>
          )
        })}
      </div>
    </div>
  )
}
