import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 테넌트 생성
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'my-shop' },
    update: {},
    create: {
      subdomain: 'my-shop',
      clientId: 'test-client-id',
      apiKey: 'test-api-key',
      theme: JSON.stringify({ primaryColor: '#4f46e5' }),
      pages: {
        create: [
          {
            slug: '/',
            pageType: 'home',
            title: '홈',
            draftSchema: JSON.stringify({
              blocks: [
                { id: 'b1', type: 'BannerSlider', props: { images: [] } },
                { id: 'b2', type: 'ProductList', props: { title: '신상품' } }
              ]
            }),
            publishedSchema: JSON.stringify({
              blocks: [
                { id: 'b1', type: 'BannerSlider', props: { images: [] } },
                { id: 'b2', type: 'ProductList', props: { title: '신상품' } }
              ]
            }),
            publishedAt: new Date()
          },
          {
            slug: '/about',
            pageType: 'custom',
            title: '소개',
            draftSchema: JSON.stringify({ blocks: [] }),
            publishedSchema: JSON.stringify({ blocks: [] }),
            publishedAt: new Date()
          }
        ]
      }
    }
  })

  console.log('Seed data created:', { tenant })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
