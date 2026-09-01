## ADDED Requirements

### Requirement: Host-only buyer session cookies
Buyer AccessToken and GuestToken cookies MUST be host-only, HttpOnly, Secure in deployed environments, scoped to `Path=/`, and assigned an explicit SameSite policy.

#### Scenario: Buyer signs in on a custom domain
- **WHEN** a buyer session is created for `shop.example.com`
- **THEN** its cookies omit the Domain attribute and are unavailable to platform or other customer domains

### Requirement: Tenant-bound token use
The server SHALL associate each buyer token with the current tenant context and MUST NOT forward a token when its tenant binding does not match.

#### Scenario: Token from another tenant is replayed
- **WHEN** a token issued under tenant A is presented on tenant B
- **THEN** the server rejects or clears it and performs no authenticated ShopBy request

### Requirement: Controlled token forwarding
Buyer tokens SHALL be read and injected into ShopBy requests only by approved server handlers and MUST NOT be returned to client JavaScript.

#### Scenario: Browser calls buyer API
- **WHEN** an approved buyer request reaches the server proxy
- **THEN** the server reads the HttpOnly token and adds it only to the allowed upstream call

### Requirement: Session lifecycle cleanup
Logout, expiration, invalid refresh, tenant mismatch, and credential revocation SHALL clear all related AccessToken and GuestToken cookies for the current host.

#### Scenario: Refresh token is rejected
- **WHEN** ShopBy rejects session refresh as invalid or expired
- **THEN** the system clears the tenant-bound session cookies and returns an unauthenticated state

### Requirement: CSRF protection
Every state-changing buyer request authenticated by cookies MUST enforce SameSite protections and an application-level CSRF defense appropriate to the request flow.

#### Scenario: Cross-site mutation lacks CSRF proof
- **WHEN** a third-party origin submits a state-changing buyer request without valid CSRF proof
- **THEN** the system rejects the request before contacting ShopBy
