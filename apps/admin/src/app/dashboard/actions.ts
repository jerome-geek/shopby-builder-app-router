'use server'

import { prisma } from '@repo/database'
import { isVersionedPageSchema, validatePageSchemaForType, type VersionedPageSchema } from '@repo/types'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdministrator, requireTenantMembership } from '@/lib/auth'
import { resolvePageType } from '@/lib/pages'
import { isKnownPageType, nonEmpty, normalizeSlug, normalizeSubdomain } from '@/lib/validation'

export interface ActionState {
  error?: string
}

export interface SaveDraftResult {
  status: 'saved' | 'conflict' | 'invalid' | 'not_found'
  updatedAt?: string
  issues?: string[]
}

/**
 * Called directly from the builder's debounced autosave (not bound to a
 * <form>), so it must re-derive everything from the server-known
 * `pageId` — never trust the client-supplied pageType or ownership.
 *
 * Optimistic concurrency: the `updateMany` where-clause only matches if
 * `updatedAt` still equals what the caller last saw. If another save (a
 * second tab, a teammate) landed in between, the count is 0 and this
 * returns a conflict instead of silently overwriting it — the atomicity
 * comes from doing the compare-and-write as one query, not a separate
 * read-then-write.
 */
export async function saveDraft(
  pageId: string,
  schema: VersionedPageSchema,
  expectedUpdatedAt: string
): Promise<SaveDraftResult> {
  const admin = await requireAdministrator()

  const page = await prisma.page.findFirst({
    where: { id: pageId, tenant: { memberships: { some: { administratorId: admin.id } } } },
  })
  if (!page) return { status: 'not_found' }

  const validation = validatePageSchemaForType(resolvePageType(page.pageType), schema)
  if (!validation.valid) {
    return { status: 'invalid', issues: validation.issues.map((issue) => issue.message) }
  }

  const result = await prisma.page.updateMany({
    where: { id: pageId, updatedAt: new Date(expectedUpdatedAt) },
    // Prisma's Json input type wants an index-signature-compatible
    // object; round-tripping through JSON also guarantees this is a
    // plain JSON-safe value, not e.g. an object with class methods.
    data: { draftSchema: JSON.parse(JSON.stringify(schema)) },
  })

  const current = await prisma.page.findUnique({ where: { id: pageId }, select: { updatedAt: true } })
  if (!current) return { status: 'not_found' }

  if (result.count === 0) {
    return { status: 'conflict', updatedAt: current.updatedAt.toISOString() }
  }

  return { status: 'saved', updatedAt: current.updatedAt.toISOString() }
}

export interface PublishResult {
  status: 'published' | 'conflict' | 'invalid' | 'not_found'
  updatedAt?: string
  publishedAt?: string
  issues?: string[]
}

class PublishConflict extends Error {}

/**
 * Publish always operates on exactly what's on screen right now, saved
 * and published atomically — not "publish whatever the last autosave
 * happened to persist" — so there's no window where a user can publish
 * something other than what they were just looking at.
 *
 * design.md Decision #4: the transaction covers DB state only (draft
 * write, immutable PageRevision snapshot, publishedSchema/publishedAt/
 * activeRevisionId, and a revalidation outbox row); cache invalidation
 * itself happens after commit and is allowed to fail/retry without
 * rolling back the publish (task 8.7 builds the actual retry worker —
 * this only enqueues the row and does a best-effort immediate attempt).
 */
export async function publishPage(
  pageId: string,
  schema: VersionedPageSchema,
  expectedUpdatedAt: string
): Promise<PublishResult> {
  const admin = await requireAdministrator()

  const page = await prisma.page.findFirst({
    where: { id: pageId, tenant: { memberships: { some: { administratorId: admin.id } } } },
  })
  if (!page) return { status: 'not_found' }

  const validation = validatePageSchemaForType(resolvePageType(page.pageType), schema)
  if (!validation.valid) {
    return { status: 'invalid', issues: validation.issues.map((issue) => issue.message) }
  }

  const plainSchema = JSON.parse(JSON.stringify(schema))

  try {
    const published = await prisma.$transaction(async (tx) => {
      const draftWrite = await tx.page.updateMany({
        where: { id: pageId, updatedAt: new Date(expectedUpdatedAt) },
        data: { draftSchema: plainSchema },
      })
      if (draftWrite.count === 0) throw new PublishConflict()

      const revision = await tx.pageRevision.create({
        data: {
          pageId,
          schema: plainSchema,
          schemaVersion: schema.schemaVersion,
          publishedByAdministratorId: admin.id,
        },
      })

      const result = await tx.page.update({
        where: { id: pageId },
        data: {
          publishedSchema: plainSchema,
          publishedAt: new Date(),
          activeRevisionId: revision.id,
        },
      })

      await tx.revalidationOutboxEntry.create({
        data: { tenantId: page.tenantId, pageId },
      })

      return result
    })

    return {
      status: 'published',
      updatedAt: published.updatedAt.toISOString(),
      publishedAt: published.publishedAt!.toISOString(),
    }
  } catch (error) {
    if (error instanceof PublishConflict) {
      const current = await prisma.page.findUnique({ where: { id: pageId }, select: { updatedAt: true } })
      return { status: 'conflict', updatedAt: current?.updatedAt.toISOString() }
    }
    throw error
  }
}

export interface RollbackResult {
  status: 'rolled_back' | 'not_found' | 'invalid'
}

/**
 * Rollback is a new publish, not a history edit — it creates a fresh
 * PageRevision (a copy of the old snapshot, attributed to whoever
 * clicked rollback) rather than rewriting or reactivating the old row,
 * so PageRevision stays a strictly append-only, immutable log. Draft is
 * overwritten too: after rolling back, the editor should show exactly
 * what's now live, not some other in-progress draft.
 */
export async function rollbackToRevision(pageId: string, revisionId: string): Promise<RollbackResult> {
  const admin = await requireAdministrator()

  const page = await prisma.page.findFirst({
    where: { id: pageId, tenant: { memberships: { some: { administratorId: admin.id } } } },
  })
  if (!page) return { status: 'not_found' }

  const revision = await prisma.pageRevision.findFirst({ where: { id: revisionId, pageId } })
  if (!revision) return { status: 'not_found' }

  // Defensive: revision.schema is only a JsonValue at the type level.
  // It should always be shape-valid (it was validated before the publish
  // that created it), but never trust stored data blindly.
  if (!isVersionedPageSchema(revision.schema)) return { status: 'invalid' }

  const validation = validatePageSchemaForType(resolvePageType(page.pageType), revision.schema)
  if (!validation.valid) return { status: 'invalid' }

  const plainSchema = JSON.parse(JSON.stringify(revision.schema))

  await prisma.$transaction(async (tx) => {
    const newRevision = await tx.pageRevision.create({
      data: {
        pageId,
        schema: plainSchema,
        schemaVersion: revision.schemaVersion,
        publishedByAdministratorId: admin.id,
      },
    })

    await tx.page.update({
      where: { id: pageId },
      data: {
        draftSchema: plainSchema,
        publishedSchema: plainSchema,
        publishedAt: new Date(),
        activeRevisionId: newRevision.id,
      },
    })

    await tx.revalidationOutboxEntry.create({ data: { tenantId: page.tenantId, pageId } })
  })

  revalidatePath(`/dashboard/pages/${pageId}/edit`)
  revalidatePath(`/dashboard/pages/${pageId}/revisions`)
  return { status: 'rolled_back' }
}

export async function createTenant(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdministrator()

  const subdomain = normalizeSubdomain(String(formData.get('subdomain') ?? ''))
  const mallId = nonEmpty(String(formData.get('mallId') ?? ''))
  const apiKey = nonEmpty(String(formData.get('apiKey') ?? ''))

  if (!subdomain) {
    return { error: '서브도메인 형식이 올바르지 않습니다 (영문 소문자·숫자·하이픈, 예약어 제외).' }
  }
  if (!mallId) return { error: 'ShopBy Mall ID를 입력해주세요.' }
  if (!apiKey) return { error: 'ShopBy API Key를 입력해주세요.' }

  const existing = await prisma.tenant.findUnique({ where: { subdomain } })
  if (existing) return { error: '이미 사용 중인 서브도메인입니다.' }

  const tenant = await prisma.tenant.create({
    data: {
      subdomain,
      mallId,
      apiKey,
      memberships: { create: { administratorId: admin.id } },
    },
  })

  revalidatePath('/dashboard')
  redirect(`/dashboard/tenants/${tenant.id}`)
}

export async function updateTenant(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const tenantId = String(formData.get('tenantId') ?? '')
  await requireTenantMembership(tenantId)

  const mallId = nonEmpty(String(formData.get('mallId') ?? ''))
  const apiKey = nonEmpty(String(formData.get('apiKey') ?? ''))
  if (!mallId) return { error: 'ShopBy Mall ID를 입력해주세요.' }
  if (!apiKey) return { error: 'ShopBy API Key를 입력해주세요.' }

  await prisma.tenant.update({ where: { id: tenantId }, data: { mallId, apiKey } })
  revalidatePath(`/dashboard/tenants/${tenantId}`)
  return {}
}

export async function archiveTenant(formData: FormData) {
  const tenantId = String(formData.get('tenantId') ?? '')
  await requireTenantMembership(tenantId)

  await prisma.tenant.update({ where: { id: tenantId }, data: { archivedAt: new Date() } })
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function createPage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const tenantId = String(formData.get('tenantId') ?? '')
  await requireTenantMembership(tenantId)

  const slug = normalizeSlug(String(formData.get('slug') ?? ''))
  const title = nonEmpty(String(formData.get('title') ?? ''), 100)
  const pageTypeRaw = String(formData.get('pageType') ?? '')

  if (!slug) return { error: '슬러그 형식이 올바르지 않습니다 (예: /about).' }
  if (!title) return { error: '제목을 입력해주세요.' }
  if (!isKnownPageType(pageTypeRaw)) return { error: '올바른 페이지 유형을 선택해주세요.' }

  const existing = await prisma.page.findUnique({ where: { tenantId_slug: { tenantId, slug } } })
  if (existing) return { error: '이미 존재하는 슬러그입니다.' }

  const page = await prisma.page.create({
    data: { tenantId, slug, title, pageType: pageTypeRaw },
  })

  revalidatePath(`/dashboard/tenants/${tenantId}`)
  redirect(`/dashboard/pages/${page.id}/edit`)
}

export async function updatePageTitle(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdministrator()
  const pageId = String(formData.get('pageId') ?? '')
  const title = nonEmpty(String(formData.get('title') ?? ''), 100)
  if (!title) return { error: '제목을 입력해주세요.' }

  // Membership filter baked into the write itself — same non-disclosing
  // shape as the read side: "not yours" and "doesn't exist" both just
  // update zero rows.
  const result = await prisma.page.updateMany({
    where: { id: pageId, tenant: { memberships: { some: { administratorId: admin.id } } } },
    data: { title },
  })
  if (result.count === 0) return { error: '페이지를 찾을 수 없습니다.' }

  revalidatePath(`/dashboard/pages/${pageId}/edit`)
  return {}
}

export async function archivePage(formData: FormData) {
  const admin = await requireAdministrator()
  const pageId = String(formData.get('pageId') ?? '')
  const tenantId = String(formData.get('tenantId') ?? '')

  await prisma.page.updateMany({
    where: {
      id: pageId,
      tenantId,
      tenant: { memberships: { some: { administratorId: admin.id } } },
    },
    data: { archivedAt: new Date() },
  })

  revalidatePath(`/dashboard/tenants/${tenantId}`)
  redirect(`/dashboard/tenants/${tenantId}`)
}
