## ADDED Requirements

### Requirement: Home page composition
Home pages SHALL allow administrators to arrange approved content and commerce blocks freely while enforcing schema and asset validation.

#### Scenario: Valid home blocks are reordered
- **WHEN** an administrator publishes a valid new home block order
- **THEN** Storefront renders that order without changing protected system behavior

### Requirement: Category and event page slots
Category and event pages SHALL permit customization only in declared content slots around the system-owned product list, filtering, sorting, and pagination behavior.

#### Scenario: User block targets a protected product-list region
- **WHEN** a schema attempts to replace the required system product list
- **THEN** validation rejects the schema and retains the previous published page

### Requirement: Product detail system region
Product detail pages MUST preserve system-owned product information, options, stock, price, and purchase actions while allowing only declared upper and lower custom slots.

#### Scenario: Schema omits purchase system block
- **WHEN** a product page schema omits or moves a required purchase region
- **THEN** the renderer supplies the canonical system region or rejects publication according to the page contract

### Requirement: Cart and order theme-only customization
Cart and order pages SHALL use fixed system layouts and SHALL accept only validated tenant theme, logo, typography, and color tokens.

#### Scenario: Administrator adds arbitrary block to order form
- **WHEN** an order page draft includes a content block outside allowed theme properties
- **THEN** publication is rejected

### Requirement: My page exclusion
My page routes SHALL use the standard ShopBy-compatible template and SHALL NOT load tenant-authored block schemas.

#### Scenario: Tenant schema exists for a my page route
- **WHEN** a request opens a my page route despite a matching tenant-authored page record
- **THEN** the system ignores that record and renders the standard template

### Requirement: Safe unknown and HTML block handling
Unknown blocks SHALL fail closed, and HTML content MUST remain disabled until sanitization, URL protocol allowlisting, and Content Security Policy enforcement are active.

#### Scenario: Published schema contains unknown block type
- **WHEN** Storefront encounters an unsupported block
- **THEN** it omits or replaces the block with a safe fallback and emits a non-sensitive diagnostic

#### Scenario: Unsafe HTML is submitted
- **WHEN** HTML contains scripts, event handlers, or disallowed URL protocols
- **THEN** validation rejects or sanitizes the content before preview or publication
