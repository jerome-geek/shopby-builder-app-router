# [RFC] ShopBy 기반 멀티테넌트 헤드리스 쇼핑몰 웹빌더 SaaS 아키텍처 검토 요청

## 1. 프로젝트 개요 & 목적
- **목적**: 비개발자/일반인 대상의 간편한 ShopBy 헤드리스 쇼핑몰 구축 웹빌더 SaaS
- **핵심 특징**:
  1. 마이페이지를 제외한 주요 페이지(홈, 카테고리, 상품상세 슬롯 등)를 DND 블록 기반으로 커스텀.
  2. 멀티테넌트 단일 배포 아키텍처(Vercel Platforms)로 기본 서브도메인(`*.domain.com`) 자동 발급 및 개별 커스텀 도메인(`brand.com`) Vercel API 자동 연동.
  3. 관리자(Admin)와 쇼핑몰 프론트(Storefront)의 독립된 모노레포 구성.

---

## 2. 시스템 아키텍처 & 기술 스택

```
[Turborepo Monorepo]
├── apps/
│   ├── admin/       (Next.js App Router) : 관리자 대시보드, DND 블록 에디터, Vercel Domains API 연동
│   └── web/         (Next.js App Router) : 쇼핑몰 Storefront (Edge Middleware 기반 도메인 라우팅, ISR)
└── packages/
    ├── blocks/      (React/Tailwind)    : 공통 블록 컴포넌트 (Header, BannerSlider, ProductList 등)
    ├── database/    (Prisma + Supabase) : PostgreSQL + Supavisor Connection Pooler
    └── types/       (TypeScript)        : Block, PageSchema, ShopBy DTO 정의
```

- **Frontend / Fullstack**: Next.js 15 (App Router, Turbopack)
- **BaaS / Infra**: Supabase (PostgreSQL, Supavisor Pooler, Auth, Storage) + Vercel Platforms
- **ORM / DB**: Prisma ORM (JSONB 컬럼에 PageSchema 저장)
- **State & Editor**: `dnd-kit`, Radix UI, Tailwind CSS

---

## 3. 핵심 설계 결정사항 (Key Decisions)

### 1) Vercel 배포 방식: 멀티테넌트 단일 인스턴스 (Vercel Platforms)
- 고객사별 개별 Vercel 프로젝트 생성이 아닌, **단 1개의 Next.js 인스턴스**로 모든 쇼핑몰 서빙.
- 기본 서브도메인은 와일드카드 DNS(`*.domain.com`)로 무제한 수용.
- 커스텀 도메인은 어드민에서 **Vercel Domains API (`POST /v10/projects/:id/domains`)**를 호출하여 자동 등록/검증/SSL 발급.
- Edge Middleware에서 `Host` 헤더를 파싱하여 `x-tenant-id`를 추출하고 DB에서 해당 테넌트의 `publishedSchema`를 렌더링.

### 2) 앱 분리: Admin(Next.js) + Web(Next.js)
- 어드민을 Vite SPA 대신 **Next.js App Router**로 구성하여 별도 백엔드 없이 Supabase Auth/Storage, Vercel Domains API, Prisma CRUD를 Fullstack BFF로 해결.
- 두 앱이 `@repo/blocks` 패키지를 공유하여 에디터 미리보기와 실제 쇼핑몰 화면의 100% 렌더링 일치 보장.

### 3) 페이지별 커스텀 허용 정책
- **메인 홈 (`/`)**: 100% 블록 자유 배치 (BannerSlider, BannerGrid, ProductList, CategoryNav, HTML 등).
- **카테고리/기획전 (`/category/:id`)**: 상단 배너 슬롯 커스텀 + 시스템 상품 리스트/필터 블록.
- **상품 상세 (`/products/:id`)**: 상/하단 커스텀 슬롯 + 중앙 ShopBy 필수 옵션/주문 시스템 블록(일반인의 주문 로직 훼손 방지).
- **장바구니/주문서 (`/cart`, `/order`)**: 레이아웃 고정, 테마(컬러, 폰트, 로고)만 상속.
- **마이페이지 (`/mypage/*`)**: 커스텀 대상에서 제외 (ShopBy 표준 템플릿 유지).

### 4) 데이터 스키마 & 퍼블리시 파이프라인
```prisma
model Tenant {
  id           String   @id @default(cuid())
  subdomain    String   @unique
  customDomain String?  @unique
  mallId       String   // ShopBy Mall ID
  apiKey       String   // ShopBy Client Key (암호화)
  theme        Json     @default("{}")
  pages        Page[]
}

model Page {
  id              String   @id @default(cuid())
  tenantId        String
  slug            String
  pageType        String   // home | category | product | cart
  draftSchema     Json     @default("{\"blocks\":[]}")
  publishedSchema Json?
  publishedAt     DateTime?

  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@unique([tenantId, slug])
}
```
- 편집 중에는 `draftSchema`에 실시간 저장.
- [퍼블리시] 버튼 클릭 시 `publishedSchema` 갱신 및 Next.js `revalidatePath`로 해당 테넌트 페이지의 ISR 캐시를 즉시 갱신.

---

## 4. 검토 요청 사항 (Review Questions for Codex)

1. **Edge Middleware & 테넌트 조회 최적화**:
   - Storefront의 Next.js Edge Middleware에서 매 요청마다 Prisma로 테넌트 조회를 할 경우 지연이 발생할 수 있는데, 이를 **Edge Redis (Upstash) 캐싱** 또는 **JWT/인메모리 식별**로 해결하는 것이 적합한지?
2. **ShopBy API 인증 & 토큰 격리**:
   - 멀티테넌트 환경에서 구매자의 회원 로그인(AccessToken) 및 비회원 장바구니(GuestToken) 쿠키를 테넌트 도메인별로 완벽히 격리할 때 발생할 수 있는 보안 엣지 케이스는 무엇인지?
3. **스키마 마이그레이션 전략**:
   - 빌더 컴포넌트(`BlockProps`)가 버전업되거나 속성이 변경될 때, DB(JSONB)에 저장된 기존 테넌트들의 `publishedSchema`를 안전하게 마이그레이션/호환 유지하는 권장 방안은?
4. **Vercel Pro 플랜의 커스텀 도메인 한도**:
   - Vercel Pro의 기본 도메인 한도(50개)를 넘어 대규모 커스텀 도메인을 운영할 때 **Cloudflare for SaaS (Custom Hostnames)**를 앞단에 프록시로 두는 구성의 적합성.
