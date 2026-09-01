## ADDED Requirements

### Requirement: Authenticated Admin access
The Admin application SHALL use server-validated authentication and SHALL deny every protected page, server action, and API request without a valid administrator session.

#### Scenario: Unauthenticated administrator opens dashboard
- **WHEN** a request without a valid administrator session opens a protected Admin route
- **THEN** the system redirects to login or returns an authentication error without exposing tenant data

### Requirement: Tenant ownership authorization
Every tenant and page operation MUST verify that the authenticated administrator belongs to the requested tenant, regardless of identifiers supplied in the URL or request body.

#### Scenario: Administrator requests another tenant
- **WHEN** an authenticated administrator submits a tenant or page ID outside their membership
- **THEN** the system returns a non-disclosing authorization error and performs no read or write

### Requirement: Tenant and page management
The Admin application SHALL provide tenant and page create, read, update, and archive operations with server-side validation and uniqueness enforcement.

#### Scenario: Duplicate subdomain is submitted
- **WHEN** an administrator creates or renames a tenant to an existing normalized subdomain
- **THEN** the system rejects the operation with an actionable validation message

### Requirement: Shared block editor and preview
The Admin editor SHALL edit only schema-valid blocks and SHALL render previews through the same `@repo/blocks` implementations used by Storefront.

#### Scenario: Administrator reorders blocks
- **WHEN** an administrator reorders valid blocks and opens preview
- **THEN** preview renders the new order using the shared production block renderer without publishing it

### Requirement: Tenant-scoped media
Media upload and selection SHALL be authenticated, tenant-scoped, validated by content type and size, and stored under non-guessable object paths.

#### Scenario: Cross-tenant media reference is submitted
- **WHEN** an administrator attempts to attach media owned by another tenant
- **THEN** the system rejects the reference and does not reveal the foreign object
