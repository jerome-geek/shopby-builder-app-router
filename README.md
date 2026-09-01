# ShopBy Builder

ShopBy API를 커머스 백엔드로 사용하는 멀티테넌트 헤드리스 쇼핑몰 빌더입니다. 하나의 Storefront 애플리케이션이 테넌트별 페이지 스키마를 읽어 공용 블록으로 화면을 렌더링하고, 별도의 Admin 애플리케이션에서 쇼핑몰을 관리하는 구조를 지향합니다.

> 이 저장소는 초기 개발 단계입니다. 아래의 **현재 구현 상태**와 **로드맵**을 구분해서 확인해 주세요.
>
> 목표 아키텍처와 설계 배경은 [Architecture Review RFC](docs/RFC-architecture-review.md)를 기준으로 합니다. RFC의 Next.js 15 표기는 작성 당시 계획이며, 현재 Storefront에는 Next.js 16.2가 설치되어 있습니다.

## 현재 구현 상태

| 영역 | 상태 | 설명 |
| --- | --- | --- |
| Storefront | 구현 중 | Next.js App Router에서 테넌트와 URL slug에 맞는 `publishedSchema`를 렌더링합니다. |
| 공용 블록 | 기본 구현 | Header, Footer, BannerSlider, BannerGrid, ProductList, CategoryNav를 제공합니다. |
| ShopBy 연동 | 기본 구현 | 상품·카테고리 조회 유틸리티와 GET/POST 프록시 Route Handler가 있습니다. |
| Admin | 프로토타입 | 현재는 Next.js가 아닌 Vite + React SPA이며, 테넌트 목록 조회 화면만 구현되어 있습니다. |
| 데이터베이스 | 기본 구현 | Prisma + PostgreSQL 스키마와 개발용 seed가 있습니다. Supabase는 배포 대상이지만 전용 연동은 아직 없습니다. |
| 도메인 라우팅 | 유틸리티만 구현 | `packages/utils/proxy.ts`가 있으나 `apps/web` 진입점에 연결되지 않았고, 현재는 값을 응답 헤더에 넣으므로 downstream의 `headers()`가 읽을 request header 전달 방식으로 수정해야 합니다. |
| 편집·발행 | 미구현 | `draftSchema`와 `publishedSchema` 컬럼만 있으며 저장·퍼블리시 UI와 `revalidatePath` 파이프라인은 없습니다. |
| 인증·토큰 격리 | 미구현 | Admin 인증과 구매자 AccessToken/GuestToken의 테넌트 도메인별 쿠키 정책이 없습니다. |
| 자격 증명 보호 | 미구현 | RFC는 ShopBy API key 암호화를 요구하지만 현재 `Tenant.apiKey`는 평문 `String` 컬럼입니다. |
| 커스텀 도메인 | 미구현 | Vercel Domains API 등록·검증·SSL 상태 관리가 필요합니다. |

## 저장소 구조

```text
shopby-builder-app-router/                 # pnpm + Turborepo 모노레포
├── apps/
│   ├── admin/                             # Vite + React 관리자 SPA (localhost:3000)
│   └── web/                               # Next.js Storefront/API (localhost:3001)
├── packages/
│   ├── blocks/                            # 스키마 기반 Storefront 블록
│   ├── database/                          # Prisma schema, client, migration, seed
│   ├── types/                             # PageSchema와 블록/ShopBy 공용 타입
│   ├── ui/                                # 공용 UI 패키지
│   └── utils/                             # ShopBy 클라이언트와 테넌트 proxy 유틸리티
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 기술 스택

- 모노레포: pnpm 9, Turborepo 2, TypeScript 5
- Storefront: Next.js 16.2, React 19, App Router, Tailwind CSS 4
- Admin: Vite 6, React 19, React Router 7, dnd-kit, Radix UI
- 데이터베이스: PostgreSQL, Prisma 6 (`Json` 컬럼으로 페이지·테마 스키마 저장)
- 커머스 API: ShopBy API
- 배포 방향: Supabase PostgreSQL과 Vercel Platforms Architecture

## 동작 구조

```text
브라우저
├─ Admin :3000 ── /api 요청 ───────────────┐
└─ Storefront :3001 ─┬─ tenant + slug 조회 ├─ Next.js :3001 ─ Prisma ─ PostgreSQL
                     └─ ShopBy 요청 ───────┘              └─ ShopBy API
```

목표 Storefront 렌더링 흐름은 다음과 같습니다.

1. Next.js Proxy가 호스트명으로부터 `x-tenant-id`를 결정해 downstream request header로 전달합니다. 현재는 진입점 연결과 header 전달 방식 수정이 남아 있습니다.
2. Server Component가 `subdomain` 또는 `customDomain`으로 테넌트를 찾습니다. Proxy 자체는 Prisma를 호출하지 않습니다.
3. 요청 경로와 일치하는 페이지의 `publishedSchema`를 조회합니다.
4. `BlockRenderer`가 블록의 `order`에 따라 공용 블록 컴포넌트를 렌더링합니다.
5. ProductList와 CategoryNav는 테넌트의 `mallId`, `apiKey`로 ShopBy API를 호출합니다.

## RFC 기준 핵심 설계 원칙

- Storefront는 고객사마다 별도 배포하지 않고 하나의 멀티테넌트 Next.js 배포로 운영합니다.
- Admin과 Storefront는 독립 앱으로 유지하되 `@repo/blocks`를 공유하여 편집 미리보기와 실제 렌더링의 차이를 최소화합니다.
- 자유 편집은 홈과 허용된 슬롯으로 제한하고, 주문·옵션·결제처럼 무결성이 중요한 영역은 시스템 블록으로 고정합니다.
- 편집본은 `draftSchema`, 라이브 버전은 `publishedSchema`로 분리하고 퍼블리시 성공 후 해당 테넌트 캐시만 무효화합니다.
- 기본 도메인은 와일드카드 DNS, 고객 도메인은 Vercel Domains API를 기본 경로로 사용합니다. 공급자 한도와 비용이 임계점에 도달하면 Cloudflare for SaaS 같은 대안을 검토합니다.

### 아직 결정하거나 검증해야 할 항목

| 주제 | 현재 판단 | 구현 전 필요한 검증 |
| --- | --- | --- |
| 테넌트 조회 캐시 | 우선 DB 조회로 정확성을 확보 | 트래픽 측정 후 Edge 호환 Redis 캐시 도입 여부, TTL, 도메인 변경 시 무효화 전략 |
| 테넌트 header 전달 | Proxy에서 request header로 전달 | 외부 입력의 위조 방지를 위해 기존 `x-tenant-id` 제거 후 신뢰 가능한 Host 값으로 재생성 |
| 구매자 토큰 격리 | 테넌트 호스트 전용 쿠키가 기본 | `Domain`, `Path`, `SameSite`, `Secure` 정책과 커스텀 도메인 간 토큰 재사용 금지 |
| PageSchema 호환성 | 명시적 schema version과 런타임 검증 필요 | 버전별 migration 함수, 구버전 블록 기본값, 실패 시 이전 published schema 유지 |
| API key 보호 | 애플리케이션 레벨 암호화 필요 | KMS/키 관리, 키 회전, 복호화 권한과 로그 마스킹 |
| 커스텀 도메인 확장 | Vercel을 우선 사용 | 실제 계약 플랜의 최신 도메인 한도·비용 확인 후 Cloudflare for SaaS 전환 기준 수립 |

## 시작하기

### 사전 요구 사항

- Node.js 20.9 이상 (Next.js 16.2의 최소 요구 버전)
- pnpm 9 (`packageManager`에 `pnpm@9.0.0` 지정)
- PostgreSQL 데이터베이스
- 실제 상품·카테고리를 조회하려면 ShopBy mall ID와 API key

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

Prisma CLI용 `packages/database/.env`와 Next.js 런타임용 `apps/web/.env.local`에 같은 데이터베이스 URL을 설정합니다. 두 파일은 커밋하지 마세요.

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

| 변수 | 필수 | 사용 위치 | 설명 |
| --- | --- | --- | --- |
| `DATABASE_URL` | 예 | Prisma, `apps/web` | PostgreSQL 연결 문자열 |
| `ROOT_DOMAIN` | 아직 아님 | 도메인 proxy 유틸리티 | 프로덕션 루트 도메인. Next.js proxy 진입점 연결 후 사용됩니다. 현재 코드 기본값은 `localhost:3000`이므로 연결 시 Storefront 개발 포트와 함께 정리해야 합니다. |

현재 스키마는 `DIRECT_URL`, Supabase URL/key, Vercel token을 참조하지 않습니다. 해당 값은 관련 기능을 구현할 때 추가합니다.

### 3. 데이터베이스 초기화

```bash
# Prisma Client 생성
pnpm db:generate

# 현재 Prisma schema를 개발 DB에 반영
pnpm db:push

# my-shop 테넌트와 예제 페이지 생성
pnpm db:seed
```

`db:seed`는 `test-mall`과 `test-api-key`를 넣습니다. Storefront에서 실제 ShopBy 데이터를 확인하려면 DB의 `Tenant.mallId`와 `Tenant.apiKey`를 유효한 값으로 바꿔야 합니다.

기존 migration을 그대로 적용해야 하는 공유·운영 환경에서는 `db:push` 대신 Prisma migration 배포 절차를 사용하세요. 현재 루트 스크립트에는 `migrate deploy` 명령이 등록되어 있지 않습니다.

### 4. 개발 서버 실행

```bash
# Admin과 Storefront 동시 실행
pnpm dev
```

| 서비스 | URL | 비고 |
| --- | --- | --- |
| Admin | [http://localhost:3000/dashboard](http://localhost:3000/dashboard) | Vite가 `/api`를 Storefront로 프록시합니다. |
| Storefront | [http://localhost:3001](http://localhost:3001) | 테넌트 proxy 연결 전에는 `x-tenant-id`가 없어 404가 정상입니다. |
| Admin tenants API | [http://localhost:3001/api/admin/tenants](http://localhost:3001/api/admin/tenants) | 현재 인증 없이 테넌트 목록을 반환합니다. 개발 환경에서만 사용하세요. |

앱 하나만 실행할 수도 있습니다.

```bash
pnpm --filter admin dev
pnpm --filter web dev
```

## 주요 명령어

| 명령어 | 설명 |
| --- | --- |
| `pnpm dev` | 모든 앱의 개발 서버 실행 |
| `pnpm build` | 전체 워크스페이스 빌드 |
| `pnpm lint` | 전체 워크스페이스 lint 실행 |
| `pnpm db:generate` | Prisma Client 생성 |
| `pnpm db:push` | Prisma schema를 DB에 반영 |
| `pnpm db:seed` | 개발용 테넌트와 페이지 생성 |

## 현재 API

| Method | 경로 | 역할 |
| --- | --- | --- |
| `GET` | `/api/admin/tenants` | 페이지 개수를 포함한 테넌트 목록 조회 |
| `GET` | `/api/shopby/[...path]` | `x-tenant-id`에 해당하는 테넌트 자격 증명으로 ShopBy GET 요청 전달 |
| `POST` | `/api/shopby/[...path]` | `x-tenant-id`에 해당하는 테넌트 자격 증명으로 ShopBy POST 요청 전달 |

> Admin API와 ShopBy proxy에는 아직 인증·인가 및 허용 경로 제한이 없습니다. 외부에 노출하기 전에 반드시 보안 정책을 추가해야 합니다.

## 페이지 커스텀 범위

| 페이지 | 목표 범위 | 계획된 구현 방식 |
| --- | --- | --- |
| 메인 홈 (`/`) | 자유 블록 배치 | BannerSlider, BannerGrid, ProductList, CategoryNav, Header, Footer 조합. RFC의 HTML 블록은 별도 보안 설계 후 추가 |
| 카테고리/기획전 | 상단 배너 + 시스템 리스트 | 커스텀 상단 영역과 정렬·필터·상품 그리드 결합 |
| 상품 상세 | 슬롯형 부분 커스텀 | 상·하단 커스텀 슬롯과 고정 주문·옵션 영역 결합 |
| 장바구니/주문서 | 테마 커스텀 | 고정 레이아웃에 색상·폰트·로고 적용 |
| 마이페이지 | 커스텀 제외 | ShopBy 규격의 표준 템플릿 유지 |

## 로드맵

### Phase 1: 기반 인프라와 Admin 전환

- [ ] `apps/admin`을 Vite SPA에서 Next.js App Router로 전환
- [ ] PostgreSQL 운영 연결과 migration 배포 절차 정립
- [ ] Supabase Auth 기반 관리자 인증·인가 구현
- [ ] Supabase Storage 기반 이미지 업로드 구현
- [ ] `apps/web`에 호스트 기반 Next.js proxy 진입점 연결

### Phase 2: 빌더 에디터

- [ ] 테넌트·쇼핑몰·페이지 CRUD
- [ ] dnd-kit 기반 블록 드래그앤드롭 캔버스
- [ ] 블록 속성 편집 패널
- [ ] `draftSchema` 저장과 `publishedSchema` 발행 파이프라인
- [ ] PageSchema 버전 필드, 런타임 검증과 버전별 migration
- [ ] HTML 블록 허용 범위, sanitization과 Content Security Policy 설계
- [ ] 데스크톱·태블릿·모바일 미리보기

### Phase 3: 도메인과 배포

- [ ] 와일드카드 서브도메인 라우팅
- [ ] Vercel Domains API 기반 커스텀 도메인 등록
- [ ] DNS 검증 및 SSL 상태 UI
- [ ] 테넌트 단위 on-demand revalidation
- [ ] 도메인 공급자 한도·비용 모니터링과 Cloudflare for SaaS 전환 기준

### Phase 4: Storefront 시스템 페이지

- [ ] 상품 상세와 옵션·구매 영역
- [ ] 카테고리·기획전 필터링과 페이지네이션
- [ ] 장바구니·주문·결제 연동
- [ ] 마이페이지 표준 템플릿

### Phase 5: 안정화

- [ ] Admin API 인증·인가
- [ ] ShopBy API key 암호화, 키 회전과 로그 마스킹
- [ ] 도메인별 구매자 AccessToken·GuestToken 쿠키 격리
- [ ] ShopBy proxy 허용 경로, 헤더, rate limit 정책
- [ ] 테넌트 조회 성능 측정과 필요 시 캐시·무효화 적용
- [ ] 테넌트별 자격 증명 격리 검증
- [ ] 캐시 태깅과 revalidation 검증
- [ ] 테스트, 관측성, CI/CD 구성

## 개발 시 주의 사항

- `Tenant.apiKey`는 비밀 정보입니다. 클라이언트 번들, 로그, Git 이력에 노출하지 마세요.
- 현재 DB에는 `Tenant.apiKey`가 암호화되지 않은 상태로 저장됩니다. 실제 고객 자격 증명을 넣기 전에 암호화와 키 관리 방식을 구현해야 합니다.
- 현재 seed 데이터의 ShopBy 자격 증명은 더미 값입니다.
- 현재 `draftSchema`와 `publishedSchema`는 Prisma `Json` 컬럼 안에 JSON 문자열로 저장되고 애플리케이션에서 다시 파싱합니다. schema version과 검증 도입 시 저장 형식도 함께 정규화해야 합니다.
- `publishedSchema`가 없는 페이지는 “페이지 준비 중입니다.”를 표시합니다.
- 새 블록 타입은 `packages/types`의 타입, `packages/blocks`의 컴포넌트와 `BlockRenderer` 매핑을 함께 갱신해야 합니다.
- 운영 배포 전에는 Admin/API 인증, ShopBy proxy 제한, DB migration 전략을 먼저 완료해야 합니다.
