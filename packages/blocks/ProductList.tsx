import type { Block, ProductListProps } from '@repo/types'
import { getProducts } from '@repo/utils'
import { headers } from 'next/headers'
import { getTenantCredentials } from '@repo/utils'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  block: Block<'ProductList'>
}

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR') + '원'
}

// Server Component — ShopBy API 직접 호출 (API Key 안전)
export default async function ProductList({ block }: Props) {
  const { title, apiParams, columns = { pc: 4, mo: 2 } } =
    block.props as ProductListProps

  const headersList = await headers()
  const tenantIdentifier = headersList.get('x-tenant-id') ?? ''

  let products: Awaited<ReturnType<typeof getProducts>>['items'] = []

  try {
    const { clientId } = await getTenantCredentials(tenantIdentifier)
    const result = await getProducts(clientId, apiParams)
    products = result.items
  } catch (e) {
    console.error('ProductList fetch error:', e)
  }

  const colClass = `grid-cols-${columns.mo ?? 2} md:grid-cols-${columns.pc ?? 4}`

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      )}

      {products.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
          표시할 상품이 없습니다.
        </div>
      ) : (
        <div className={`grid ${colClass} gap-4`}>
          {products.map((product) => {
            const discounted =
              product.salePrice - product.immediateDiscountAmt
            const hasDiscount = product.immediateDiscountAmt > 0

            return (
              <Link
                key={product.productNo}
                href={`/products/${product.productNo}`}
                className="group"
              >
                <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-100 mb-3">
                  {product.imageUrls?.[0] && (
                    <Image
                      src={product.imageUrls[0]}
                      alt={product.productName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 mb-1">
                  {product.productName}
                </p>
                <div className="flex items-center gap-2">
                  {hasDiscount && (
                    <span className="text-xs text-red-500 font-bold">
                      {Math.round(
                        (product.immediateDiscountAmt / product.salePrice) * 100
                      )}
                      %
                    </span>
                  )}
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(discounted)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(product.salePrice)}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
