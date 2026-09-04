import { prisma } from '@repo/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdministrator } from '@/lib/auth'
import { TenantSettingsForm } from '@/components/dashboard/TenantSettingsForm'
import { ArchiveTenantButton } from '@/components/dashboard/ArchiveTenantButton'
import { CreatePageForm } from '@/components/dashboard/CreatePageForm'
import { ArchivePageButton } from '@/components/dashboard/ArchivePageButton'

export const dynamic = 'force-dynamic'

interface TenantDetailPageProps {
  params: Promise<{ tenantId: string }>
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const admin = await requireAdministrator()
  const { tenantId } = await params

  // Membership filter baked into the query, same pattern as every other
  // Admin read entry point.
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, memberships: { some: { administratorId: admin.id } } },
    include: { pages: { where: { archivedAt: null }, orderBy: { createdAt: 'asc' } } },
  })
  if (!tenant) return notFound()

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
            ← 대시보드
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{tenant.subdomain}</h1>
        </div>
        <ArchiveTenantButton tenantId={tenant.id} />
      </header>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">ShopBy 연동 설정</h2>
        <TenantSettingsForm tenantId={tenant.id} mallId={tenant.mallId} apiKey={tenant.apiKey} />
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">페이지</h2>
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <CreatePageForm tenantId={tenant.id} />
        </div>
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {tenant.pages.map((page) => (
            <div key={page.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{page.title}</p>
                <p className="text-sm text-gray-500">{page.slug}</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href={`/dashboard/pages/${page.id}/edit`}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  편집기
                </Link>
                <ArchivePageButton pageId={page.id} tenantId={tenant.id} />
              </div>
            </div>
          ))}
          {tenant.pages.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-400">아직 페이지가 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  )
}
