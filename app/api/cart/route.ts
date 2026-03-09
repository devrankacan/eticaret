import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

function getCartKey(session: any, cookieStore: any) {
  if (session?.user?.id) return { userId: session.user.id }
  let sessionId = cookieStore.get('cart_session')?.value
  if (!sessionId) sessionId = crypto.randomUUID()
  return { sessionId }
}

// GET - sepet içeriği
export async function GET() {
  const session = await getServerSession(authOptions)
  const cookieStore = cookies()
  const key = getCartKey(session, cookieStore)

  const items = await prisma.cartItem.findMany({
    where: key,
    include: {
      product: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
      variation: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const response = NextResponse.json({ items })
  if (!session?.user && 'sessionId' in key) {
    response.cookies.set('cart_session', key.sessionId!, { httpOnly: true, maxAge: 60 * 60 * 24 * 30 })
  }
  return response
}

// POST - sepete ekle
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const cookieStore = cookies()
  const key = getCartKey(session, cookieStore)
  const { productId, quantity = 1, variationId = null } = await req.json()

  if (!productId) {
    return NextResponse.json({ error: 'Ürün ID gerekli' }, { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.isActive) {
    return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
  }

  // Varyasyonlu ürün kontrolü
  if (product.hasVariations) {
    if (!variationId) {
      return NextResponse.json({ error: 'Seçenek seçimi gerekli' }, { status: 400 })
    }
    const variation = await prisma.productVariation.findUnique({ where: { id: variationId } })
    if (!variation || variation.productId !== productId) {
      return NextResponse.json({ error: 'Geçersiz seçenek' }, { status: 400 })
    }
    if (variation.stock <= 0) {
      return NextResponse.json({ error: 'Bu seçenek stokta yok' }, { status: 400 })
    }

    // Aynı ürün+varyasyon varsa miktarı artır
    const existing = await prisma.cartItem.findFirst({ where: { ...key, productId, variationId } })
    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, variation.stock)
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } })
    } else {
      await prisma.cartItem.create({
        data: { ...key, productId, variationId, quantity: Math.min(quantity, variation.stock) },
      })
    }
  } else {
    // Basit ürün
    if (product.stock <= 0) {
      return NextResponse.json({ error: 'Ürün stokta yok' }, { status: 400 })
    }
    const existing = await prisma.cartItem.findFirst({ where: { ...key, productId } })
    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, product.stock)
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } })
    } else {
      await prisma.cartItem.create({
        data: { ...key, productId, quantity: Math.min(quantity, product.stock) },
      })
    }
  }

  const response = NextResponse.json({ success: true })
  if (!session?.user && 'sessionId' in key) {
    response.cookies.set('cart_session', key.sessionId!, { httpOnly: true, maxAge: 60 * 60 * 24 * 30 })
  }
  return response
}
