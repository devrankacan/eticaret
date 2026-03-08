import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import slugify from 'slugify'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return false
  return true
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { children: { orderBy: { sortOrder: 'asc' } }, _count: { select: { products: true } } },
  })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const data = await req.json()
  const slug = data.slug || slugify(data.name, { lower: true, strict: true, locale: 'tr' })
  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug,
      image: data.image || null,
      description: data.description || null,
      parentId: data.parentId || null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  })
  return NextResponse.json(category)
}
