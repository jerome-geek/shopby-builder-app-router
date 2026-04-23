import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: [
    /*
     * 아래 경로 제외하고 모든 요청에 실행:
     * - _next/static (빌드 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico, sitemap.xml 등 정적 파일
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}

export default function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const hostname = req.headers.get('host') ?? 'localhost:3000'

  // 개발환경: .localhost:3000 기준으로 서브도메인 추출
  // 프로덕션: 환경변수 ROOT_DOMAIN (예: shopbybuilder.com) 기준으로 추출
  const rootDomain = process.env.ROOT_DOMAIN ?? 'localhost:3000'

  // ① app.localhost:3000 or localhost:3000 → (builder) 어드민
  const isAppDomain =
    hostname === `app.${rootDomain}` ||
    hostname === rootDomain ||
    hostname === `localhost:3000`

  if (isAppDomain) {
    // 어드민 도메인은 그냥 통과 — Route Group (builder)가 처리
    return NextResponse.next()
  }

  // ② 나머지 → (storefront) 테넌트 쇼핑몰
  // 서브도메인 추출: my-shop.localhost:3000 → "my-shop"
  // 커스텀 도메인: www.client.com → "www.client.com" (DB 조회용)
  const isSubdomain = hostname.endsWith(`.${rootDomain}`)
  const tenantIdentifier = isSubdomain
    ? hostname.replace(`.${rootDomain}`, '')
    : hostname // 커스텀 도메인 전체를 DB에서 조회

  const res = NextResponse.next()

  // API Route의 프록시 핸들러에서 테넌트 식별용으로 사용
  res.headers.set('x-tenant-id', tenantIdentifier)
  // 서버 컴포넌트에서 headers()로 꺼내 쓸 수 있도록
  res.headers.set('x-hostname', hostname)
  res.headers.set('x-pathname', url.pathname)

  return res
}
