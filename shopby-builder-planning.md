# ShopBy 헤드리스 웹빌더 프로젝트 기획서

> 작성일: 2026-02-25  
> 목적: ShopBy API 기반 헤드리스 쇼핑몰을 비개발자도 쉽게 구축할 수 있는 웹빌더 SaaS 개발

---

## 1. 프로젝트 개요

### 배경

ShopBy 솔루션을 이용한 헤드리스 쇼핑몰 개발은 API 연동 과정이 번거롭고 개발 지식이 없는 일반 사용자가 직접 운영하기 어렵다. 이를 해결하기 위해 ShopBy API를 기반으로 한 웹빌더를 개발한다.

### 목표

- 비개발자(일반 쇼핑몰 운영자)가 코드 없이 ShopBy 기반 쇼핑몰을 직접 구축하고 운영할 수 있도록 한다.
- 배포, 서버, 인프라 등의 개념을 사용자에게 완전히 숨긴다.
- 베타버전 빠른 검증을 최우선 목표로 한다.

### 타겟 사용자

에이전시가 아닌 **일반 쇼핑몰 운영자** (비개발자)

---

## 2. 핵심 아키텍처 결정

### 선택한 방식: 모노레포 기반 멀티테넌트 SaaS

플랫폼 서버 하나가 모든 고객의 쇼핑몰을 렌더링하되, 관리자 경험 고도화를 위해 에디터와 스토어프론트를 분리한 구조.

```
[apps/admin (Vite SPA)]  ───>  [apps/web (Next.js API)]  ───>  [Supabase (PostgreSQL)]
      (빌더 에디터)                   (API 서버 & 스토어)
```

### 아키텍처 구성

| 항목 | 구성 | 이유 |
|------|------|-----------------|
| **구조** | Turborepo 모노레포 | 코드 공유(블록, 타입) 및 독립적 배포/확장성 확보 |
| **Admin** | Vite + React SPA | 복잡한 에디터 UI의 반응성 최적화 및 가벼운 개발 환경 |
| **Storefront** | Next.js (App Router) | ShopBy API 실시간 SSR 및 SEO 대응 |
| **Database** | Supabase (PostgreSQL) | 인프라 관리 부담 제로, JSONB를 통한 유연한 스키마 저장 |

---

## 3. 기술 스택

### 프레임워크: 모노레포 (Turborepo)

| 분류 | 기술 스택 |
|------|-----------|
| **Admin (빌더)** | Vite, React, React Router, Tailwind CSS v4, dnd-kit |
| **Web (스토어)** | Next.js (App Router), Tailwind CSS |
| **공유 패키지** | Prisma (DB), UI Components, Shared Utils, Global Types |
| **데이터베이스** | Supabase (PostgreSQL) |
| **API 연동** | ShopBy Headless API |

---

## 4. 사용자 플로우

```
회원가입
  → ShopBy 몰 연결 (mallId, API키 입력)
  → 빌더에서 페이지 편집
  → 저장 / 퍼블리시 버튼 클릭
  → 내 쇼핑몰에 즉시 반영
```

사용자에게 배포, 서버, 빌드라는 개념이 보이지 않아야 한다.

---

## 5. DB 스키마

로컬 개발은 SQLite + Prisma로 시작. 추후 PostgreSQL 마이그레이션 용이.

```prisma
model Tenant {
  id           String   @id @default(cuid())
  subdomain    String   @unique           // abc.yourplatform.com
  customDomain String?  @unique           // www.abc.com (나중에 추가)
  mallId       String                     // ShopBy mallId
  apiKey       String                     // 암호화 필요 (프로덕션)
  theme        Json     @default("{}")    // 색상, 폰트 등
  createdAt    DateTime @default(now())

  pages        Page[]
}

model Page {
  id              String    @id @default(cuid())
  tenantId        String
  slug            String                  // "/", "/products" 등
  pageType        String                  // home | category | product | cart | mypage
  title           String
  draftSchema     Json      @default("{\"blocks\":[]}") // 편집 중 버전
  publishedSchema Json?                   // 라이브 버전 (null이면 미퍼블리시)
  publishedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  tenant          Tenant    @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, slug])
}
```

> `draftSchema`와 `publishedSchema`를 분리하는 것이 핵심. 편집 중 실수로 라이브에 반영되는 사고를 방지한다.

---

## 6. 페이지 스키마 구조

페이지를 JSON으로 표현하는 것이 빌더의 핵심.

### 블록 JSON 예시

```json
{
  "blocks": [
    {
      "id": "block_001",
      "type": "BannerSlider",
      "order": 0,
      "props": {
        "images": [
          { "url": "...", "link": "/products/123", "alt": "신상품 배너" }
        ],
        "autoplay": true,
        "interval": 3000
      },
      "style": {
        "marginBottom": 40
      },
      "mobileProps": {
        "height": 200
      }
    },
    {
      "id": "block_002",
      "type": "ProductList",
      "order": 1,
      "props": {
        "title": "신상품",
        "dataSource": "api",
        "apiParams": {
          "categoryNo": 123,
          "pageSize": 8,
          "soldout": false,
          "sort": "NEW"
        },
        "layout": "grid",
        "columns": { "pc": 4, "mo": 2 }
      }
    }
  ]
}
```

### MVP 블록 타입 목록 (우선순위 순)

| 블록 타입 | ShopBy API | 설명 |
|-----------|-----------|------|
| `BannerSlider` | - | 이미지 슬라이더 배너 |
| `BannerGrid` | - | 그리드 배너 |
| `ProductList` | `GET /products` | 상품 목록 (카테고리, 기획전, 신상품 등) |
| `CategoryNav` | `GET /categories` | 카테고리 메뉴 |
| `Header` | - | 공통 헤더 |
| `Footer` | - | 공통 푸터 |
| `ProductDetail` | `GET /products/{no}` | 상품 상세 (2단계) |
| `Cart` | `GET /cart`, `POST /cart` | 장바구니 (2단계) |
| `ReviewList` | `GET /products/{no}/reviews` | 상품 리뷰 (2단계) |

---

## 7. 멀티테넌트 라우팅

### 도메인 처리

```
*.yourplatform.com  →  와일드카드 DNS  →  서버
www.고객도메인.com   →  CNAME 연결     →  서버
```

서버에서 `Host` 헤더를 보고 테넌트를 식별한다.

### Next.js 미들웨어

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const host = request.headers.get('host')

  // abc.yourplatform.com → tenantId: "abc"
  // www.abc.com → DB에서 customDomain으로 테넌트 조회
  const tenantId = extractTenant(host)

  const response = NextResponse.next()
  response.headers.set('x-tenant-id', tenantId)
  return response
}
```

### 페이지 라우팅 (catch-all)

```typescript
// app/(storefront)/[...slug]/page.tsx
export default async function Page({ params }) {
  const tenantId = headers().get('x-tenant-id')
  const slug = '/' + params.slug.join('/')

  const page = await getPublishedPage(tenantId, slug)
  return <PageRenderer schema={page.publishedSchema} tenantId={tenantId} />
}
```

---

## 8. ShopBy API 연동 레이어

### 구조

```
브라우저 → 내 서버 (API Route) → ShopBy API
                ↑
         여기서 API키 주입 + 테넌트 식별 + 캐싱
```

클라이언트가 ShopBy API를 직접 호출하면 API키가 노출되므로, 반드시 서버에서 프록시한다.

### API Route 프록시

```typescript
// app/api/shopby/[...path]/route.ts
export async function GET(request: Request, { params }) {
  const tenantId = headers().get('x-tenant-id')
  const { mallId, apiKey } = await getTenantCredentials(tenantId)

  const url = new URL(request.url)
  const shopbyUrl = `https://api.shopby.co.kr/${params.path.join('/')}${url.search}`

  const response = await fetch(shopbyUrl, {
    headers: {
      'mallId': mallId,
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json()

  return Response.json(data, {
    headers: { 'Cache-Control': 's-maxage=60' }  // 캐싱
  })
}
```

### 블록별 API 매핑

```typescript
// lib/block-api-map.ts
export const BLOCK_API_MAP = {
  ProductList: (props) => ({
    endpoint: '/api/shopby/products',
    params: {
      categoryNo: props.apiParams.categoryNo,
      pageSize: props.apiParams.pageSize,
      sort: props.apiParams.sort,
    }
  }),
  ReviewList: (props) => ({
    endpoint: `/api/shopby/products/${props.productNo}/reviews`,
    params: { pageSize: props.pageSize }
  }),
  CategoryNav: () => ({
    endpoint: '/api/shopby/categories',
    params: {}
  })
}
```

---

## 9. 프로젝트 디렉토리 구조 (모노레포)

```
shopby-builder/
├── apps/
│   ├── admin/                 # 빌더 에디터 (Vite SPA)
│   │   ├── src/
│   │   │   ├── pages/         # Dashboard, Editor
│   │   │   └── main.tsx
│   │   └── vite.config.ts
│   │
│   └── web/                   # 스토어프론트 (Next.js)
│       └── src/app/
│           ├── [[...slug]]/   # 테넌트 렌더링
│           └── api/           # ShopBy Proxy & Admin API
│
├── packages/
│   ├── database/              # Prisma 스키마 & 클라이언트
│   ├── blocks/                # 공통 빌더 블록 (Banner, ProductList 등)
│   ├── ui/                    # 공통 디자인 시스템 컴포넌트
│   ├── utils/                 # ShopBy API Fetcher & 유틸
│   └── types/                 # 공통 TS 타입 정의
│
├── turbo.json                 # 빌드 파이프라인
├── pnpm-workspace.yaml        # 워크스페이스 설정
├── .env                       # DB 및 API 키 (루트 관리)
└── package.json
```

---

## 10. MVP 개발 로드맵

### 베타 MVP 화면 목록 (5개)

1. 로그인 / 회원가입
2. 대시보드 (페이지 목록)
3. 빌더 에디터
4. 미리보기
5. 설정 (도메인 / ShopBy API키)

### 개발 순서

**렌더러 먼저, 에디터 나중에** — JSON을 직접 seed로 넣어서 쇼핑몰 페이지가 뜨는 걸 먼저 확인하고 에디터를 개발한다.

| 단계 | 내용 |
|------|------|
| 1일차 | Prisma 스키마 + seed 데이터 + `lib/prisma.ts` |
| 2일차 | BlockRenderer + 블록 컴포넌트 2-3개 (BannerSlider, ProductList) |
| 3일차 | Storefront 렌더링 (`[...slug]/page.tsx`에서 스키마 읽어서 블록 렌더링) |
| 4일차~ | 에디터 UI (블록 추가 / 삭제 / 순서 변경) |

### 단계별 기능 범위

| 단계 | 기능 |
|------|------|
| **1단계 (MVP)** | ShopBy 연결 + 기본 블록 5-6개 + 서브도메인 배포 |
| **2단계** | 블록 종류 확장 + 편집 UX 개선 + 미리보기 |
| **3단계** | 커스텀 도메인 연결 + 다중 페이지 + SEO 설정 |

---

## 11. 과금 모델 (참고)

실제 서버 리소스를 테넌트별로 정확히 측정하는 것은 기술적으로 복잡하다. 대부분의 SaaS처럼 **요청 수 또는 기능 제한** 기반 플랜으로 과금한다.

```
무료:   월 1만 요청, 페이지 3개
스타터: 월 10만 요청, 페이지 10개
프로:   월 100만 요청, 페이지 무제한
```

요청 수는 미들웨어에서 `tenantId`별로 Redis 카운팅으로 측정한다.

---

## 12. 프로젝트 초기 세팅 명령어

```bash
# 프로젝트 생성
npx create-next-app@latest shopby-builder \
  --typescript --tailwind --eslint --app --src-dir

cd shopby-builder

# Prisma + SQLite
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite

# 드래그앤드롭
npm install @dnd-kit/core @dnd-kit/sortable

# UI 컴포넌트
npm install @radix-ui/react-dialog @radix-ui/react-tabs lucide-react
```

---

## 13. 주요 의사결정 로그

| 결정 사항 | 선택 | 이유 |
|-----------|------|------|
| 타겟 사용자 | 일반 사용자 (비개발자) | 에이전시보다 제품 방향이 명확 |
| 아키텍처 | 멀티테넌트 런타임 SaaS | 비개발자 배포 허들 제거, ShopBy API 실시간 호출 필요 |
| 프레임워크 | Next.js 단일 구조 | MVP 빠른 검증, 혼자 관리 용이 |
| DB (로컬) | SQLite + Prisma | 빠른 시작, 추후 PostgreSQL 마이그레이션 용이 |
| 블록 구조 | Page JSON 내 포함 | 별도 Block 테이블 불필요, MVP 복잡도 감소 |
| 배포 방식 | 서브도메인 + 와일드카드 DNS | 사용자가 배포 개념 몰라도 됨 |
| 단일장애점/스케일 | MVP 단계에서 고려 안 함 | 고객 10명 수준에서 이중화는 오버엔지니어링 |
