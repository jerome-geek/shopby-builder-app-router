import type { Block, FooterProps } from '@repo/types'
import Link from 'next/link'

interface Props {
  block: Block<'Footer'>
}

export default function Footer({ block }: Props) {
  const { copyright = '© 2025 ShopBy Store. All rights reserved.', links = [] } =
    block.props as FooterProps

  return (
    <footer className="bg-gray-900 text-gray-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {links.length > 0 && (
          <nav className="flex flex-wrap gap-6 mb-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        <p className="text-xs">{copyright}</p>
      </div>
    </footer>
  )
}
