## Why

현재 저장소는 Storefront 렌더러와 기본 블록·ShopBy 프록시·Prisma 스키마까지 구현되어 있지만, RFC가 요구하는 멀티테넌트 라우팅, Admin 전환, 안전한 퍼블리시, 자격 증명 및 구매자 토큰 격리, 커스텀 도메인 운영이 서로 연결된 제품 흐름으로 완성되지 않았다. 특히 현재 Proxy의 헤더 전달 방식, 평문 ShopBy API key, 버전 없는 JSON 스키마와 무인증 API는 실제 테넌트 데이터를 받기 전에 반드시 정리해야 한다.

## What Changes

- Admin을 Vite 프로토타입에서 Next.js App Router 기반 BFF로 전환하고 Supabase Auth, 테넌트·페이지 CRUD, 미디어 업로드, 공유 블록 미리보기를 제공한다.
- 단일 Storefront 배포에서 신뢰 가능한 Host를 기준으로 테넌트를 식별하고, 외부에서 주입된 테넌트 헤더를 제거한 뒤 내부 request header로 전달한다.
- PageSchema에 명시적 버전과 런타임 검증을 도입하고 draft 저장, 미리보기, 원자적 publish, 실패 시 rollback, 테넌트 단위 cache revalidation 흐름을 구현한다.
- ShopBy API key를 암호화 저장하고 서버 전용 프록시에 인증·인가, 경로·메서드 allowlist, 헤더 필터링, rate limit과 로그 마스킹을 적용한다.
- ShopBy 구매자 AccessToken과 GuestToken을 테넌트 호스트별로 격리하고 커스텀 도메인 간 토큰 재사용을 금지한다.
- 와일드카드 서브도메인과 Vercel Domains API 기반 커스텀 도메인 등록·검증·삭제·상태 동기화 절차를 제공한다.
- 페이지 유형별 편집 가능 범위를 강제하고 주문·옵션·결제 영역을 사용자가 훼손할 수 없는 시스템 블록으로 유지한다.
- 테넌트 조회 성능, cache 무효화, 도메인 공급자 용량, 요청량과 보안 이벤트를 관측해 Redis 또는 Cloudflare for SaaS 도입을 측정 기반으로 결정한다.
- **BREAKING** 기존 Prisma `Json` 컬럼에 JSON 문자열로 저장된 PageSchema를 버전이 포함된 JSON object 형식으로 정규화하고 기존 레코드를 migration한다.
- **BREAKING** 기존 무인증 Admin API와 임의 ShopBy proxy 경로 접근을 제거하고 인증된 사용자 및 허용된 동작만 수용한다.

## Capabilities

### New Capabilities

- `admin-builder-platform`: Next.js Admin BFF, 관리자 인증, 테넌트·페이지 관리, 블록 편집·미리보기와 미디어 업로드.
- `tenant-storefront-routing`: Host 기반 테넌트 식별, 신뢰 경계, request header 전달과 단일 Storefront 라우팅.
- `page-schema-lifecycle`: 버전이 있는 PageSchema의 검증·migration, draft 저장, publish·rollback과 cache revalidation.
- `shopby-integration-security`: ShopBy 자격 증명 암호화와 서버 프록시의 인증·allowlist·rate limit·감사 로깅.
- `customer-session-isolation`: 구매자 및 비회원 토큰의 테넌트·도메인별 쿠키 격리와 수명 주기.
- `custom-domain-lifecycle`: 와일드카드 서브도메인 및 커스텀 도메인의 등록·DNS 검증·SSL 상태·삭제 관리.
- `storefront-page-policy`: 홈, 카테고리, 상품 상세, 장바구니·주문서, 마이페이지별 편집 허용 범위와 시스템 블록 보호.
- `platform-observability-scaling`: 테넌트별 요청·지연·오류·보안 이벤트 측정, cache 도입 기준과 도메인 공급자 확장 기준.

### Modified Capabilities

없음. 현재 `openspec/specs`에 기존 capability spec이 없어 이번 변경에서 모두 신규로 정의한다.

## Impact

- 영향 앱: `apps/admin` 전면 전환, `apps/web` Proxy·Server Component·Route Handler·cache 정책 변경.
- 영향 패키지: `packages/database` schema/migration, `packages/types` PageSchema 계약, `packages/blocks` 편집 정책과 안전한 렌더링, `packages/utils` ShopBy 및 routing 계층.
- 영향 API: Admin API에 인증·tenant ownership 검사가 추가되고 ShopBy proxy의 허용 경로·메서드가 제한된다.
- 신규 또는 확정할 외부 시스템: Supabase Auth/Storage/PostgreSQL, Vercel Domains API, 암호화 키 관리 수단. Redis와 Cloudflare for SaaS는 측정 결과에 따른 선택적 의존성이다.
- 데이터 migration: 문자열 형태 JSON을 object 형태의 버전 스키마로 변환하고, ShopBy API key 암호화 backfill이 필요하다.
- 운영 영향: wildcard DNS, 도메인 검증 job/webhook, tenant 단위 revalidation, rate limit, audit log, 보안 비밀값 관리가 배포 전제 조건이 된다.
