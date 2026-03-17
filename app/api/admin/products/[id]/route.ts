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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variations: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!product) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const data = await req.json()
  const slug = data.slug || slugify(data.name, { lower: true, strict: true, locale: 'tr' })
  // Görselleri güncelle
  if (data.images) {
    await prisma.productImage.deleteMany({ where: { productId: params.id } })
    await prisma.productImage.createMany({
      data: data.images.map((img: any, i: number) => ({
        productId: params.id,
        imagePath: img.url || img.imagePath,
        altText: img.alt || img.altText || data.name,
        sortOrder: i,
        isPrimary: i === 0,
      })),
    })
  }
  // Varyasyonları güncelle
  if (data.variations && Array.isArray(data.variations)) {
    for (const v of data.variations) {
      if (v.id) {
        await prisma.productVariation.update({
          where: { id: v.id },
          data: {
            price: parseFloat(v.price),
            comparePrice: v.comparePrice ? parseFloat(v.comparePrice) : null,
            stock: parseInt(v.stock) ?? 0,
            imagePath: v.imagePath || null,
          },
        })
      }
    }
  }

  const product = await prisma.product.update({
    where: { id: params.id },
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
    },
    include: { images: true, variations: { orderBy: { sortOrder: 'asc' } } },
  })
  return NextResponse.json(product)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  await prisma.product.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
