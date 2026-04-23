# ShopBy Builder (SaaS)

ShopBy API 기반의 멀티테넌트 헤드리스 웹빌더 SaaS 프로젝트입니다. 사용자가 코드 없이 자신의 쇼핑몰을 구축하고 운영할 수 있는 환경을 제공합니다.

## 🚀 프로젝트 목적
- **비개발자 타겟**: 누구나 쉽게 ShopBy 기반 쇼핑몰을 구축.
- **멀티테넌트 지원**: 하나의 Next.js 앱으로 수많은 고객사의 독립적인 쇼핑몰 운영.
- **헤드리스 쇼핑몰**: ShopBy API를 백엔드로 사용하고 프론트엔드 디자인을 자유롭게 편집.

## 🛠 기술 스택
- **Framework**: Next.js (App Router, Turbopack)
- **Styling**: Tailwind CSS
- **Database**: Prisma + SQLite (Local Dev) / PostgreSQL (Production)
- **State Management**: dnd-kit (드래그앤드롭), Radix UI
- **Infrastructure**: Vercel Platforms Architecture (Edge Middleware / Proxy)

## 🏗 아키텍처 구조
- **`(builder)` Group**: 빌더 에디터 및 어드민 대시보드. (`app.domain.com`)
- **`(storefront)` Group**: 실제 고객사 쇼핑몰 렌더링. (`*.domain.com`, Custom Domains)
- **Schema-driven Rendering**: JSON 스키마를 기반으로 블록들을 동적으로 렌더링하는 `BlockRenderer` 엔진.

## 📅 개발 로드맵

### Phase 1: Storefront 렌더러 (진행 중)
- [x] ShopBy API Proxy 및 서버사이드 호출 레이어 (`lib/shopby.ts`)
- [x] 도메인 기반 테넌트 식별 미들웨어 (`proxy.ts`)
- [x] 핵심 블록 구현 (`Header`, `Footer`, `BannerSlider`, `ProductList`, `CategoryNav`)
- [x] DB 스키마 기반 동적 페이지 렌더링 (`[[...slug]]`)
- [ ] 시스템 고정 페이지 구현 (상품 상세, 장바구니, 결제, 마이페이지)

### Phase 2: Builder 어드민 & 에디터
- [ ] 대시보드 UI 및 페이지 관리 CRUD
- [ ] dnd-kit 기반 드래그앤드롭 에디터 UI
- [ ] 블록 속성 편집 패널 (`PropsPanel`)
- [ ] 디자인 실시간 미리보기 및 퍼블리시 기능

### Phase 3: 배포 및 고도화
- [ ] Vercel Wildcard DNS 및 Custom Domain API 연동
- [ ] PostgreSQL 마이그레이션
- [ ] 빌더 블록 종류 확장 및 테마 시스템 도입

## 💻 시작하기

```bash
# 의존성 설치
pnpm install

# 데이터베이스 세팅 및 마이그레이션
npx prisma migrate dev --name init

# 시드 데이터 삽입
npx prisma db seed

# 개발 서버 실행
pnpm dev
```

- **대시보드**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **테스트 쇼핑몰**: [http://my-shop.localhost:3000](http://my-shop.localhost:3000) (브라우저가 서브도메인을 지원해야 함)
