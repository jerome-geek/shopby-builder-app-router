# 🧱 Web FSD Convention

이 문서는 `apps/web`에서 사용하는 **FSD 구조 규칙**을 정의합니다.

> [!IMPORTANT]
> 이 프로젝트의 FSD는 일반적인 FSD를 그대로 복사한 형태가 아닙니다.
> 헤드리스 연동 구조(`api`, `models`, root query hooks)는 **전역 레이어로 유지**합니다.
> Shopby headless API 계약을 한곳에서 관리하는 이득이 더 크기 때문입니다.

> [!NOTE]
> **현재 마이그레이션 상태**
> `features`, `widgets`, `entities`의 slice는 표준 세그먼트(`ui`, `model`, `lib`, `api`)와 공개 API를 기준으로 구성한다.
> `shared/*` 하위 일부 폴더(예: `shared/button/DefaultButton`)는 4-6 네이밍 규칙 적용 이전의 PascalCase 레거시다. 신규 폴더부터 kebab-case를 적용하고, 기존 폴더는 해당 영역을 다룰 때 함께 정리한다.

---

## 1. 목표

- **도메인 소유권을 명확하게 만든다**
- **UI / 기능 / 도메인 / 공용 코드의 경계를 분리한다**
- **재사용되는 복합 페이지 섹션을 `widgets`로 명시적으로 분리한다**
- **앱 진입/초기화 관심사를 `providers` 등 비예약 경로로 분리해 `pages`를 라우트 엔트리로만 남긴다**
- **헤드리스 API 연동 구조는 유지하면서도 화면 구조는 FSD로 정리한다**

---

## 2. 기본 레이어

`apps/web/src`의 기본 레이어는 아래와 같다.

```text
providers
pages
widgets
features
entities
shared
```

각 레이어의 책임은 다음과 같다.

### 2-1. `providers` (Next.js Pages Router 앱 초기화)

- 전역 Provider 조합
- 앱 전체에 한 번만 존재하는 초기화 설정

> [!IMPORTANT]
> FSD의 `app` 레이어가 표현하는 앱 초기화 관심사는 유지한다. 다만 이 프로젝트는 **Next.js Pages Router**를 사용하므로 `src/app`은 사용하지 않는다. Next.js가 `src/app`을 App Router 디렉터리로 인식해 Pages Router와 혼용할 수 있으며, Vanilla Extract 개발 CSS 로딩에도 영향을 줄 수 있다. 전역 Provider는 `src/providers`에 두고, 초기화 코드는 `src/configs`, `src/styles` 등 역할에 맞는 **비예약 경로**에 둔다.

`providers`에는 `pages`, `features`, `entities`, `shared`가 가지지 않는 **앱 전체에 한 번만 존재하는 Provider 조합**만 둔다. 라우트별 로직은 두지 않는다.

예시:

- `providers/app-providers.tsx`
- `configs/shopbyApi.ts`
- `styles/global.css.ts`

### 2-2. `pages`

- 라우트 엔트리
- 페이지 레벨 SEO
- `widgets`와 `features`를 조합해 최종 화면을 완성

> [!NOTE]
> SSR / SSG / ISR 연결은 **Next.js를 사용하는 경우에만** 해당한다.
> React(Vite, CRA 등) SPA 구조에서는 `pages`가 클라이언트 라우터(React Router 등)에 매핑되는 라우트 컴포넌트 역할을 하며, SSR/SSG/ISR이 없다.

`pages`는 **조립만** 담당한다. 상세 UI/로직을 직접 들고 있지 않는다.

### 2-3. `widgets`

- 여러 `features`/`entities`를 조합한 **재사용 가능한 페이지 섹션**
- 특정 라우트에 종속되지 않고 두 곳 이상에서 쓰이는 복합 UI 블록

도입 기준:

- 동일하거나 유사한 페이지 섹션이 **2개 이상의 `pages`에서 반복**될 때
- 단일 페이지에서만 쓰이는 섹션은 `widgets`로 올리지 않고 해당 `pages/<route>/ui`에 둔다

예시 (후보):

- `widgets/header`
- `widgets/footer`
- `widgets/product-recommendation`

> [!CAUTION]
> `entities`의 승격 타이밍 규칙과 동일한 원칙을 적용한다.
> **두 번째 소비자가 생기는 시점에** `widgets`로 올린다. 미래를 예측해서 미리 올리지 않는다.

### 2-4. `features`

- 사용자 행동 단위 기능
- 화면 플로우
- 폼/오버레이/필터/정렬/입력 흐름
- 특정 유스케이스를 완성하는 컴포넌트/훅/유틸

예시:

- `features/order`
- `features/mypage`
- `features/search`
- `features/recipe`

### 2-5. `entities`

- 도메인 개념 자체
- 재사용 가능한 도메인 UI/훅/스키마/유틸
- 여러 feature에서 공통으로 소비되는 도메인 조각

예시:

- `entities/product`
- `entities/order`
- `entities/banner`
- `entities/product-inquiry`

### 2-6. `shared`

- 도메인 비의존 공용 UI
- 공용 레이아웃
- 공용 유틸
- 공용 오버레이 셸

`shared`는 slice가 없고 **세그먼트 단위**로 직접 폴더를 나눈다. 표준 세그먼트(`ui`, `lib`, `model`, `api`)를 기본으로 하되, 역할이 명확한 경우 커스텀 세그먼트(`boundary`, `overlay`, `config` 등)를 허용한다.

예시:

- `shared/ui` — 공용 컴포넌트 (버튼, 인풋, 레이아웃 등)
- `shared/lib` — 공용 유틸리티, 헬퍼
- `shared/boundary` — 에러/비동기 바운더리
- `shared/overlay` — 공용 오버레이 셸
- `shared/config` — 공용 설정값

---

## 3. 예외 규칙 (전역 유지 계층)

일반적인 FSD와 다르게, 이 프로젝트는 아래 레이어를 **전역 유지**한다.

### 3-1. `api/*`는 유지

`apps/web/src/api/*`는 헤드리스 연동 계층으로 유지한다.

이유:

- 외부 API 계약을 한곳에서 본다
- 백엔드 연동 구조를 기능 구조와 분리한다
- API 변경 대응 비용을 줄인다

허용:

- `api/product`
- `api/order`
- `api/display`
- `api/core`

**`entities/*/api`는 아래 조건을 모두 만족할 때만 허용한다:**

- 해당 entities slice 내부에서만 사용되는 API 호출이다
- 외부 API 계약이 아닌 slice 전용 얇은 adapter 성격이다
- 루트 `api/`에 추가하면 오히려 응집도가 떨어지는 경우다

그 외에는 루트 `api/`에 둔다.

### 3-2. `models/*`는 유지

`apps/web/src/models/*`는 헤드리스 타입 계층으로 유지한다.

이유:

- API 응답/요청 타입을 한곳에서 관리한다
- DTO 성격의 타입을 기능 구조와 분리한다

즉, 모든 타입 파일을 `entities/*/model`로 무조건 이동하지 않는다.

### 3-3. 루트 query hooks는 유지

아래 트리는 기본적으로 유지한다.

- `hooks/query/*`
- `hooks/suspenseQuery/*`
- `hooks/infiniteQuery/*`

이유:

- API 래퍼 훅 계층으로 이미 팀 규칙이 잡혀 있음
- 연동성 높은 query 훅을 무리하게 slice 내부로 넣으면 복잡도가 증가함

> [!CAUTION]
> 훅이라고 해서 무조건 옮기지 않는다.
> **API 조회 래퍼**, **얇은 adapter**, **비즈니스 로직이 거의 없는 훅**은 기존 위치 유지가 우선이다.

---

## 4. 폴더 배치 규칙

### 4-1. 공용 UI는 `shared`

도메인에 종속되지 않으면 `shared`에 둔다.

예시:

- `shared/ui/button`
- `shared/ui/input`
- `shared/ui/form`
- `shared/ui/icons`
- `shared/ui/layout`

### 4-2. 사용자 행동 단위는 `features`

유저 액션/플로우/폼/오버레이는 `features`가 기본 위치다.

예시:

- `features/order/lib/payment.ts`
- `features/search/model/constants.ts`
- `features/member/model/login-schema.ts`
- `features/recipe/model/form-schema.ts`

### 4-3. 재사용 도메인 조각은 `entities`

두 개 이상의 feature나 page에서 재사용되는 도메인 단위 조각이면 `entities`를 우선 검토한다.

예시:

- `entities/product/model/constants.ts`
- `entities/product/lib/selection.ts`
- `entities/order/model/payment-schema.ts`
- `entities/banner/lib/utils.ts`

**entities 승격 타이밍**: 처음에는 `features` 안에 두고, **두 번째 소비자가 생기는 시점에 `entities`로 올린다.** 미래를 예측해서 미리 올리지 않는다.

### 4-4. 복합 페이지 섹션은 `widgets`

판단 순서:

1. 이 UI가 여러 `features`/`entities`를 조합하는가? → 아니면 `entities/ui` 또는 `features/*/ui` 검토
2. 조합한 결과물이 **2개 이상의 `pages`에서 재사용**되는가? → 아니면 해당 `pages/<route>/ui`에 둔다
3. 둘 다 맞으면 `widgets/<섹션명>`

### 4-5. slice 내부 폴더 구조 (segments)

slice 내부는 FSD 공식 4대 표준 세그먼트(Standard Segments)를 기준으로 구성합니다. 폴더명은 일관성을 위해 모두 **단수형**으로 작성합니다. 모든 세그먼트가 항상 필요한 것은 아니며, 실제로 파일이 존재하는 경우에만 생성합니다.

#### FSD 표준 세그먼트 종류와 역할

- **`ui`**: 화면 렌더링에 필요한 모든 컴포넌트, 스타일, 이미지 파일
  - 예시: `entities/product/ui/product-card.tsx`
- **`model`**: 도메인의 비즈니스 로직, 상태(Store), 타입 정의, 비즈니스 상수가 위치하는 영역
  - 예시: `entities/product/model/types.ts`
- **`lib`**: 비즈니스 로직을 보조하거나 외부 인프라/SDK와 결합되는 커스텀 훅 및 헬퍼 함수
  - 예시: `entities/product/lib/external-landing.ts`
  - _참고 (`utils` vs `lib`)_: 도메인과 라이브러리에 무관한 완전히 순수하고 범용적인 유틸리티는 전역 `shared/lib`에 배치하고, 특정 도메인 지식에 종속적이거나 기술적으로 결합된 보조 코드는 슬라이스 내의 `lib`에 둡니다.
- **`api`**: 서버와의 데이터 통신을 위한 요청 함수 및 관련 설정 (필요 시에만 제한적으로 사용, 규칙 3-1 참조)

#### slice 구조 예시

```text
features/order/          entities/product/
  ├── ui/                  ├── ui/           ← 재사용 도메인 UI
  ├── model/               ├── model/        ← 도메인 상태, 타입, 비즈니스 상수
  ├── lib/                 ├── lib/          ← 도메인 보조 헬퍼, 유틸
  └── index.ts             └── index.ts      ← public API (외부 노출 진입점)
```

> [!IMPORTANT]
> **Public API Entry Point (`index.ts`)**
> 각 slice(예: `entities/product`)는 반드시 폴더 루트에 `index.ts`를 작성해야 합니다. slice 내부의 다른 파일들(`ui/`, `model/`, `lib/` 등)을 외부로 노출할 때는 무조건 이 `index.ts`를 통해서만 export(re-export)해야 하며, 외부에서는 slice 내부 경로를 직접 import(Deep Import)하지 않아야 합니다.
>
> - **올바른 예**: `import { checkIsExternalLanding } from '@/entities/product';`
> - **잘못된 예**: `import { checkIsExternalLanding } from '@/entities/product/lib';`

> [!CAUTION]
> **커스텀 세그먼트 금지**
> slice(`entities`, `features`, `widgets`) 내부에서는 표준 4세그먼트(`ui`, `model`, `lib`, `api`) 외의 커스텀 폴더(`utils`, `constants`, `schema`, `store`, `components`, `context` 등)를 만들지 않는다.
>
> - `utils`, `helpers` → `lib`에 배치
> - `constants`, `schema`, `store`(상태) → `model`에 배치
> - `components` → `ui`에 배치
> - `context` → `lib`에 배치
>
> 단, `shared` 레이어는 slice가 없으므로 역할이 명확한 커스텀 세그먼트를 허용한다(섹션 2-6 참고).

#### Export 컨벤션 (Default & Named Export 조합)

성능 최적화(트리쉐이킹)와 일관된 Public API 캡슐화를 위해 아래 규칙을 따른다.

**[Step 1] 개별 파일: Default Export**

파일당 하나의 주요 대상(컴포넌트, 주요 함수 등)을 내보내는 파일에서는 **Default Export**를 사용한다.

```tsx
// entities/product/ui/product-card.tsx
const ProductCard = () => { ... };

export default ProductCard;
```

> [!NOTE]
> 여러 항목을 내보내는 파일(상수 모음, 타입 정의 등)은 Named Export를 사용해도 된다.

**[Step 2] 슬라이스 진입점: Named Re-export**

슬라이스의 `index.ts`에서는 내부 파일들을 **Named Export**로 묶어 외부에 노출한다.

```typescript
// entities/product/index.ts
export { default as ProductCard } from "./ui/product-card";
export { PRODUCT_STATUS } from "./model/constants";
```

### 4-6. 컴포넌트 네이밍 규칙

- **컴포넌트 export 이름**: `PascalCase`
- **컴포넌트 폴더 이름**: `kebab-case`
- **컴포넌트 파일 이름**: `kebab-case`
- **진입 파일**: 필요 시 `index.tsx` 사용 가능
- **라우트 세그먼트 폴더 이름**: `kebab-case`

예시:

```tsx
// entities/product/ui/product-card.tsx (파일명: kebab-case)
const ProductCard = () => {
  // export명: PascalCase
  return <div />;
};

export default ProductCard;
```

```tsx
// entities/product/ui/product-card/skeleton.tsx (하위 컴포넌트)
const ProductCardSkeleton = () => {
  return <div />;
};

export default ProductCardSkeleton;
```

> [!NOTE]
> React는 컴포넌트 식별자를 `PascalCase`로 사용하고, Next.js 문서 예시는 파일명을 `kebab-case`로 자주 사용한다. 이 프로젝트는 두 기준이 충돌하지 않도록 **컴포넌트 이름은 `PascalCase`, 파일/폴더 이름은 `kebab-case`** 로 맞춘다.

### 4-7. 오버레이는 "기능"과 "셸"을 분리

오버레이 구조는 아래처럼 본다.

- 기능 로직/컨텐츠: `features/*/ui/overlay/` (slice 내 `ui` 세그먼트 하위)
- 완전 공용 셸/공용 컨텐츠: `shared/overlay/`

예시:

- `features/order/ui/overlay/`
- `features/mypage/ui/overlay/`
- `shared/overlay/address-search`
- `shared/overlay/image-detail`

---

## 5. 남겨도 되는 루트 버킷

### 유지 대상

| 경로                                                        | 유지 이유                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `providers`                                                 | 전역 Provider 조합 — 섹션 2-1 참고. Next.js Pages Router에서는 `src/app` 대신 사용                                                                                      |
| `api`                                                       | 헤드리스 연동 계층 — 섹션 3-1 참고                                                                                                                                       |
| `models`                                                    | DTO 타입 계층 — 섹션 3-2 참고                                                                                                                                            |
| `hooks/query`, `hooks/suspenseQuery`, `hooks/infiniteQuery` | API 래퍼 훅 계층 — 섹션 3-3 참고                                                                                                                                         |
| `shared`                                                    | FSD 공용 레이어                                                                                                                                                          |
| `pages`                                                     | 라우트 엔트리 — Next.js Pages Router의 파일 시스템 라우팅, React(Vite 등) SPA의 React Router 등 클라이언트 라우터 컴포넌트                                                |
| `configs`                                                   | 환경별 설정값                                                                                                                                                            |
| `assets`                                                    | 정적 자산                                                                                                                                                                |
| `styles`                                                    | 전역 CSS / 테마 토큰                                                                                                                                                     |
| `i18n`                                                      | 다국어 리소스                                                                                                                                                            |
| `@types`                                                    | 전역 ambient 타입 선언(`global.d.ts`, `window.d.ts` 등) — `models`와 같은 이유로 전역 유지. 특정 도메인에 속하지 않는 TS 전역 스코프 확장이라 slice로 옮길 대상이 아니다 |

### 정리 대상

아래는 "코드 종류별 전역 버킷"이므로 우선적으로 줄인다.

> [!TIP]
> 이동 전 "이 코드의 소비자가 단일 feature인가, 여러 feature인가?"를 먼저 판단한다.

| 정리 대상                  | 단일 feature 소유                                    | 공용            |
| -------------------------- | ---------------------------------------------------- | --------------- |
| `components/*`             | `features/*/ui` 또는 `entities/*/ui`                 | `shared/ui`     |
| `context/*`                | `features/*/lib` 또는 `entities/*/lib`               | `shared/lib`    |
| `state/*` (zustand 스토어) | `features/*/model` 또는 `entities/*/model`           | `shared/lib`    |
| `schema/*`                 | `features/*/model` 또는 `entities/*/model`           | `shared/model`  |
| `helpers/*`, `utils/*`     | `features/*/lib` 또는 `entities/*/lib`               | `shared/lib`    |
| `const/*`                  | `features/*/model` 또는 `entities/*/model`           | `shared/model`  |
| `providers/*`              | —                                                    | `providers`     |
| `services/*`               | `features/*` 또는 `entities/*` (추후 일괄 이동 예정) | —               |

> [!NOTE]
> `helpers`와 `utils`는 구분하지 않는다. slice 내부로 이동 시 표준 세그먼트인 `lib`에 배치한다. `shared` 레이어로 이동 시에는 `shared/lib`에 둔다.

> [!NOTE]
> `state/*`는 "store" 종류 버킷이지만, 단순 레거시가 아니라 **현재 사용 중인 zustand 스토어 계층**이다. 삭제 대상이 아니라 이동(소유 도메인별 slice의 `model` 세그먼트로 분리) 대상이다.

---

## 6. Import 규칙

### 6-1. 절대경로 import 사용

`apps/web/src` 내부 import는 기본적으로 절대경로 alias를 사용한다.

```ts
// ❌ BAD
import { toSelectedOption } from "../selection";

// ✅ GOOD
import { toSelectedOption } from "@/entities/product";
```

### 6-2. 상대경로는 예외적으로만 허용

아래 경우만 상대경로를 허용한다.

- **`index.ts`에서 내부 모듈을 re-export하는 경우** (Public API 배럴 파일)
- 같은 폴더의 `index.css.ts`
- 같은 폴더의 아주 얕은 UI 구현 파일
- 테스트 파일에서 동일 폴더 fixture를 짧게 참조하는 경우

그 외에는 기본적으로 절대경로를 사용한다.

> [!IMPORTANT]
> **`index.ts` 배럴 파일에서 상대경로를 쓰는 이유**
>
> - **이동 안전성**: slice/세그먼트 폴더를 통째로 옮길 때 index.ts 내부를 수정할 필요가 없다. 외부 import 경로만 바꾸면 된다.
> - **캡슐화 경계 명시**: 상대경로는 "이 안의 파일은 내 소유물"이라는 의미를 코드 레벨에서 드러낸다. 절대경로를 쓰면 외부 모듈을 가져다 쓰는 것처럼 보여 경계가 흐려진다.
> - **순환 참조 방지**: index.ts에서 자기 slice의 절대경로(`@/entities/product/...`)를 쓰면, 번들러/TS resolver가 자기 자신의 index.ts를 다시 거치는 순환 참조가 발생할 수 있다.

```ts
// ✅ GOOD — index.ts에서 상대경로 re-export
export { default as ProductCard } from "./ui/product-card";
export { PRODUCT_STATUS } from "./model/constants";

// ❌ BAD — index.ts에서 절대경로 re-export
export { default as ProductCard } from "@/entities/product/ui/product-card";
```

### 6-3. slice 내부 파일은 index.ts를 통해서만 외부에 노출

slice 외부에서는 반드시 해당 slice의 `index.ts`(public API)를 통해 접근한다. slice 내부 파일 경로를 직접 참조하지 않는다.

```ts
// ❌ BAD
import { payment } from "@/features/order/lib/payment";

// ✅ GOOD
import { payment } from "@/features/order";
```

단, **동일 slice 내부**에서는 파일 간 직접 참조가 허용된다.

### 6-4. 배럴은 호환 목적일 때만 유지

레거시 경로를 완전히 제거하기 전, 일시적으로 `index.ts` 배럴을 둘 수 있다.

원칙:

- 신규 코드는 새 경로를 직접 바라본다
- 배럴은 마이그레이션 종료 후 제거한다

### 6-5. 대형 배럴 파일 금지

`src/shared/index.ts`와 같이 여러 세그먼트를 한 번에 크게 묶는 대형 배럴 파일은 절대 만들지 않는다. (트리쉐이킹 실패 및 빌드 저하 유발)

`index.ts` 내에는 로직 코드를 작성하지 않고 오직 export 맵핑 구문만 포함한다.

```ts
// ✅ GOOD — export 맵핑만
export { default as ProductCard } from "./ui/product-card";
export { PRODUCT_STATUS } from "./model/constants";

// ❌ BAD — 로직 코드 포함
export const formatPrice = (price: number) => `${price.toLocaleString()}원`;
```

---

## 7. 주석 규칙

파일 이동/리팩토링 시 **기존 설명 주석은 보존**한다.

특히 아래는 삭제하지 않는다.

- 도메인 설명 주석
- 유틸 함수 설명 주석
- 타입/스키마 의도 설명 주석
- 예외 처리 이유를 설명하는 주석

> [!CAUTION]
> 리팩토링은 파일 위치를 바꾸는 작업이지, 문맥을 지우는 작업이 아니다.
> 코드 의미를 설명하는 주석은 가능한 한 유지한다.

---

## 8. 테스트 파일 위치

테스트 파일은 **테스트 대상 파일과 같은 폴더의 `__tests__/` 하위 폴더**에 배치한다.

```text
features/order/lib/payment.ts
features/order/lib/__tests__/payment.test.ts

entities/product/lib/selection.ts
entities/product/lib/__tests__/selection.test.ts
```

이유:

- 대상 파일과 테스트 파일을 동시에 찾기 쉽다 (같은 폴더 하위에 있음)
- 파일 이동 시 테스트도 함께 이동된다
- 실제 코드 폴더(`utils`, `hooks` 등)를 열었을 때 테스트 파일이 섞이지 않고 분리된다

**루트 레벨의 전역 `__tests__/`(예: `src/__tests__/`)는 사용하지 않는다.** `__tests__/`는 항상 테스트 대상 파일이 있는 폴더 바로 아래, 그 폴더 범위 안에서만 존재한다.

테스트 파일 확장자는 `.test.ts` / `.test.tsx`를 사용한다.

---

## 9. 레이어별 의존성 방향

의존성은 기본적으로 아래 방향을 따른다.

```text
[저수준]  shared - entities - features - widgets - pages  [고수준]
```

> [!NOTE]
> 위 표기는 "레이어가 쌓이는 순서"이며 import 방향이 아니다.
> 실제 import는 항상 **고수준 → 저수준** 한 방향으로만 허용된다. `pages → widgets → features → entities → shared` 순서로만 import가 가능하다. `providers`는 `_app.tsx`에서 사용하는 전역 초기화 경계이며, 필요한 하위 레이어의 Provider를 조합할 수 있다.

추가 규칙:

- `shared`는 상위 레이어를 import 하지 않는다
- `entities`는 가능하면 `features`/`widgets`를 import 하지 않는다
- `features`는 여러 `entities`를 조합할 수 있다
- `widgets`는 여러 `features`/`entities`를 조합할 수 있지만 `pages`를 import 하지 않는다
- `pages`는 `widgets`와 `features`를 조합만 한다
- `providers`는 전역 Provider를 조합하며, `_app.tsx`에서만 진입한다
- **같은 레이어 내 slice 간 의존성은 금지한다**

```ts
// ❌ BAD — entities 내 slice 간 cross-import
import { something } from "@/entities/order"; // from entities/product 내부

// ❌ BAD — features 내 slice 간 cross-import
import { something } from "@/features/search"; // from features/order 내부
```

같은 레이어에서 공통으로 필요한 코드는 하위 레이어(`shared` 또는 `entities`)로 내린다.

예외:

- `api`/`models`/root query hooks는 전역 계층으로 유지하므로 이 의존성 방향 규칙의 적용 대상이 아니다.

---

## 10. 신규 코드 작성 기준

새 파일을 만들 때는 아래 순서대로 위치를 판단한다.

1. 이 코드가 완전 공용인가? → `shared`
2. 특정 도메인 개념인가? → `entities`
3. 특정 사용자 행동/기능 흐름인가? → `features`
4. 2개 이상의 페이지에서 재사용되는 복합 섹션인가? → `widgets`
5. 라우트 진입/페이지 조립인가? → `pages`
6. 전역 Provider 조합인가? → `providers` (Next.js Pages Router에서는 `src/app` 금지)
7. 외부 API 연동인가? → `api`
8. DTO 타입인가? → `models`
9. 서버 상태 조회 래퍼 훅인가? → `hooks/query`, `hooks/suspenseQuery`, `hooks/infiniteQuery`

---

## 11. 실제 예시

### 예시 A: 상품 옵션 선택 데이터 변환

- 위치: `entities/product/lib/selection.ts`
- 이유: 상품 도메인에 속하고 여러 소비처에서 재사용 가능

### 예시 B: 주문 결제 SDK 유틸

- 위치: `features/order/lib/payment.ts`
- 이유: 주문 기능 흐름에 강하게 결합됨

### 예시 C: 검색 탭 상수

- 위치: `features/search/model/constants.ts`
- 이유: 검색 기능 화면과 흐름에 직접 종속되는 비즈니스 상수

### 예시 D: 공용 버튼

- 위치: `shared/ui/button`
- 이유: 도메인 비의존 공용 UI

### 예시 E: 회원가입 스키마

- 위치: `features/member/model/signup-schema.ts`
- 이유: 회원가입 플로우 소유

### 예시 F: 헤더/푸터 (2개 이상 페이지에서 재사용)

- 위치: `widgets/header`, `widgets/footer`
- 이유: 여러 pages에서 재사용되는 복합 UI 블록

### 예시 G: 전역 Provider

- 위치: `providers/app-providers.tsx`
- 이유: 앱 전역에 한 번만 존재하는 Provider 조합이며, Next.js 예약 경로인 `src/app`을 피한다

---

## 12. 리팩토링 체크리스트

구조 리팩토링 시 아래를 확인한다.

```text
[ ] 이 파일이 공용인지, 도메인 소유인지 먼저 판단했는가?
[ ] api / models / root query hooks는 유지 규칙을 따랐는가?
[ ] slice 내부 폴더가 표준 세그먼트(ui, model, lib, api)만 사용하는가?
[ ] 개별 파일은 default export, index.ts는 named re-export를 따르는가?
[ ] 새 파일의 import는 절대경로 alias를 사용했는가?
[ ] 이동 전 설명 주석을 보존했는가?
[ ] 레거시 경로 참조를 모두 새 경로로 바꿨는가?
[ ] 같은 레이어 내 slice 간 cross-import가 없는가?
[ ] slice 외부에서 참조할 때 index.ts를 통하는가?
[ ] 테스트 파일이 대상 파일과 같은 폴더의 `__tests__/` 하위에 있는가?
[ ] 대형 배럴 파일(여러 세그먼트를 한 번에 묶는 index.ts)을 만들지 않았는가?
[ ] 실제 프로덕션 빌드 기준으로 빌드 확인을 했는가? (Next.js: `next build --webpack`, React/Vite 기반: `package.json`의 build 스크립트 기준으로 확인)
```

---

## 13. 한 줄 요약

- **전역 Provider 조합은 `providers`로 (`src/app`은 사용하지 않음)**
- **화면과 기능은 `features`로**
- **도메인 조각은 `entities`로**
- **2곳 이상 재사용 복합 섹션은 `widgets`로**
- **공용 UI는 `shared`로**
- **헤드리스 연동 계층인 `api`, `models`, root query hooks는 유지**
- **slice 내부는 표준 세그먼트(`ui`, `model`, `lib`, `api`)만 사용**
- **개별 파일은 default export → index.ts에서 named re-export**
- **대형 배럴 파일 금지**
- **새 import는 기본적으로 절대경로**
- **리팩토링 시 주석은 보존**
