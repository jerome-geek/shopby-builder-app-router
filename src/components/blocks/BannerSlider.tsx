'use client'

import type { BannerSliderProps, Block } from '@/types/schema'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  block: Block<'BannerSlider'>
}

export default function BannerSlider({ block }: Props) {
  const {
    images = [],
    autoplay = true,
    interval = 3000,
    height = { pc: 480, mo: 240 },
  } = block.props as BannerSliderProps

  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!autoplay || images.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, interval)
    return () => clearInterval(timer)
  }, [autoplay, interval, images.length])

  if (images.length === 0) {
    return (
      <div
        className="w-full bg-gray-100 flex items-center justify-center text-gray-400"
        style={{ height: height.pc }}
      >
        배너 이미지를 추가해 주세요
      </div>
    )
  }

  const currentImage = images[current]

  const content = (
    <div className="relative w-full overflow-hidden" style={{ height: height.pc }}>
      {images.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={img.url}
            alt={img.alt ?? `배너 ${i + 1}`}
            fill
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {/* 인디케이터 */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )

  return currentImage.link ? (
    <Link href={currentImage.link}>{content}</Link>
  ) : (
    content
  )
}
