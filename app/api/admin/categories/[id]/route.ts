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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const data = await req.json()
  const slug = data.slug || slugify(data.name, { lower: true, strict: true, locale: 'tr' })
  const category = await prisma.category.update({
    where: { id: params.id },
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: { _count: { select: { products: true, children: true } } },
  })
  if (!category) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  if (category._count.products > 0) {
    return NextResponse.json({ error: `Bu kategoride ${category._count.products} ürün var. Önce ürünleri başka bir kategoriye taşıyın.` }, { status: 400 })
  }

  // Alt kategorilerin parentId'sini temizle
  if (category._count.children > 0) {
    await prisma.category.updateMany({ where: { parentId: params.id }, data: { parentId: null } })
  }

  await prisma.category.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
