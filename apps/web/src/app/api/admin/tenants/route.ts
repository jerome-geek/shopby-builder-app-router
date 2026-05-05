import { prisma } from '@repo/database'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: { _count: { select: { pages: true } } }
    })
    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Failed to fetch tenants:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
