# Supabase 프로젝트 설정

Admin 인증(Supabase Auth)과 Postgres DB(Prisma)를 위해 Supabase 프로젝트 하나를 공유해서 씁니다.

## 1. 프로젝트 생성

1. [supabase.com/dashboard](https://supabase.com/dashboard) → 로그인 → **New project**
2. 입력값:
   - **Name**: 자유 (예: `shopby-builder`)
   - **Database Password**: "Generate a password"로 자동 생성 추천 — DB 연결 문자열에 필요하니 꼭 보관
   - **Region**: 한국 기준 Northeast Asia (Seoul/Tokyo) 계열
   - Plan: Free
3. **Create new project** → 프로비저닝 2분 정도 대기

## 2. API 키 (Project Settings → API)

Supabase는 2025년부터 새 키 체계를 씁니다. **legacy `anon`/`service_role` 키는 2026년 말 폐지 예정**이므로 새 방식을 씁니다.

| 용도 | 접두사 | 안전하게 노출 가능? |
| --- | --- | --- |
| Publishable key (구 anon) | `sb_publishable_...` | O — 클라이언트에 노출돼도 됨 (RLS가 막아줌) |
| Secret key (구 service_role) | `sb_secret_...` | X — 서버 전용, RLS 우회함, 절대 클라이언트 노출 금지 |

## 3. DB 연결 문자열 (Connect 버튼)

- 대시보드 상단 **Connect** 버튼 → Direct connection / **Session pooler** / Transaction pooler 중 선택
- **Session pooler**를 씁니다:
  - Direct connection은 **IPv6 전용**이라 대부분의 로컬/가정 네트워크에서 연결 타임아웃이 남
  - Session pooler는 IPv4 지원 + Prisma가 필요로 하는 prepared statement도 지원 (Transaction pooler는 prepared statement 미지원이라 Prisma랑 안 맞음)
- 복사한 URI에서 `[YOUR-PASSWORD]`를 1번에서 만든 DB 비밀번호로 교체

### ⚠️ 비밀번호에 특수문자가 있으면 URL 인코딩 필수

DB 비밀번호에 `?`, `/`, `#`, `@`, `%` 같은 문자가 들어있으면 connection URI에서 다른 의미로 해석돼 깨집니다 (`?`=쿼리스트링 시작, `/`=경로 구분자 등). 반드시 percent-encoding 해서 넣어야 합니다.

예: 비밀번호가 `3Wv?Er-2UJm_/5r`라면 → `3Wv%3FEr-2UJm_%2F5r`로 바꿔서 넣기.

## 4. 값 채워 넣는 위치

같은 `DATABASE_URL`을 아래 세 곳에 전부 넣어야 합니다 (Next.js는 앱별로 자기 디렉터리의 env 파일만 읽고, Prisma CLI는 `packages/database`에서 실행되므로 그 자리에도 필요):

| 파일 | 필요한 값 |
| --- | --- |
| `apps/admin/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL` |
| `apps/web/.env.local` | `DATABASE_URL` |
| `packages/database/.env` | `DATABASE_URL` (Prisma CLI가 `db:generate`/마이그레이션/시드 실행할 때 읽음) |

이 파일들은 전부 루트 `.gitignore`의 `.env*` 규칙에 걸려서 커밋되지 않습니다.

## 5. 마이그레이션 실행

```bash
cd packages/database
pnpm db:generate   # Prisma Client 생성
pnpm exec prisma migrate dev --name init   # 스키마를 실제 DB에 반영
pnpm db:seed       # 샘플 테넌트/페이지 생성
```

### 겪었던 이슈들

- **`prisma db seed`가 아무것도 안 하고 조용히 끝남**: `package.json`에 `"prisma": {"seed": "..."}` 설정이 없으면 실행할 스크립트를 몰라서 no-op으로 끝남 (에러도 안 남). `packages/database/package.json`에 `tsx prisma/seed.ts`로 설정해뒀음.
- **`Error P3019: provider ... does not match migration_lock.toml`**: 예전에 sqlite 기준으로 만든 `prisma/migrations/` 폴더가 남아있으면 지금 스키마(postgresql)랑 충돌함. 저장된 데이터가 없는 새 DB라면 `migrations/` 폴더 지우고 다시 `migrate dev`.

## 6. Admin에서 Prisma 클라이언트 쓰는 법

`@repo/database`가 공유 Prisma 싱글턴(`prisma`)을 export합니다. Admin의 Server Component에서:

```ts
import { prisma } from '@repo/database'

const tenants = await prisma.tenant.findMany()
```

`DATABASE_URL`만 채워져 있으면 `apps/admin`, `apps/web` 어디서든 동일하게 동작합니다.
