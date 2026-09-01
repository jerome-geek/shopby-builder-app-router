## ADDED Requirements

### Requirement: Unique platform subdomain
Each tenant SHALL receive one normalized platform subdomain that is unique and does not collide with reserved application or infrastructure names.

#### Scenario: Reserved subdomain is requested
- **WHEN** an administrator requests a reserved name such as the Admin hostname
- **THEN** the system rejects it before DNS or tenant records are changed

### Requirement: Authorized custom domain registration
Only an authorized tenant administrator SHALL register a normalized custom hostname, and one active hostname MUST belong to at most one tenant.

#### Scenario: Domain already belongs to another tenant
- **WHEN** an administrator submits a hostname assigned to another tenant
- **THEN** the system rejects the registration without revealing the other tenant

### Requirement: Idempotent provider integration
Domain add, verify, synchronize, and delete operations SHALL be idempotent and persist provider identifiers and retry state.

#### Scenario: Registration request is retried
- **WHEN** the same idempotency key is submitted after a timeout
- **THEN** the system returns the original domain operation instead of creating a duplicate provider resource

### Requirement: Domain verification status
The Admin SHALL display pending, verification-required, active, failed, and removing states with required DNS records and sanitized failure details.

#### Scenario: Provider requires DNS proof
- **WHEN** provider registration returns verification records
- **THEN** the Admin shows the exact required records and keeps the domain unavailable for tenant routing until verified

### Requirement: Safe custom domain removal
Removing a custom domain SHALL stop new tenant routing, remove or schedule removal of the provider resource, and preserve an audit trail.

#### Scenario: Active domain is removed
- **WHEN** an authorized administrator confirms removal
- **THEN** the hostname no longer resolves to tenant context after propagation and the operation remains auditable

### Requirement: Provider capacity monitoring
The system SHALL track domain utilization and provider failures without hard-coding an unverified public plan limit.

#### Scenario: Configured capacity threshold is approached
- **WHEN** active domains reach the configured warning threshold
- **THEN** operators receive an alert with current utilization and the documented provider expansion runbook
