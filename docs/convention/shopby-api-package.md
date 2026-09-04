# 📦 packages/shopby-api & 신규 앱 추가 가이드

이 문서는 `apps/web`의 `api`/`models`를 `packages/shopby-api`로 분리한 배경과, 이를 이용해 `apps/staff`(임직원몰)처럼 **동일한 샵바이 로직을 쓰는 새 Next.js 앱을 추가하는 방법**을 정의합니다.

> [!IMPORTANT]
> 여러 몰(mall)이 같은 샵바이 API 계약을 쓰되 `clientId`(파트너 센터 발급 값)만 다른 상황을 위한 구조입니다. `cookieNamespace`는 API 계약의 차이가 아니라 같은 도메인에서 몰별 인증 쿠키를 분리하기 위한 애플리케이션 식별자입니다.
> 컴포넌트/엔티티(`entities`, `features`, `widgets`)를 공유할지는 아직 결정되지 않았습니다 — 이 문서는 `api`/`models` 레이어만 다룹니다.

---

## 1. 배경

기존에는 `apps/web/src/api`, `apps/web/src/models`가 `apps/web/src/configs/env`를 직접 import해서 axios `baseURL`, `clientId` 등을 읽었습니다. 이 상태로는 새 몰(`staff`)을 추가할 때 API 함수 82개 + 타입 정의를 통째로 복사/포크해야 했습니다.

`clientId`(파트너센터 발급 값)만 다르고 나머지 API 계약은 100% 동일하므로, **env 의존성을 제거하고 값을 주입받는 패키지**로 분리했습니다.

## 2. 구조

```
packages/shopby-api/
├── package.json          # @geek/shopby-api
├── tsconfig.json          # 자체 타입체크용(paths: @/* -> ./src/*)
├── vitest.config.mts      # 패키지 내부 테스트의 @ alias 설정
└── src/
    ├── index.ts           # configureShopbyApi, getShopbyApiConfig export
    ├── @types/global.d.ts # Nullable/Paging/ItemList 등 api·models가 쓰는 앰비언트 타입 + Window.myapp
    ├── api/                # 기존 apps/web/src/api 그대로 (82개 엔드포인트 파일)
    │   └── core/
    │       ├── config.ts       # 런타임 singleton 설정 저장소 + configureShopbyApi()
    │       ├── request.ts      # shopbyRequest (baseURL/헤더를 인터셉터에서 config.ts로부터 읽음)
    │       ├── geekRequest.ts  # geekRequest (동일 패턴)
    │       ├── utils.ts        # defaultHeaders/logOnDev 등 (env 대신 config.ts 참조)
    │       ├── cookie.ts       # 구 apps/web/src/shared/lib/cookie.ts
    │       ├── cookieKeys.ts   # 구 apps/web/src/shared/model/cookieKeys.ts (cookieNamespace를 config.ts에서 읽음)
    │       ├── auth.ts         # 구 apps/web/src/shared/lib/auth.ts
    │       └── auth.client.ts  # 구 apps/web/src/shared/lib/auth.client.ts (CSRF)
    ├── models/             # 기존 apps/web/src/models 그대로
    └── shared/model/       # 구 apps/web/src/shared/model/{label,terms,form}.ts (models가 참조)
```

## 3. env 주입 패턴

`packages/shopby-api`는 어떤 앱의 env도 알지 못합니다. 대신 `configureShopbyApi()`를 앱 부트스트랩 시점에 한 번 호출해서 값을 주입받습니다.

```ts
// apps/web/src/configs/shopbyApi.ts, apps/staff/src/configs/shopbyApi.ts
import { configureShopbyApi } from '@geek/shopby-api';
import { env } from '@/configs/env';

configureShopbyApi({
    shopbyBaseURL: env.NEXT_PUBLIC_SHOPBY_BASE_URL,
    geekBaseURL: env.NEXT_PUBLIC_GEEK_BASE_URL,
    clientId: env.NEXT_PUBLIC_CLIENT_ID,
    cookieNamespace: 'JOLLYPOT', // 'STAFF' 등 앱별 인증 쿠키 namespace
    version: env.NEXT_PUBLIC_VERSION,
    locale: env.NEXT_PUBLIC_LOCALE,
    currency: env.NEXT_PUBLIC_CURRENCY,
    isDev: env.NEXT_PUBLIC_MODE === 'development',
});
```

이 파일을 `pages/_app.tsx`에서 side-effect import(`import '@/configs/shopbyApi'`)합니다. `shopbyRequest`/`geekRequest`는 axios 요청 인터셉터에서 매 요청마다 `getShopbyApiConfig()`를 읽으므로 첫 실제 API 호출 전에 configure가 실행되어야 합니다. 초기화하지 않았거나 필수 문자열이 비어 있으면 즉시 예외가 발생합니다. 개발 중 HMR처럼 동일한 설정으로 다시 호출하는 것은 허용하지만, 이미 초기화된 설정을 다른 값으로 덮어쓰는 것은 차단합니다.

이 설정은 **앱 런타임 단위의 singleton**입니다. 따라서 `web`과 `staff`를 각각 빌드하고 별도 프로세스/서버로 실행하며, 한 앱 런타임에서 하나의 mall만 취급한다는 전제가 있습니다. 한 Node.js 프로세스에서 요청별로 mall/clientId를 바꾸는 멀티테넌트 용도로는 사용할 수 없습니다.

`getServerSideProps`, API Route, 테스트, Storybook, 독립 실행 스크립트처럼 `_app.tsx`의 실행을 전제로 할 수 없는 진입점에서 API를 직접 사용한다면, 해당 실행 환경에서도 API 모듈을 사용하기 전에 `@/configs/shopbyApi`를 명시적으로 import해야 합니다.

> [!NOTE]
> 컴포넌트/엔티티 레벨에서 몰마다 다른 값을 써야 할 일이 생기면, 패키지 내부에서 `if (cookieNamespace === 'STAFF')`처럼 분기하지 않습니다. 항상 앱이 props/context로 값을 내려주거나, 지금처럼 `configureShopbyApi()`에 값을 실어 보냅니다. 패키지가 특정 앱의 존재를 아는 순간 재사용성이 깨집니다.

## 4. import 경로가 안 바뀐 이유

`@/api/product/product`, `@/models/order` 같은 import는 **약 420개 파일**에 퍼져 있어 전부 고치는 대신, 각 앱의 `tsconfig.json` / `vitest.config.mts`에서 해당 alias만 패키지 경로로 리다이렉트합니다. 즉 현재 구조는 기존 import 호환성을 위한 **과도기적 monorepo source redirect**이며, `@geek/shopby-api`만 설치하면 독립적으로 동작하는 일반 배포 패키지는 아닙니다.

```jsonc
// apps/{web,staff}/tsconfig.json compilerOptions.paths
"@/api/*": ["../../packages/shopby-api/src/api/*"],
"@/models": ["../../packages/shopby-api/src/models/index.ts"],
"@/models/*": ["../../packages/shopby-api/src/models/*"],
"@/shared/lib/cookie": ["../../packages/shopby-api/src/api/core/cookie.ts"],
"@/shared/lib/auth": ["../../packages/shopby-api/src/api/core/auth.ts"],
"@/shared/lib/auth.client": ["../../packages/shopby-api/src/api/core/auth.client.ts"],
"@/shared/model/cookieKeys": ["../../packages/shopby-api/src/api/core/cookieKeys.ts"],
"@/shared/model/label": ["../../packages/shopby-api/src/shared/model/label.ts"],
"@/shared/model/terms": ["../../packages/shopby-api/src/shared/model/terms.ts"],
"@/shared/model/form": ["../../packages/shopby-api/src/shared/model/form.ts"],
"@geek/shopby-api": ["../../packages/shopby-api/src/index.ts"],
"@/*": ["./src/*"]
```

Next.js가 tsconfig `paths`를 그대로 읽어 webpack alias로 쓰기 때문에 동작합니다. Vitest는 tsconfig를 읽지 않으므로 `vitest.config.mts`의 `resolve.alias`에도 같은 리다이렉트를 추가해야 합니다. Vitest alias 배열에서는 구체적인 경로를 범용 `@`보다 먼저 둡니다.

앰비언트 타입(`Nullable`, `Paging` 등)은 import 문이 없는 전역 선언이라 alias로 리다이렉트되지 않습니다 — 대신 `tsconfig.json`의 `include`에 패키지의 `@types/global.d.ts`를 직접 추가합니다.

```jsonc
// apps/{web,staff}/tsconfig.json
"include": [..., "../../packages/shopby-api/src/@types/global.d.ts"]
```

`scripts/check-fsd.mjs`(FSD lint)도 `@/shared/lib/*`, `@/shared/model/*` import를 파일시스템으로 직접 검증하므로, `packageRedirects` Set에 등록된 경로는 건너뛰도록 예외 처리되어 있습니다.

## 5. 새 앱(mall) 추가 체크리스트

`apps/staff`를 예시로 만들 때 사용한 순서입니다.

1. `apps/<name>`에 `package.json`(`@geek/shopby-api`, `@geek/utils`를 `workspace:*`로 의존), `tsconfig.json`(위 4번 paths 전체 복사), `vitest.config.mts`(테스트를 사용한다면 위 alias 전체 복사), `next.config.ts`(`transpilePackages: ['@geek/utils', '@geek/shopby-api']`), `eslint.config.mjs`, `scripts/check-fsd.mjs` 생성
2. `src/configs/env.ts` — `apps/web`과 동일한 Zod 스키마 복사 (앱마다 값이 다르므로 스키마 자체는 앱 소유)
3. `.env` — `NEXT_PUBLIC_CLIENT_ID`(필수, 몰마다 다름)를 채움
4. `src/configs/shopbyApi.ts` — 3번 env를 `configureShopbyApi()`에 매핑하고, 같은 도메인에서도 인증 쿠키가 충돌하지 않도록 `cookieNamespace`를 앱 고유 값으로 지정
5. `pages/_app.tsx` 최상단에서 `import '@/configs/shopbyApi'`
6. 루트 `package.json`에 `dev:<name>` / `build:<name>` / `start:<name>` / `typecheck:<name>` 스크립트 추가 (turbo는 workspace glob으로 자동 인식하므로 `pnpm dev`/`pnpm build`는 수정 불필요)
7. `pnpm install` 후 `pnpm --filter <name> typecheck`, `pnpm --filter <name> lint:fsd`로 확인

## 6. apps/staff 현재 상태

`package.json`/`tsconfig`/`vitest.config`/`next.config`/env 부트스트랩과, `@geek/shopby-api`를 그대로 재사용하는 `pages/index.tsx` 데모(`product.getBestSellerProducts()` 호출)까지만 있는 **스켈레톤**입니다.

아직 없는 것: `entities`/`features`/`widgets`/실제 페이지, 로그인/헤더/푸터 등 UI. `apps/web`의 어떤 레이어까지 `packages`로 더 뺄지(예: `packages/shopby-shared`로 `entities`/`features` 공유)는 실제 임직원몰 화면을 만들면서 결정해야 합니다.

`apps/staff/.env`의 `NEXT_PUBLIC_CLIENT_ID`는 `TODO_STAFF_CLIENT_ID` placeholder이므로, 실제 파트너센터에서 발급받은 값으로 교체해야 API 호출이 정상 동작합니다.
