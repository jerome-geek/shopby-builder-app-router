import { cache } from 'react'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@repo/database'
import { createClient } from '@/lib/supabase/server'

/**
 * Page-level defense in depth: proxy.ts already redirects unauthenticated
 * requests, but per Next.js's own guidance, Proxy should never be the only
 * auth check ("checks should be performed as close as possible to your
 * data source"). Call this at the top of every protected Server Component.
 * Wrapped in React's `cache()` so a layout + page both calling it during
 * the same render only hits Supabase once.
 */
export const requireUser = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  return data.claims
})

/**
 * Supabase Auth has no server-side signup hook wired up (that needs a
 * webhook/DB trigger, which needs a deployed URL), so there is no other
 * point where an `Administrator` row gets created. Upserting it here,
 * on every authenticated request, is the simplest correct substitute:
 * by the time any tenant-membership check runs, the row is guaranteed
 * to exist and have a current email.
 */
export const requireAdministrator = cache(async () => {
  const claims = await requireUser()
  const id = claims.sub as string
  const email = claims.email as string

  return prisma.administrator.upsert({
    where: { id },
    update: { email },
    create: { id, email },
  })
})

/**
 * Every tenant/page read or write MUST go through this (or bake the same
 * membership filter into its query) — never trust a tenantId/pageId from
 * a URL or request body on its own. Returns 404, not 403: per the
 * admin-builder-platform spec, an administrator probing another tenant's
 * ID must not be able to distinguish "not yours" from "doesn't exist".
 */
export async function requireTenantMembership(tenantId: string) {
  const admin = await requireAdministrator()

  const membership = await prisma.tenantMembership.findUnique({
    where: { administratorId_tenantId: { administratorId: admin.id, tenantId } },
  })

  if (!membership) {
    notFound()
  }

  return admin
}
