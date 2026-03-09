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

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const { action, ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'ID listesi boş' }, { status: 400 })

  if (action === 'delete') {
    await prisma.product.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ ok: true, count: ids.length })
  }

  if (action === 'duplicate') {
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: { images: { orderBy: { sortOrder: 'asc' } }, productVariations: { orderBy: { sortOrder: 'asc' } } },
    })

    for (const p of products) {
      const baseSlug = slugify(p.name + '-kopya', { lower: true, strict: true, locale: 'tr' })
      let slug = baseSlug
      let suffix = 1
      while (await prisma.product.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix++}`
      }

      const newProduct = await prisma.product.create({
        data: {
          name: p.name + ' (Kopya)',
          slug,
          categoryId: p.categoryId,
          sku: null,
          shortDescription: p.shortDescription,
          description: p.description,
          price: p.price,
          comparePrice: p.comparePrice,
          stock: p.stock,
          weight: p.weight,
          hasVariations: p.hasVariations,
          isActive: false,
          isFeatured: false,
          lowStockThreshold: p.lowStockThreshold,
        },
      })

      if (p.images.length) {
        await prisma.productImage.createMany({
          data: p.images.map(img => ({
            productId: newProduct.id,
            imagePath: img.imagePath,
            altText: img.altText,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          })),
        })
      }

      if (p.productVariations.length) {
        await prisma.productVariation.createMany({
          data: p.productVariations.map(v => ({
            productId: newProduct.id,
            name: v.name,
            price: v.price,
            comparePrice: v.comparePrice,
            stock: v.stock,
            sku: null,
            isDefault: v.isDefault,
            sortOrder: v.sortOrder,
          })),
        })
      }
    }

    return NextResponse.json({ ok: true, count: ids.length })
  }

  return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
}
