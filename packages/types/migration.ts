import {
  CURRENT_PAGE_SCHEMA_VERSION,
  PageSchemaValidationError,
  parseVersionedPageSchema,
  type VersionedPageSchema,
} from './schema'

// ============================================================
// Sequential PageSchema migration (task 3.3)
//
// Each migration is a pure `vN -> vN+1` function, keyed by the version it
// migrates *from*. `migratePageSchemaToLatest` walks the chain until it
// reaches CURRENT_PAGE_SCHEMA_VERSION, never mutating its input.
//
// There is only one schema version today (v1), so this registry is
// intentionally empty and the chain is a no-op — it exists so the next
// version bump adds one function and one fixture test here instead of
// inventing the migration mechanism at that point. Converting the
// legacy pre-versioning JSON-string format (no `schemaVersion` field at
// all) into v1 is a one-time backfill (task 3.5), not a step in this
// chain: that backfill produces the input this function accepts.
// ============================================================

interface UnknownVersionedSchema {
  schemaVersion: number
  blocks: unknown[]
}

type SchemaMigration = (input: UnknownVersionedSchema) => UnknownVersionedSchema

const MIGRATIONS: Record<number, SchemaMigration> = {
  // 1: (v1) => ({ ...v1, schemaVersion: 2, blocks: [...] }),
}

export function migratePageSchemaToLatest(
  input: UnknownVersionedSchema
): VersionedPageSchema {
  let current = input

  while (current.schemaVersion < CURRENT_PAGE_SCHEMA_VERSION) {
    const migrate = MIGRATIONS[current.schemaVersion]
    if (!migrate) {
      throw new PageSchemaValidationError(
        `No migration registered from schemaVersion ${current.schemaVersion} to ${current.schemaVersion + 1}`
      )
    }
    current = migrate(current)
  }

  if (current.schemaVersion > CURRENT_PAGE_SCHEMA_VERSION) {
    throw new PageSchemaValidationError(
      `PageSchema schemaVersion ${current.schemaVersion} is newer than the latest known version ${CURRENT_PAGE_SCHEMA_VERSION}`
    )
  }

  return parseVersionedPageSchema(current)
}
