/**
 * ShopBy API 서버사이드 호출 레이어
 *
 * 클라이언트에서 직접 호출하면 API Key가 노출되므로
 * 반드시 서버 컴포넌트 또는 API Route에서만 사용할 것.
 */

const SHOPBY_BASE_URL = 'https://api.shopby.co.kr'

interface ShopByRequestOptions {
  mallId: string
  apiKey: string
  path: string
  params?: Record<string, string | number | boolean>
  cache?: RequestCache
  revalidate?: number
}

async function shopbyFetch<T>({
  mallId,
  apiKey,
  path,
  params,
  cache = 'force-cache',
  revalidate = 60,
}: ShopByRequestOptions): Promise<T> {
  const url = new URL(`${SHOPBY_BASE_URL}/${path}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })
  }

  const res = await fetch(url.toString(), {
    headers: {
      mallId,
      accessToken: apiKey,
      'Content-Type': 'application/json',
    },
    cache,
    next: { revalidate },
  })

  if (!res.ok) {
    throw new Error(`ShopBy API Error: ${res.status} ${path}`)
  }

  return res.json() as Promise<T>
}

// ============================================================
// Products
// ============================================================

export interface ShopByProduct {
  productNo: number
  productName: string
  imageUrls: string[]
  salePrice: number
  immediateDiscountAmt: number
  stockCnt: number
  liked: boolean
}

export interface ProductListParams {
  categoryNo?: number
  pageSize?: number
  pageNumber?: number
  soldout?: boolean
  sort?: 'NEW' | 'BEST' | 'SALE' | 'LOW_PRICE' | 'HIGH_PRICE'
}

export interface ProductListResult {
  items: ShopByProduct[]
  totalCount: number
}

export async function getProducts(
  mallId: string,
  apiKey: string,
  params: ProductListParams = {}
): Promise<ProductListResult> {
  return shopbyFetch<ProductListResult>({
    mallId,
    apiKey,
    path: 'products',
    params: {
      pageSize: 8,
      pageNumber: 1,
      soldout: false,
      sort: 'NEW',
      ...params,
    } as Record<string, string | number | boolean>,
    revalidate: 60,
  })
}

// ============================================================
// Categories
// ============================================================

export interface ShopByCategory {
  categoryNo: number
  label: string
  depth: number
  children?: ShopByCategory[]
}

export async function getCategories(
  mallId: string,
  apiKey: string
): Promise<ShopByCategory[]> {
  const data = await shopbyFetch<{ categories: ShopByCategory[] }>({
    mallId,
    apiKey,
    path: 'categories',
    revalidate: 3600, // 카테고리는 자주 안 바뀜
  })
  return data.categories
}

// ============================================================
// 테넌트 자격증명 조회 유틸 (DB → API 호출 연결용)
// ============================================================

import { prisma } from '@repo/database'

export async function getTenantCredentials(tenantIdOrSubdomain: string) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { subdomain: tenantIdOrSubdomain },
        { customDomain: tenantIdOrSubdomain },
      ],
    },
    select: { mallId: true, apiKey: true },
  })

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantIdOrSubdomain}`)
  }

  return tenant
}
