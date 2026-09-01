## ADDED Requirements

### Requirement: Canonical Host-based tenant identification
The Storefront SHALL derive tenant context only from a validated and normalized request Host, supporting platform subdomains and verified custom domains.

#### Scenario: Platform subdomain request
- **WHEN** a request arrives for `my-shop.<root-domain>`
- **THEN** the system resolves tenant context for subdomain `my-shop`

#### Scenario: Verified custom domain request
- **WHEN** a request arrives for a verified custom domain assigned to one tenant
- **THEN** the system resolves that tenant without treating the hostname as a platform subdomain

### Requirement: Internal tenant header trust boundary
The Proxy MUST discard any incoming internal tenant headers and MUST create the downstream request header from canonical Host resolution.

#### Scenario: Client spoofs tenant header
- **WHEN** a client supplies `x-tenant-id` for a different tenant
- **THEN** the Proxy ignores that value and forwards only the tenant identifier derived from Host

### Requirement: Reserved and unknown host handling
The Storefront SHALL reject malformed, unverified, unknown, and reserved hosts before tenant content or credentials are accessed.

#### Scenario: Unknown custom domain
- **WHEN** a request arrives for a hostname not assigned to a verified tenant domain
- **THEN** the system returns the configured not-found response without querying ShopBy with tenant credentials

### Requirement: Tenant context propagation
Server Components and Route Handlers SHALL consume a single server-owned tenant context and MUST NOT accept tenant identity from query parameters or request bodies.

#### Scenario: Body contains a conflicting tenant ID
- **WHEN** an API request body names a tenant different from the Host-derived context
- **THEN** the operation uses the server-owned context or rejects the request and never crosses tenant boundaries
