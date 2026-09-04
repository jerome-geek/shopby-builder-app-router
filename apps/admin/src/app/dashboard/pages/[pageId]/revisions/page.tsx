import { prisma } from '@repo/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdministrator } from '@/lib/auth'
import { RollbackButton } from '@/components/dashboard/RollbackButton'

export const dynamic = 'force-dynamic'

interface RevisionsPageProps {
  params: Promise<{ pageId: string }>
}

export default async function PageRevisionsPage({ params }: RevisionsPageProps) {
  const admin = await requireAdministrator()
  const { pageId } = await params

  const page = await prisma.page.findFirst({
    where: { id: pageId, tenant: { memberships: { some: { administratorId: admin.id } } } },
  })
  if (!page) return notFound()

  const revisions = await prisma.pageRevision.findMany({
    where: { pageId },
    orderBy: { publishedAt: 'desc' },
  })

  const publisherIds = [
    ...new Set(
      revisions
        .map((revision) => revision.publishedByAdministratorId)
        .filter((id): id is string => id !== null)
    ),
  ]
  const publishers = await prisma.administrator.findMany({ where: { id: { in: publisherIds } } })
  const emailById = new Map(publishers.map((publisher) => [publisher.id, publisher.email]))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-6">
        <Link href={`/dashboard/pages/${pageId}/edit`} className="text-sm text-indigo-600 hover:underline">
          ← 편집기로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">{page.title} · 리비전 히스토리</h1>
      </header>

      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {revisions.map((revision) => {
          const isActive = revision.id === page.activeRevisionId
          return (
            <div key={revision.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  {revision.publishedAt.toLocaleString('ko-KR')}
                  {isActive && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      현재 게시중
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {revision.publishedByAdministratorId
                    ? (emailById.get(revision.publishedByAdministratorId) ?? '알 수 없는 관리자')
                    : '시스템'}
                </p>
              </div>
              {!isActive && <RollbackButton pageId={pageId} revisionId={revision.id} />}
            </div>
          )
        })}
        {revisions.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-gray-400">아직 게시 이력이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
