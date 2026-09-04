import {
  CURRENT_PAGE_SCHEMA_VERSION,
  isVersionedPageSchema,
  type Block,
  type PageType,
  type VersionedPageSchema,
} from '@repo/types'

const KNOWN_PAGE_TYPES: PageType[] = ['home', 'category', 'product', 'cart', 'mypage']

/** Falls back to 'home' for any legacy/unrecognized pageType string in the DB. */
export function resolvePageType(value: string): PageType {
  return (KNOWN_PAGE_TYPES as string[]).includes(value) ? (value as PageType) : 'home'
}

/**
 * Bridges the legacy `{ blocks }` JSON-string shape (see prisma/seed.ts)
 * and the new `{ schemaVersion, blocks }` native-object shape into the
 * versioned envelope callers expect. Display-only best effort, not the
 * real backfill/dual-read (openspec task 3.5/3.6) — never writes back,
 * and blocks missing an `order` get one assigned by array position.
 */
export function toVersionedPageSchema(raw: unknown): VersionedPageSchema {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw

  if (isVersionedPageSchema(parsed)) return parsed

  if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray((parsed as { blocks?: unknown }).blocks)
  ) {
    const blocks = (parsed as { blocks: Partial<Block>[] }).blocks.map(
      (block, index) =>
        ({
          ...block,
          order: typeof block.order === 'number' ? block.order : index,
        }) as Block
    )
    return { schemaVersion: CURRENT_PAGE_SCHEMA_VERSION, blocks }
  }

  return { schemaVersion: CURRENT_PAGE_SCHEMA_VERSION, blocks: [] }
}
