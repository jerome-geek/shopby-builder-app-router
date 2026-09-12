# TODO

## 지금 막힌 것

- [ ] **Supabase 이메일 확인 링크 안 됨** — 기본 이메일 템플릿이 `{{ .ConfirmationURL }}`을 써서
      우리 앱 `/auth/confirm`이 아니라 Supabase 서버로 바로 감 → 세션 쿠키가 안 만들어짐.
      Supabase 대시보드 → Authentication → Email Templates → Confirm signup 에서
      `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard` 로 교체.
      Authentication → URL Configuration 에 Site URL / Redirect URLs도 admin 앱 주소로 맞출 것.
- [ ] 위 항목 고치면 `apps/admin/src/components/auth/LoginForm.tsx`의 하드코딩 프리필
      (`jerome@admin.local` / `qwer123!@#`) 제거. 계정 자체는 Supabase Admin API로 이미
      이메일 확인 완료 상태로 만들어둔 개발용 더미 계정.

## 참고 (해결됨, 기록용)

- [x] ~~Tenant.mallId~~ → `clientId`로 정정 (2026-09-07). ShopBy Shop API는 clientId 헤더 하나만
      필수로 씀, mallId라는 필드 자체가 실제 API에 없었음. base URL도 `api.shopby.co.kr` →
      `shop-api.shopby.co.kr`로 수정. `apiKey`는 지금 Shop API 조회에는 안 쓰이고, Server API
      (주문 처리 등) 연동할 때 쓸 시크릿으로 남겨둠 — 그때 실제 인증 방식 문서 다시 확인할 것.

## OpenSpec 잔여 작업 (align-multitenant-builder-architecture)

- [ ] 8.3 나머지: 프리뷰 vs Storefront 출력 비교 fixture, ProductList/CategoryNav 실제 서버 렌더 프리뷰
- [ ] 8.4: 테넌트별 Supabase Storage 정책 + 미디어 업로드/목록/선택/삭제
- [ ] 8.7: revalidation outbox 처리 워커 (apps/web에 아직 무효화할 캐시 없어서 우선순위 낮음)
- [ ] 8.9: e2e 테스트 (테스트 프레임워크 자체가 레포에 없음, 도입부터 필요)
- [ ] 섹션 1: 테넌트 라우팅/Proxy (apps/web)
- [ ] 섹션 4: ShopBy API 키 암호화
- [ ] 섹션 5: 구매자 세션 격리
- [ ] 섹션 6: Storefront 렌더링에서 페이지 정책 강제
- [ ] 섹션 9: 커스텀 도메인 라이프사이클
- [ ] 섹션 10~12: observability, cutover 등
