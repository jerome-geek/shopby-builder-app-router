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

### 선택한 방식: 멀티테넌트 런타임 SaaS (방법 3)

플랫폼 서버 하나가 모든 고객의 쇼핑몰을 렌더링하는 구조.

```
사용자 요청 (shop.고객A.com)
    ↓
도메인으로 테넌트 식별
    ↓
해당 테넌트의 publishedSchema 조회
    ↓
블록 렌더링 + ShopBy API 호출
    ↓
페이지 응답
```

### 다른 방식과 비교

| 방식 | 설명 | 왜 선택하지 않았나 |
|------|------|-----------------|
| 방법 1 (SaaS 완전 호스팅) | Webflow, Imweb처럼 플랫폼이 모든 것 책임 | 방법 3과 유사하나 구분 불명확 |
| 방법 2 (정적 사이트 SSG) | HTML을 빌드해서 CDN에 업로드 | 상품 10만 개면 빌드 수 시간, 신상품마다 재빌드 필요. SEO 페이지 처리 불가 |
| **방법 3 (멀티테넌트 런타임)** | **서버 하나에서 스키마 기반 렌더링** | **✅ 선택** |

### 방법 2를 선택하지 않은 이유 (SSG의 한계)

ShopBy에 상품이 10만 개 있을 경우, 빌드 시 10만 개 페이지를 미리 생성해야 하므로 빌드 시간이 수 시간에 달한다. 신상품 추가 시마다 전체 재빌드가 필요하고, 상품 상세 같은 SEO가 중요한 페이지를 실시간으로 렌더링할 서버가 없어 처리가 불가능하다.

---

## 3. 기술 스택

### 프레임워크: Next.js 단일 구조

**Next.js를 선택한 핵심 이유**: ShopBy API를 실시간으로 호출해야 하는 storefront SSR과 API Route 통합 때문. (빌더 에디터 자체의 SEO 때문이 아님)

#### 분리 구조 vs Next.js 단일 구조 비교

| 항목 | 분리 구조 (Vite SPA + Next.js) | Next.js 단일 구조 |
|------|-------------------------------|-----------------|
| 빌더 에디터 | Vite + React SPA | Next.js |
| Storefront | 별도 Next.js 서버 | Next.js (같은 서버) |
| 초기 개발 속도 | 느림 (설정 2배) | 빠름 |
| 유지보수 | 복잡 (배포 2개) | 단순 |
| 확장성 | 좋음 (독립 스케일) | 보통 |
| 에디터 성능 | 좋음 (SPA 최적화) | 보통 |
| **혼자 개발 적합** | ❌ | ✅ |

> 에디터가 복잡해져서 SPA 최적화가 필요하거나, 팀이 나뉘는 시점에 분리를 고려한다.

### 전체 스택

```
프론트엔드:  Next.js (App Router) + TypeScript + Tailwind CSS
에디터 UI:   dnd-kit (드래그앤드롭), Radix UI (컴포넌트)
DB:          SQLite (로컬) → PostgreSQL (프로덕션)
ORM:         Prisma
배포:        Vercel 또는 단일 서버 + 와일드카드 DNS
```

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

## 9. 프로젝트 디렉토리 구조

```
shopby-builder/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                        # 로컬 테스트용 더미 데이터
│
├── src/
│   ├── app/
│   │   ├── (builder)/                 # 빌더 에디터 영역
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           # 페이지 목록
│   │   │   └── editor/
│   │   │       └── [pageId]/
│   │   │           └── page.tsx       # 빌더 에디터
│   │   │
│   │   ├── (storefront)/              # 실제 쇼핑몰 렌더링
│   │   │   └── [...slug]/
│   │   │       └── page.tsx           # 테넌트 페이지 렌더링
│   │   │
│   │   └── api/
│   │       ├── pages/
│   │       │   ├── route.ts           # GET 목록, POST 생성
│   │       │   └── [pageId]/
│   │       │       ├── route.ts       # GET, PUT, DELETE
│   │       │       └── publish/
│   │       │           └── route.ts   # POST 퍼블리시
│   │       │
│   │       └── shopby/
│   │           └── [...path]/
│   │               └── route.ts       # ShopBy API 프록시
│   │
│   ├── components/
│   │   ├── blocks/                    # 렌더링 블록 컴포넌트
│   │   │   ├── BlockRenderer.tsx      # 블록 타입 → 컴포넌트 매핑
│   │   │   ├── BannerSlider.tsx
│   │   │   ├── ProductList.tsx
│   │   │   ├── CategoryNav.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── editor/                    # 에디터 전용 컴포넌트
│   │       ├── EditorCanvas.tsx       # 가운데 미리보기
│   │       ├── BlockPanel.tsx         # 왼쪽 블록 목록
│   │       └── PropsPanel.tsx         # 오른쪽 속성 편집
│   │
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma 클라이언트 싱글톤
│   │   ├── tenant.ts                  # 테넌트 식별 유틸
│   │   └── shopby.ts                  # ShopBy API 호출 함수
│   │
│   └── types/
│       └── schema.ts                  # Block, Page 타입 정의
│
├── middleware.ts                       # 테넌트 라우팅
├── .env.local
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
