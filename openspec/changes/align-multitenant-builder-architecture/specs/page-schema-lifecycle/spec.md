## ADDED Requirements

### Requirement: Versioned native PageSchema
Every newly written PageSchema SHALL be a native JSON object containing a supported integer `schemaVersion` and a validated `blocks` array.

#### Scenario: JSON string schema is submitted after cutover
- **WHEN** a write endpoint receives a stringified schema instead of the supported object envelope
- **THEN** the system rejects it with a schema validation error

### Requirement: Boundary validation
The system MUST run the shared runtime validator before draft writes, previews, publishes, migrations, and Storefront rendering.

#### Scenario: Block props do not match block type
- **WHEN** a schema contains props invalid for its declared block type
- **THEN** the system reports the exact invalid block and does not persist or render the invalid change

### Requirement: Sequential schema migration
The system SHALL migrate older supported schema versions through deterministic sequential migration functions while preserving the source until validation succeeds.

#### Scenario: Legacy string record migrates successfully
- **WHEN** a legacy JSON string parses and passes all version migrations
- **THEN** the system writes the equivalent latest-version native JSON object and records the migration result

#### Scenario: Legacy record is invalid
- **WHEN** a legacy record cannot parse or validate
- **THEN** the system leaves the source unchanged and records it for manual remediation

### Requirement: Draft isolation
Draft changes SHALL remain invisible to public Storefront requests until an authorized publish succeeds.

#### Scenario: Draft is saved
- **WHEN** an administrator saves a valid draft
- **THEN** public Storefront requests continue rendering the prior published revision

### Requirement: Atomic publish with revision history
Publishing SHALL validate the draft and atomically create an immutable revision and update the active published schema.

#### Scenario: Publish transaction fails
- **WHEN** revision creation or page update fails
- **THEN** neither partial revision nor partial published state becomes active

### Requirement: Revalidation and rollback
After publish commit the system SHALL enqueue tenant-page cache revalidation, and an administrator SHALL be able to republish a prior valid revision.

#### Scenario: Cache revalidation fails
- **WHEN** DB publish commits but cache revalidation fails
- **THEN** the system records a retryable failure without losing the published revision

#### Scenario: Administrator rolls back
- **WHEN** an authorized administrator selects a prior valid revision
- **THEN** the system creates a new active revision from it and triggers revalidation
