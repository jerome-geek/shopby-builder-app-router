import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import type { PageSchema } from '@/types/schema'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import { notFound } from 'next/navigation'

interface StorefrontPageProps {
  params: Promise<{ slug?: string[] }>
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug: slugArray } = await params
  const slug = '/' + (slugArray?.join('/') ?? '')

  const headersList = await headers()
  const tenantIdentifier = headersList.get('x-tenant-id') ?? ''

  // 테넌트 조회 (서브도메인 또는 커스텀 도메인)
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { subdomain: tenantIdentifier },
        { customDomain: tenantIdentifier },
      ],
    },
  })

  if (!tenant) {
    return notFound()
  }

  // 해당 슬러그의 퍼블리시된 페이지 조회
  const page = await prisma.page.findUnique({
    where: {
      tenantId_slug: {
        tenantId: tenant.id,
        slug,
      },
    },
  })

  // publishedSchema 없으면 미퍼블리시 상태
  if (!page?.publishedSchema) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400">
        <p className="text-2xl font-light">페이지 준비 중입니다.</p>
        <p className="text-sm mt-2">{slug}</p>
      </div>
    )
  }

  const schema = JSON.parse(page.publishedSchema) as PageSchema

  return <BlockRenderer blocks={schema.blocks} />
}
