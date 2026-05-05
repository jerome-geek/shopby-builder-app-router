import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { getTenantCredentials } from '@repo/utils'

const SHOPBY_BASE_URL = 'https://api.shopby.co.kr'

/**
 * ShopBy API Proxy
 *
 * 클라이언트 → /api/shopby/products?pageSize=8
 *           → ShopBy API (API Key 서버에서 주입)
 *
 * 호출 예시:
 *   fetch('/api/shopby/products?categoryNo=123&pageSize=8')
 *   fetch('/api/shopby/products/456/reviews')
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const headersList = await headers()

    // middleware.ts에서 주입된 테넌트 식별자
    const tenantIdentifier = headersList.get('x-tenant-id')

    if (!tenantIdentifier) {
      return NextResponse.json({ error: 'Tenant not identified' }, { status: 400 })
    }

    const { mallId, apiKey } = await getTenantCredentials(tenantIdentifier)

    // 원본 쿼리스트링 그대로 전달
    const searchParams = req.nextUrl.searchParams.toString()
    const shopbyUrl = `${SHOPBY_BASE_URL}/${path.join('/')}${searchParams ? `?${searchParams}` : ''}`

    const response = await fetch(shopbyUrl, {
      headers: {
        mallId,
        accessToken: apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`ShopBy API Error [${response.status}]:`, errorText)
      return NextResponse.json(
        { error: `ShopBy API Error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('Proxy Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const headersList = await headers()
    const tenantIdentifier = headersList.get('x-tenant-id')

    if (!tenantIdentifier) {
      return NextResponse.json({ error: 'Tenant not identified' }, { status: 400 })
    }

    const { mallId, apiKey } = await getTenantCredentials(tenantIdentifier)
    const body = await req.json()
    const shopbyUrl = `${SHOPBY_BASE_URL}/${path.join('/')}`

    const response = await fetch(shopbyUrl, {
      method: 'POST',
      headers: {
        mallId,
        accessToken: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
