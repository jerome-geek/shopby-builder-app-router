/**
 * ShopBy Shop API 서버사이드 호출 레이어
 *
 * https://docs.shopby.co.kr/?url.primaryName=product/#/Product/get-products-product
 * 인증은 clientId(공개 식별자) 헤더 하나로 이뤄짐 — mallId라는 필드는 실제 API에 없음.
 * accessToken/Shop-By-Authorization은 "구매자" 로그인 토큰이라 관리자 쪽 시크릿과 무관하고,
 * 아직 buyer 세션을 안 다루므로 보내지 않음. Server API(주문 처리 등) 붙일 때 별도 인증 필요.
 */

const SHOPBY_BASE_URL = 'https://shop-api.shopby.co.kr'

interface ShopByRequestOptions {
  clientId: string
  path: string
  params?: Record<string, string | number | boolean>
  cache?: RequestCache
  revalidate?: number
}

async function shopbyFetch<T>({
  clientId,
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
      clientId,
      Version: '1.0',
      platform: 'PC',
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
  clientId: string,
  params: ProductListParams = {}
): Promise<ProductListResult> {
  return shopbyFetch<ProductListResult>({
    clientId,
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

export async function getCategories(clientId: string): Promise<ShopByCategory[]> {
  const data = await shopbyFetch<{ categories: ShopByCategory[] }>({
    clientId,
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
    select: { clientId: true, apiKey: true },
  })

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantIdOrSubdomain}`)
  }

  return tenant
}
