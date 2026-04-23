import type { Block, HeaderProps } from '@/types/schema'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  block: Block<'Header'>
}

export default function Header({ block }: Props) {
  const { logoUrl, logoLink = '/' } = block.props as HeaderProps

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={logoLink} className="flex items-center">
          {logoUrl ? (
            <Image src={logoUrl} alt="logo" width={120} height={40} className="object-contain" />
          ) : (
            <span className="text-xl font-bold text-gray-900">ShopBy Store</span>
          )}
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            상품
          </Link>
          <Link href="/cart" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            장바구니
          </Link>
          <Link href="/mypage" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            마이페이지
          </Link>
        </nav>
      </div>
    </header>
  )
}
