import type { Block, CategoryNavProps } from '@/types/schema'
import { getCategories, getTenantCredentials } from '@/lib/shopby'
import { headers } from 'next/headers'
import Link from 'next/link'

interface Props {
  block: Block<'CategoryNav'>
}

export default async function CategoryNav({ block }: Props) {
  const { depth = 1 } = block.props as CategoryNavProps

  const headersList = await headers()
  const tenantIdentifier = headersList.get('x-tenant-id') ?? ''

  let categories: Awaited<ReturnType<typeof getCategories>> = []

  try {
    const { mallId, apiKey } = await getTenantCredentials(tenantIdentifier)
    categories = await getCategories(mallId, apiKey)
  } catch (e) {
    console.error('CategoryNav fetch error:', e)
  }

  const topLevel = depth === 1
    ? categories
    : categories.flatMap((c) => c.children ?? [])

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <li>
            <Link
              href="/products"
              className="flex items-center h-12 px-4 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-600 transition-colors whitespace-nowrap"
            >
              전체
            </Link>
          </li>
          {topLevel.map((cat) => (
            <li key={cat.categoryNo}>
              <Link
                href={`/products?categoryNo=${cat.categoryNo}`}
                className="flex items-center h-12 px-4 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:border-b-2 hover:border-indigo-600 transition-colors whitespace-nowrap"
              >
                {cat.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
