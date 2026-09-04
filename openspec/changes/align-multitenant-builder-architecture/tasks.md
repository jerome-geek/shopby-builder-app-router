## 1. Baseline and architecture decisions

- [ ] 1.1 Capture current route, API, schema, seed, environment-variable, and deployment behavior in executable baseline tests or fixtures
- [ ] 1.2 Read the repository's installed Next.js 16 guides for Proxy, request headers, cookies, Server Actions, Route Handlers, and cache revalidation before implementing those areas
- [ ] 1.3 Decide and document the production encryption provider, key ownership, rotation cadence, and local-development fallback
- [ ] 1.4 Decide and document cache tag/path strategy, domain verification polling/webhook strategy, and Admin cutover approach
- [ ] 1.5 Define feature flags and rollout order for schema v1, tenant routing, restricted proxy, Next.js Admin, and custom domains

## 2. Database foundations and additive migration

- [x] 2.1 Extend Prisma models for administrator-to-tenant membership and ownership authorization
- [x] 2.2 Add `PageRevision`, active revision reference, and publish/revalidation outbox models with indexes and constraints
- [x] 2.3 Add `TenantDomain` with normalized hostname, type, provider metadata, lifecycle status, timestamps, and uniqueness constraints
- [x] 2.4 Add versioned encrypted ShopBy credential fields without removing the legacy plaintext field
- [x] 2.5 Generate and review an additive PostgreSQL migration that preserves all existing tenant and page data
- [ ] 2.6 Update seed data to use native versioned PageSchema objects and safe development-only credential handling
- [ ] 2.7 Add DB constraint and integration tests for tenant/page/domain uniqueness, ownership relations, cascade behavior, and revision immutability

## 3. PageSchema contract and data migration

- [x] 3.1 Define the `{ schemaVersion, blocks }` envelope and discriminated block validators in `packages/types`
- [x] 3.2 Add page-type-aware schema validation that enforces block props, ordering, asset references, slots, and required system regions
- [x] 3.3 Implement deterministic sequential PageSchema migration functions with fixture tests for every supported version transition
- [ ] 3.4 Implement a dry-run command that inventories valid, migratable, and quarantined legacy draft/published records without writing
- [ ] 3.5 Implement the idempotent legacy JSON-string to native JSON-object backfill with per-record result reporting
- [ ] 3.6 Add dual-read compatibility for legacy records and enforce latest-version-only writes behind the schema feature flag
- [ ] 3.7 Add Storefront fail-closed rendering and non-sensitive diagnostics for invalid or unsupported schemas

## 4. Tenant routing and trust boundary

- [ ] 4.1 Implement hostname normalization covering case, ports, trailing dots, platform subdomains, reserved names, and custom domains
- [ ] 4.2 Add the `apps/web` Next.js Proxy entry point and forward the canonical tenant identifier through downstream request headers
- [ ] 4.3 Strip client-supplied internal tenant headers and add tests proving header, query, and body spoofing cannot switch tenants
- [ ] 4.4 Implement a server-only tenant context resolver with indexed subdomain/custom-domain lookup and verified-domain enforcement
- [ ] 4.5 Update Storefront pages and all Route Handlers to consume only the server-owned tenant context
- [ ] 4.6 Add tests for platform root, Admin/reserved host, unknown host, malformed host, platform tenant, and verified custom-domain requests
- [ ] 4.7 Correct local root-domain and port configuration and add documented local subdomain test coverage

## 5. ShopBy credential and proxy security

- [ ] 5.1 Implement an authenticated-encryption credential service with ciphertext envelope, nonce, key version, and redacted error types
- [ ] 5.2 Add credential create/read/rotate tests proving plaintext never appears in persisted rows, responses, logs, metrics, or snapshots
- [ ] 5.3 Implement an idempotent credential encryption backfill and verify all tenants before disabling legacy plaintext reads
- [ ] 5.4 Replace arbitrary ShopBy path forwarding with a typed capability registry of allowed endpoint patterns, methods, and request schemas
- [ ] 5.5 Strip untrusted authorization, mall, forwarding, and hop-by-hop headers and inject only server-owned tenant credentials
- [ ] 5.6 Add administrator/buyer authorization checks for sensitive capabilities and tenant-aware rate-limit hooks
- [ ] 5.7 Add upstream timeout, bounded retry, sanitized error mapping, audit events, and tests for disallowed paths and header injection

## 6. Buyer session isolation

- [ ] 6.1 Define host-only AccessToken and GuestToken cookie names, attributes, expiration, SameSite, and local-development behavior
- [ ] 6.2 Implement server-only token issue, read, refresh, and clear helpers bound to tenant context
- [ ] 6.3 Add CSRF validation for every cookie-authenticated state-changing ShopBy operation
- [ ] 6.4 Integrate buyer tokens with only the approved ShopBy capabilities and prevent token values from reaching client JavaScript
- [ ] 6.5 Clear session cookies on logout, expiration, invalid refresh, credential revocation, and tenant-binding mismatch
- [ ] 6.6 Add cross-subdomain, cross-custom-domain, replay, CSRF, logout, and refresh-failure integration tests

## 7. Next.js Admin foundation

- [x] 7.1 Replace the Vite Admin scaffold with a Next.js App Router application while preserving the dashboard route contract
- [x] 7.2 Configure Supabase server/browser clients and secure cookie-based Admin authentication
- [x] 7.3 Implement login, signup, callback, logout, and protected-route flows with authentication tests (flows implemented and verified end-to-end against the real Supabase project — create user, sign in, getClaims, proxy redirect; no automated test suite since this repo has no test framework yet)
- [x] 7.4 Implement a reusable server authorization layer for tenant membership and apply it to every Admin read/write entry point (`lib/auth.ts`: `requireAdministrator` provisions the Administrator row on first authenticated request since there's no signup webhook; `requireTenantMembership`/inline membership-filtered queries applied to both current read entry points — dashboard tenant list, page editor. No write entry points exist yet, that's 7.5)
- [x] 7.5 Implement tenant list/create/update/archive and page list/create/update/archive operations with validation (Server Actions in `app/dashboard/actions.ts`; format/uniqueness validation in `lib/validation.ts`; tenant create auto-creates the owning membership in the same write)
- [x] 7.6 Port the existing dashboard to authenticated server data and remove the unauthenticated `/api/admin/tenants` behavior
- [x] 7.7 Add tests proving authenticated users cannot enumerate or mutate another tenant's resources (verified manually against the real DB — cross-tenant read returns empty/404, cross-tenant `updateMany`/archive affects 0 rows; no automated suite, no test framework in this repo yet)

## 8. Builder, media, preview, and publish

- [x] 8.1 Implement the block palette and dnd-kit canvas for add, remove, reorder, duplicate, and select operations
- [x] 8.2 Implement type-specific property panels that produce only validator-approved block props and styles
- [ ] 8.3 Render editor preview with `@repo/blocks` and add contract fixtures comparing preview and Storefront output (partial: preview renders real `@repo/blocks` components for BannerSlider/BannerGrid/Header/Footer; ProductList/CategoryNav are server components needing `next/headers` + live data and show a placeholder instead — need a saved-draft preview route (depends on 8.5) or a dedicated preview round-trip. No contract fixtures yet — no test framework is set up in this repo.)
- [ ] 8.4 Configure tenant-scoped Supabase Storage policies and implement validated image upload, list, select, and delete flows
- [x] 8.5 Implement debounced draft save with optimistic concurrency so stale editors cannot overwrite newer drafts silently (`saveDraft` action: 1.5s debounce, atomic `updateMany({where: {id, updatedAt: expected}})` compare-and-swap, server-side re-validation before every write; verified against the real DB that a stale `updatedAt` is rejected — 0 rows affected, draft untouched — rather than silently overwritten)
- [x] 8.6 Implement transactional publish that validates draft, creates immutable revision, and updates active published state (`publishPage` action: validates → single `$transaction` does draft compare-and-swap + immutable `PageRevision` + `publishedSchema`/`publishedAt`/`activeRevisionId` + enqueues a pending `RevalidationOutboxEntry`; verified against the real DB including that a stale-concurrency conflict rolls back the *entire* transaction, no orphan revision left behind)
- [ ] 8.7 Implement idempotent revalidation outbox processing with retry state and tenant/page-specific invalidation
- [x] 8.8 Implement revision history and rollback as a new publish operation with authorization and revalidation (`rollbackToRevision` action + `/dashboard/pages/[pageId]/revisions` UI; rollback creates a fresh `PageRevision` copy rather than reusing/rewriting the old one, keeping the log append-only, and overwrites both draft and published state; verified against the real DB across publish v1 → v2 → rollback-to-v1: a 3rd revision is created, published+draft content reverts correctly, and the original v1 row is untouched)
- [ ] 8.9 Add end-to-end tests proving draft isolation, publish visibility, concurrent edit handling, failed revalidation retry, and rollback

## 9. Storefront page policies and system pages

- [x] 9.1 Define the allowed block and slot matrix for home, category/event, product, cart/order, and my page routes
- [ ] 9.2 Enforce the page policy matrix in Admin validation, publish validation, and Storefront rendering
- [ ] 9.3 Implement category/event system product list, filtering, sorting, pagination, and allowed custom content slots
- [ ] 9.4 Implement product detail system information, options, stock, price, purchase actions, and upper/lower custom slots
- [ ] 9.5 Implement fixed cart and order layouts accepting only validated theme, logo, typography, and color tokens
- [ ] 9.6 Implement the standard my page template without loading tenant-authored PageSchema
- [ ] 9.7 Keep HTML blocks disabled until sanitizer, URL protocol allowlist, CSP, preview, and Storefront security tests pass
- [ ] 9.8 Add policy tests proving required system regions cannot be removed, reordered, or replaced

## 10. Custom domain lifecycle

- [ ] 10.1 Define reserved subdomain policy and implement normalized unique platform-subdomain allocation
- [ ] 10.2 Implement a provider-neutral domain service and Vercel adapter for idempotent add, inspect, verify, and remove operations
- [ ] 10.3 Implement tenant-authorized custom-domain registration with ownership and duplicate-host protections
- [ ] 10.4 Persist DNS instructions, provider ID, verification/SSL status, retry state, timestamps, and sanitized failure reason
- [ ] 10.5 Implement the selected polling/webhook synchronization worker with bounded backoff and idempotency
- [ ] 10.6 Implement Admin UI for pending, verification-required, active, failed, and removing domain states
- [ ] 10.7 Invalidate old and new hostname mappings before activating reassignment or completing removal
- [ ] 10.8 Add provider-contract and integration tests for retries, timeouts, duplicates, verification, activation, and removal

## 11. Observability, usage, and scaling controls

- [ ] 11.1 Define bounded-cardinality telemetry fields and a central redaction policy for logs, metrics, traces, and audit events
- [ ] 11.2 Instrument tenant resolution, Storefront requests, DB lookup, ShopBy upstream calls, publish/revalidation, domain jobs, and rate limits
- [ ] 11.3 Implement idempotent tenant usage accounting that excludes static assets, health checks, and internal/provider retries
- [ ] 11.4 Define dashboards and alerts for latency/error objectives, ShopBy failures, revalidation backlog, security anomalies, and domain capacity
- [ ] 11.5 Run tenant lookup load tests and document baseline p50/p95 latency, DB load, and the approved distributed-cache activation threshold
- [ ] 11.6 If the approved threshold is exceeded, implement feature-flagged tenant cache with environment/tenant namespace, TTL, and domain-change invalidation
- [ ] 11.7 Document current domain-provider contract limits, cost thresholds, and the runbook trigger for evaluating Cloudflare for SaaS

## 12. Cutover, verification, and cleanup

- [ ] 12.1 Run schema and credential migration dry-runs against a production-like backup and resolve every quarantined record
- [ ] 12.2 Execute additive migrations and backfills, verify counts and decryptability, then enable dual-read and new-write flags
- [ ] 12.3 Run security tests for tenant isolation, IDOR, header spoofing, CSRF, proxy allowlist, secret leakage, and rate limiting
- [ ] 12.4 Run end-to-end tests for onboarding, ShopBy connection, editing, preview, publish, Storefront rendering, rollback, and custom domain verification
- [ ] 12.5 Deploy routing, proxy, Admin, page policies, and domains progressively to beta tenants with rollback checks at each gate
- [ ] 12.6 Verify telemetry, alerts, outbox retries, domain synchronization, and tenant usage accounting under load
- [ ] 12.7 Remove the Vite Admin, arbitrary ShopBy proxy, legacy plaintext credential reads, and legacy string-schema compatibility after cutover criteria pass
- [ ] 12.8 Update README, environment examples, deployment runbooks, security runbooks, and architecture decision records to match the implemented system
