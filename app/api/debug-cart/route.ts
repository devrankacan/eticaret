import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const cookieStore = cookies()

  const userId = (session?.user as any)?.id as string | undefined
  const sessionId = cookieStore.get('cart_session')?.value ?? ''

  const include = {
    product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
  } as const

  // Odeme sayfasının TAM AYNI sorgusu
  let cartItems = userId
    ? await prisma.cartItem.findMany({ where: { userId }, include, orderBy: { createdAt: 'asc' } })
    : []

  if (cartItems.length === 0 && sessionId) {
    cartItems = await prisma.cartItem.findMany({ where: { sessionId }, include, orderBy: { createdAt: 'asc' } })
  }

  // Ürünü direkt kontrol et
  const productId = 'cmmqv92iy002nmbeq5dsfzfm8'
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, isActive: true, stock: true },
  })

  return NextResponse.json({
    userId: userId || null,
    sessionId: sessionId || null,
    cartItemsCount: cartItems.length,
    cartItems: cartItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      productId: item.productId,
      productExists: !!item.product,
      productName: item.product?.name,
      productIsActive: item.product?.isActive,
      productStock: item.product?.stock,
    })),
    directProductCheck: product,
  }, { status: 200 })
}
