## ADDED Requirements

### Requirement: Tenant-aware operational metrics
The platform SHALL measure request count, latency, DB tenant lookup, ShopBy upstream behavior, publish/revalidation, domain operations, and rate-limit events by non-secret tenant identifier.

#### Scenario: Storefront request completes
- **WHEN** a tenant Storefront request completes
- **THEN** the system records duration, result class, route class, and tenant identifier without recording buyer or credential data

### Requirement: Sensitive telemetry exclusion
Logs, metrics, and traces MUST exclude API keys, tokens, cookie values, raw authorization headers, buyer personal data, and unbounded custom host labels.

#### Scenario: Error contains upstream request headers
- **WHEN** an upstream client raises an exception containing sensitive headers
- **THEN** telemetry redacts those values before export or persistence

### Requirement: Measured cache adoption
The platform SHALL establish DB lookup latency and load baselines before introducing distributed tenant cache and SHALL document the activation threshold, TTL, and invalidation rules.

#### Scenario: Cache threshold is exceeded
- **WHEN** the sustained measured lookup metric exceeds the approved threshold
- **THEN** operators can enable the cache behind a feature flag with domain-change invalidation

### Requirement: Cache correctness
Any tenant or page cache MUST be namespaced by tenant and environment and MUST be invalidated after domain changes, publish, rollback, or tenant suspension.

#### Scenario: Tenant domain changes
- **WHEN** a verified custom domain is reassigned or removed
- **THEN** all old and new hostname mappings are invalidated before routing is considered active

### Requirement: Scaling and provider alerts
The platform SHALL alert on sustained error/latency objectives, ShopBy failures, revalidation backlog, domain provider capacity, and security-event anomalies.

#### Scenario: Revalidation backlog grows
- **WHEN** retryable revalidation jobs exceed the configured age or count threshold
- **THEN** operators receive an alert identifying affected tenants and the recovery runbook

### Requirement: Tenant usage accounting
The platform SHALL count billable request classes per tenant idempotently while excluding health checks, static assets, and provider retries defined by policy.

#### Scenario: Provider retry repeats one logical request
- **WHEN** an internally retried operation shares the same accounting idempotency key
- **THEN** usage records count it once
