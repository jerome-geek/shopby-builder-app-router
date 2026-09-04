import type { PageType } from '@repo/types'

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/

// Names that would collide with platform routes/reserved hosts. The full
// reserved-subdomain policy (wildcard allocation, provider checks) is
// task 10.1 — this is just enough to stop obviously-wrong input here.
const RESERVED_SUBDOMAINS = new Set(['www', 'admin', 'app', 'api', 'auth', 'dashboard'])

export function normalizeSubdomain(input: string): string | null {
  const normalized = input.trim().toLowerCase()
  if (!SUBDOMAIN_PATTERN.test(normalized)) return null
  if (RESERVED_SUBDOMAINS.has(normalized)) return null
  return normalized
}

export function normalizeSlug(input: string): string | null {
  const trimmed = input.trim()
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const normalized = withLeadingSlash === '/' ? '/' : withLeadingSlash.replace(/\/+$/, '')
  if (!/^\/[a-z0-9\-/]*$/.test(normalized)) return null
  return normalized
}

const PAGE_TYPES: PageType[] = ['home', 'category', 'product', 'cart', 'mypage']

export function isKnownPageType(value: string): value is PageType {
  return (PAGE_TYPES as string[]).includes(value)
}

export function nonEmpty(value: string, maxLength = 200): string | null {
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > maxLength) return null
  return trimmed
}
