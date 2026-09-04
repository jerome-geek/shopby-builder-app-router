import { prisma } from '@repo/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageBuilder } from '@/components/builder/PageBuilder'
import { requireAdministrator } from '@/lib/auth'
import { resolvePageType, toVersionedPageSchema } from '@/lib/pages'
import { UpdatePageTitleForm } from '@/components/dashboard/UpdatePageTitleForm'
import { ArchivePageButton } from '@/components/dashboard/ArchivePageButton'

export const dynamic = 'force-dynamic'

interface EditPageProps {
  params: Promise<{ pageId: string }>
}

export default async function EditPage({ params }: EditPageProps) {
  const admin = await requireAdministrator()

  const { pageId } = await params

  // Membership filter baked into the query: a page ID for a tenant the
  // admin doesn't belong to comes back exactly like a nonexistent page ID
  // — same 404, no distinguishing read happens either way.
  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      tenant: { memberships: { some: { administratorId: admin.id } } },
    },
  })
  if (!page) return notFound()

  const pageType = resolvePageType(page.pageType)
  const initialSchema = toVersionedPageSchema(page.draftSchema)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <Link href={`/dashboard/tenants/${page.tenantId}`} className="text-sm text-indigo-600 hover:underline">
            ← 테넌트로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{page.title}</h1>
          <p className="text-sm text-gray-500">{page.slug}</p>
        </div>
        <div className="flex items-center gap-4">
          <UpdatePageTitleForm pageId={page.id} title={page.title} />
          <Link
            href={`/dashboard/pages/${page.id}/revisions`}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            리비전 히스토리
          </Link>
          <ArchivePageButton pageId={page.id} tenantId={page.tenantId} />
        </div>
      </header>
      <PageBuilder
        pageId={page.id}
        pageType={pageType}
        initialSchema={initialSchema}
        initialUpdatedAt={page.updatedAt.toISOString()}
        initialPublishedAt={page.publishedAt?.toISOString() ?? null}
      />
    </div>
  )
}
