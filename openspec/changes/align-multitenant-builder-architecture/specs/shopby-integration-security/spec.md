## ADDED Requirements

### Requirement: Encrypted ShopBy credentials
ShopBy API credentials MUST be encrypted at rest with authenticated encryption and key version metadata, and plaintext MUST exist only inside the server credential service for the minimum required duration.

#### Scenario: Credential is stored
- **WHEN** an authorized administrator submits a valid ShopBy credential
- **THEN** the database stores ciphertext and encryption metadata rather than plaintext

### Requirement: Credential secrecy
The system MUST NOT expose ShopBy API keys in client responses, rendered output, logs, metrics, traces, URLs, or unredacted errors.

#### Scenario: ShopBy upstream request fails
- **WHEN** a request using tenant credentials returns an error
- **THEN** the system logs a redacted diagnostic and returns a sanitized error without credential material

### Requirement: Capability-based ShopBy proxy
The proxy SHALL allow only explicitly registered ShopBy endpoint patterns and HTTP methods and SHALL reject arbitrary upstream paths.

#### Scenario: Disallowed ShopBy endpoint
- **WHEN** a caller requests a path or method absent from the allowlist
- **THEN** the proxy rejects it before sending any upstream request

### Requirement: Server-controlled upstream headers
The proxy MUST remove untrusted authentication and hop-by-hop headers and MUST inject mall and credential values from server-owned tenant context.

#### Scenario: Caller supplies authorization header
- **WHEN** a caller submits its own ShopBy authorization or mall header
- **THEN** the proxy discards it and applies only approved server-controlled headers

### Requirement: Proxy authorization and abuse controls
Sensitive ShopBy operations SHALL require the appropriate administrator or buyer session and SHALL apply tenant-aware rate limits and auditable security events.

#### Scenario: Rate limit is exceeded
- **WHEN** a tenant or client exceeds the configured limit for a ShopBy capability
- **THEN** the proxy returns a rate-limit response, performs no upstream call, and records a redacted event

### Requirement: Credential rotation
The credential service SHALL support key-version rotation without downtime and SHALL preserve decryptability until all records are re-encrypted.

#### Scenario: New encryption key becomes active
- **WHEN** rotation activates a new key version
- **THEN** new writes use the new version while old ciphertext remains readable during controlled backfill
