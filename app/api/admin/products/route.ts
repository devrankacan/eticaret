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

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const q = searchParams.get('q') || ''
  const limit = 20
  const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : {}
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])
  return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const data = await req.json()
  const slug = data.slug || slugify(data.name, { lower: true, strict: true, locale: 'tr' })
  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      categoryId: data.categoryId,
      sku: data.sku || null,
      shortDescription: data.shortDescription || null,
      description: data.description || null,
      price: parseFloat(data.price),
      comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
      costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
      stock: parseInt(data.stock) || 0,
      weight: data.weight ? parseFloat(data.weight) : null,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      images: data.images?.length
        ? { create: data.images.map((img: any, i: number) => ({ imagePath: img.url, altText: img.alt || data.name, sortOrder: i, isPrimary: i === 0 })) }
        : undefined,
    },
    include: { images: true },
  })
  return NextResponse.json(product)
}
