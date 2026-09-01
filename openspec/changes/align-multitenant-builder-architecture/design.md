## Context

현재 모노레포는 Next.js 16 Storefront, Vite Admin 프로토타입, Prisma/PostgreSQL, 공유 block/type 패키지로 구성된다. Storefront는 DB의 `publishedSchema`를 읽어 블록을 렌더링하지만 Host 기반 Proxy가 앱에 연결되지 않았고, helper도 내부 식별자를 response header에 써서 downstream request가 읽을 수 없다. Admin API는 인증되지 않았으며 ShopBy API key는 평문이고, PageSchema는 Prisma `Json` 안에 JSON 문자열로 저장된다.

목표 사용자는 배포나 인프라를 모르는 쇼핑몰 운영자다. Admin과 Storefront는 독립 배포 가능해야 하지만 모든 고객 Storefront는 하나의 멀티테넌트 배포를 공유한다. Supabase와 Vercel이 기본 운영 플랫폼이며, Redis와 Cloudflare for SaaS는 실제 용량 및 지연 지표가 필요할 때만 추가한다.

## Goals / Non-Goals

**Goals:**

- 신뢰 가능한 Host 기반 테넌트 경계와 모든 데이터/API의 tenant ownership 검사를 확립한다.
- Admin을 Next.js BFF로 전환해 인증, CRUD, 편집, 미리보기, 미디어, publish를 한 앱에서 처리한다.
- PageSchema를 검증·버전 관리 가능한 native JSON object로 정규화하고 안전한 migration과 rollback을 제공한다.
- ShopBy 자격 증명과 구매자 세션을 테넌트별로 격리하고 proxy 공격 표면을 제한한다.
- 와일드카드 및 커스텀 도메인의 전체 수명 주기와 운영 관측성을 제공한다.
- 페이지 유형별 편집 정책을 서버와 렌더러 양쪽에서 동일하게 강제한다.

**Non-Goals:**

- 첫 구현에서 Redis, Cloudflare for SaaS 또는 다중 리전 active-active를 필수 도입하지 않는다.
- ShopBy 자체 주문·결제·회원 정책을 재구현하지 않는다.
- 임의 JavaScript 실행이나 무제한 HTML 삽입을 허용하지 않는다.
- 고객마다 별도의 Storefront 빌드 또는 Vercel 프로젝트를 생성하지 않는다.
- 과금 및 구독 결제 자체는 이번 변경 범위에 포함하지 않으며 사용량 측정 기반만 마련한다.

## Decisions

### 1. Admin과 Storefront는 분리하고 Storefront만 단일 멀티테넌트 런타임으로 운영한다

`apps/admin`은 Next.js App Router BFF로 전환하고 `apps/web`은 고객 트래픽 전용으로 유지한다. 두 앱은 `@repo/blocks`, `@repo/types`, `@repo/database`를 공유한다. 하나의 Next.js 앱에 Admin과 Storefront route group을 합치는 대안은 배포가 단순하지만 장애·보안 경계와 독립 확장을 약화하므로 선택하지 않는다.

### 2. 테넌트 식별자는 Host에서만 파생한다

Storefront Proxy는 전달받은 내부용 tenant header를 먼저 제거하고, allowlist된 root domain 및 정규화된 Host로부터 식별자를 다시 만든다. 이 값을 `NextResponse.next({ request: { headers } })` 형태의 downstream request header로 전달한다. Server Component와 Route Handler는 클라이언트 query/body의 tenant ID를 신뢰하지 않는다.

Proxy는 DB를 조회하지 않는다. Server 계층이 `subdomain OR customDomain`으로 테넌트를 조회하며, 초기에는 DB 인덱스를 사용한다. Redis는 p95 지연과 DB 부하가 정한 기준을 넘을 때 도입하고 domain 변경 이벤트로 즉시 무효화한다. Edge에서 Prisma를 직접 호출하는 대안은 runtime 제약과 매 요청 비용 때문에 제외한다.

### 3. PageSchema는 버전 envelope와 런타임 validator를 갖는 native JSON object다

저장 형태는 `{ schemaVersion: number, blocks: Block[] }`로 통일한다. `packages/types`에 TypeScript 타입과 런타임 validator를 함께 두고 Admin write, preview, publish, Storefront read 경계에서 검증한다. migration은 `vN -> vN+1` 순수 함수 체인으로 수행하며 원본을 변경하지 않는다.

기존 JSON 문자열 레코드는 one-time migration으로 parse·검증·정규화한다. 유효하지 않은 레코드는 자동 덮어쓰지 않고 격리 보고서에 남긴다. publish 이력과 rollback을 위해 immutable `PageRevision`을 추가한다. 모든 블록을 독립 DB row로 만드는 대안은 순서 변경과 draft snapshot의 복잡도가 커 MVP에는 채택하지 않는다.

### 4. Publish는 DB transaction과 사후 cache 무효화로 나눈다

transaction 안에서 검증된 draft를 revision snapshot으로 저장하고 `publishedSchema`, `publishedAt`, 현재 revision을 갱신한다. commit 이후 tenant/page tag 또는 path를 revalidate한다. revalidation 실패는 DB publish를 되돌리지 않고 retry 가능한 outbox/job에 기록한다. 외부 cache 호출까지 하나의 transaction으로 묶는 것은 불가능하므로 선택하지 않는다.

### 5. ShopBy 자격 증명은 versioned envelope encryption을 사용한다

DB에는 ciphertext, nonce/IV, key version만 저장한다. 애플리케이션은 credential service를 통해서만 복호화하며 plaintext를 client payload, exception, metric label, log에 포함하지 않는다. 개발은 제한된 환경 키를 사용할 수 있지만 운영은 managed KMS/secret provider의 key-encryption-key를 사용하고 key version별 점진적 rotation을 지원한다.

ShopBy proxy는 capability별 endpoint/method allowlist를 사용하고 hop-by-hop 및 임의 authorization header를 제거한다. tenant credential은 내부 tenant context에서 주입한다. 임의 path를 그대로 전달하는 범용 proxy는 SSRF와 권한 확장 위험 때문에 제거한다.

### 6. 구매자 세션은 host-only secure cookie로 격리한다

AccessToken과 GuestToken은 `Domain` 속성이 없는 host-only, `Secure`, `HttpOnly`, 적절한 `SameSite`, `Path=/` cookie로 저장한다. 플랫폼 서브도메인 사이와 고객 커스텀 도메인 사이에 token을 복사하지 않는다. 서버 proxy만 ShopBy 요청에 token을 주입하고 logout·만료·refresh 실패 시 관련 cookie를 제거한다.

### 7. 도메인은 별도 수명 주기 모델로 관리한다

`TenantDomain`은 hostname, type, provider ID, verification 상태, SSL 상태, lastCheckedAt, failure reason을 저장한다. 등록·검증·삭제는 idempotency key를 사용하는 server action/job으로 수행한다. Vercel Domains API를 기본 provider adapter로 두되 UI와 DB는 provider 독립 상태 모델을 사용한다. Cloudflare for SaaS는 최신 계약 한도·비용과 운영 지표가 전환 기준을 만족할 때 별도 change로 도입한다.

### 8. 페이지 정책은 schema 검증과 renderer에서 이중 강제한다

홈은 승인된 일반 블록을 자유 배치한다. 카테고리·기획전과 상품 상세는 지정 slot만 사용자 블록을 받고, 상품 옵션·주문·장바구니·결제는 제거 또는 재배치할 수 없는 system block으로 렌더링한다. 마이페이지는 편집 schema 대상에서 제외한다. HTML block은 sanitizer, URL protocol allowlist와 CSP가 준비되기 전 비활성화한다.

### 9. 운영 결정은 tenant-safe telemetry를 근거로 한다

요청 수, p50/p95 지연, DB lookup, ShopBy upstream 오류, publish/revalidation, rate-limit, domain 상태를 tenant ID로 집계하되 hostname, token, API key, 구매자 개인정보는 label이나 log에 남기지 않는다. cache와 대체 domain provider 도입은 문서화된 임계값과 추세에 의해 결정한다.

## Risks / Trade-offs

- [Admin 전환 중 기능 공백] → Vite 화면의 route와 API 계약을 목록화하고 Next.js 화면 단위로 교체한 뒤 최종 cutover한다.
- [PageSchema migration에서 손상 데이터 발견] → dry-run 보고서, backup, quarantined row 목록과 역변환 없는 rollback snapshot을 준비한다.
- [암호화 키 유실 또는 rotation 실패] → key version을 ciphertext와 함께 저장하고 이전 키를 migration 완료까지 유지한다.
- [Host/header spoofing] → platform ingress의 forwarded host 신뢰 조건을 고정하고 Proxy에서 내부 header를 항상 재생성한다.
- [publish와 revalidation의 부분 실패] → transactional outbox와 idempotent retry로 eventual consistency를 명시한다.
- [Vercel API rate limit 및 provider 장애] → 비동기 job, backoff, idempotency와 사용자에게 보이는 pending/failed 상태를 제공한다.
- [공유 block 변경이 기존 페이지를 깨뜨림] → schema version, backward-compatible renderer와 fixture 기반 contract test를 적용한다.
- [범위가 큰 변경으로 beta가 지연] → security foundation, routing/schema/publish, Admin editor, domain/system pages 순으로 feature flag 뒤에서 단계 배포한다.

## Migration Plan

1. 현재 DB와 PageSchema를 backup하고 schema/credential migration dry-run 보고서를 생성한다.
2. 공용 validator, versioned schema, tenant context, credential service를 기존 동작 뒤에 추가한다.
3. `PageRevision`, `TenantDomain`, publish outbox와 encrypted credential 컬럼을 additive migration으로 배포한다.
4. 기존 PageSchema 문자열을 native JSON object로 변환하고 API key를 암호화 backfill한다. dual-read 기간 동안 구형 값을 읽되 새 write는 신형 형식만 사용한다.
5. Storefront Proxy request-header 전달과 tenant ownership 검사를 feature flag로 활성화하고 unknown/reserved host 동작을 검증한다.
6. 제한된 ShopBy proxy와 host-only session cookie를 활성화한 뒤 기존 범용 proxy를 제거한다.
7. Next.js Admin을 인증, CRUD, editor, publish, media 순으로 배포하고 Vite Admin을 종료한다.
8. custom domain job과 운영 telemetry를 활성화하고 beta tenant부터 단계적으로 허용한다.
9. 모든 레코드와 트래픽이 신형 경로를 사용하는 것을 확인한 뒤 legacy schema/credential 컬럼과 compatibility path를 제거한다.

Rollback은 단계별 feature flag를 끄고 이전 application version으로 되돌리되, migration 전 backup과 PageRevision은 유지한다. 신형 데이터 write가 시작된 후에는 DB를 단순 down migration하지 않고 dual-read compatibility로 이전 앱이 읽을 수 있는 상태를 유지한다.

## Open Questions

- 운영용 envelope encryption provider를 Vercel/Supabase secret 조합으로 시작할지 별도 managed KMS로 시작할지 결정해야 한다.
- publish revalidation을 path 중심으로 할지 tenant/page cache tag 중심으로 할지 Next.js 16의 실제 cache 구성에 맞춰 확정해야 한다.
- domain verification을 polling job, provider webhook 또는 혼합 방식 중 어떤 형태로 운영할지 결정해야 한다.
- cache 도입 임계값과 Vercel에서 Cloudflare for SaaS로 확장할 계약·비용 기준은 부하 테스트 및 최신 provider 조건 확인 후 수치화해야 한다.
- Admin을 Next.js로 전환하는 동안 기존 Vite URL을 redirect할지 동일 hostname에서 즉시 cutover할지 배포 환경에 맞춰 결정해야 한다.
