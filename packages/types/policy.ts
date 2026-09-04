import type { Block, BlockType, VersionedPageSchema } from './schema'

// ============================================================
// Page-type edit policy (design.md Decision #8 / spec
// storefront-page-policy)
//
// Defines, per page type, which regions ("slots") of the page a tenant
// administrator may place blocks into and which block types are allowed
// in each slot. Anything not listed here (product options, cart, order,
// payment, my page) is a fixed system region rendered by the Storefront
// outside of PageSchema — it is never part of a tenant-authored schema,
// so "cannot be removed/reordered" is enforced by construction rather
// than by a runtime check.
// ============================================================

export type PageType = 'home' | 'category' | 'product' | 'cart' | 'mypage'

/** The default slot name for single-region page types (currently only 'home'). */
export const MAIN_SLOT = 'main'

const GENERAL_BLOCK_TYPES: BlockType[] = [
  'BannerSlider',
  'BannerGrid',
  'ProductList',
  'CategoryNav',
  'Header',
  'Footer',
]

// Content-only blocks safe to drop into a slot embedded between system
// regions (e.g. above/below the system product list or product detail).
// Deliberately excludes Header/Footer/CategoryNav/ProductList, which are
// full-page navigation/listing blocks that don't make sense duplicated
// inside a slot — this list is revisited when those pages' real layout
// lands (tasks 9.3/9.4).
const SLOT_CONTENT_BLOCK_TYPES: BlockType[] = ['BannerSlider', 'BannerGrid']

export interface PageSlotPolicy {
  allowedBlockTypes: BlockType[]
}

export interface PagePolicy {
  /** false = no tenant-authored PageSchema at all (fixed system template). */
  editable: boolean
  slots: Record<string, PageSlotPolicy>
}

export const PAGE_POLICIES: Record<PageType, PagePolicy> = {
  home: {
    editable: true,
    slots: {
      [MAIN_SLOT]: { allowedBlockTypes: GENERAL_BLOCK_TYPES },
    },
  },
  category: {
    editable: true,
    slots: {
      productListUpper: { allowedBlockTypes: SLOT_CONTENT_BLOCK_TYPES },
      productListLower: { allowedBlockTypes: SLOT_CONTENT_BLOCK_TYPES },
    },
  },
  product: {
    editable: true,
    slots: {
      productDetailUpper: { allowedBlockTypes: SLOT_CONTENT_BLOCK_TYPES },
      productDetailLower: { allowedBlockTypes: SLOT_CONTENT_BLOCK_TYPES },
    },
  },
  // Fixed system layout (design.md Decision #8): only validated theme
  // tokens apply, no tenant-authored blocks.
  cart: {
    editable: false,
    slots: {},
  },
  // Standard template, never loads a tenant PageSchema (task 9.6).
  mypage: {
    editable: false,
    slots: {},
  },
}

export function resolveBlockSlot(block: Block): string {
  return block.slot ?? MAIN_SLOT
}

export interface PageSchemaValidationIssue {
  blockId: string
  message: string
}

export interface PageSchemaPolicyValidationResult {
  valid: boolean
  issues: PageSchemaValidationIssue[]
}

/**
 * Enforces the page-type policy matrix above: every block must sit in a
 * slot the page type defines, must be an allowed type for that slot, and
 * block ordering must be well-formed (non-negative, unique per slot).
 * Non-editable page types must carry no blocks at all.
 *
 * This checks structure and placement only — per-type prop shape is
 * TypeScript-enforced by `Block<T>` at the call site (Admin property
 * panels), and asset-reference ownership validation needs the tenant
 * media registry (task 8.4), so it is deferred until that lands.
 */
export function validatePageSchemaForType(
  pageType: PageType,
  schema: VersionedPageSchema
): PageSchemaPolicyValidationResult {
  const policy = PAGE_POLICIES[pageType]
  const issues: PageSchemaValidationIssue[] = []

  if (!policy.editable) {
    for (const block of schema.blocks) {
      issues.push({
        blockId: block.id,
        message: `Page type '${pageType}' is a fixed system template and cannot hold tenant-authored blocks`,
      })
    }
    return { valid: issues.length === 0, issues }
  }

  const seenOrderBySlot = new Map<string, Set<number>>()

  for (const block of schema.blocks) {
    const slot = resolveBlockSlot(block)
    const slotPolicy = policy.slots[slot]

    if (!slotPolicy) {
      issues.push({
        blockId: block.id,
        message: `Slot '${slot}' is not defined for page type '${pageType}'`,
      })
      continue
    }

    if (!slotPolicy.allowedBlockTypes.includes(block.type)) {
      issues.push({
        blockId: block.id,
        message: `Block type '${block.type}' is not allowed in slot '${slot}' for page type '${pageType}'`,
      })
    }

    if (!Number.isInteger(block.order) || block.order < 0) {
      issues.push({
        blockId: block.id,
        message: `Block order must be a non-negative integer, got ${String(block.order)}`,
      })
      continue
    }

    const seenOrders = seenOrderBySlot.get(slot) ?? new Set<number>()
    if (seenOrders.has(block.order)) {
      issues.push({
        blockId: block.id,
        message: `Duplicate order ${block.order} in slot '${slot}'`,
      })
    }
    seenOrders.add(block.order)
    seenOrderBySlot.set(slot, seenOrders)
  }

  return { valid: issues.length === 0, issues }
}
