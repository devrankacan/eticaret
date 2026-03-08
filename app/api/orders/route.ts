import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { generateOrderNumber } from '@/lib/utils'

// GET - kullanıcının siparişlerini listele
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    where: { userId: (session.user as any).id },
    include: {
      items: { select: { productName: true, productImage: true, quantity: true, unitPrice: true, totalPrice: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders })
}

// POST - sipariş oluştur
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const cookieStore = cookies()

  const body = await req.json()
  const {
    shippingName, shippingPhone, shippingCity, shippingDistrict,
    shippingAddress, shippingPostalCode,
    paymentMethod, customerNote, couponCode,
  } = body

  // Sepeti al
  const key = session?.user
    ? { userId: (session.user as any).id }
    : { sessionId: cookieStore.get('cart_session')?.value ?? '' }

  const cartItems = await prisma.cartItem.findMany({
    where: key,
    include: {
      product: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
    },
  })

  if (cartItems.length === 0) {
    return NextResponse.json({ error: 'Sepetiniz boş' }, { status: 400 })
  }

  // Stok kontrol
  for (const item of cartItems) {
    if (!item.product.isActive || item.product.stock < item.quantity) {
      return NextResponse.json({ error: `"${item.product.name}" ürünü stokta yok` }, { status: 400 })
    }
  }

  // Fiyat hesaplama
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shippingCost = subtotal >= 500 ? 0 : 39.9

  // Kupon
  let discountAmount = 0
  let coupon = null
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
    if (coupon && coupon.isActive && subtotal >= coupon.minOrderAmount) {
      if (!coupon.maxUses || coupon.usedCount < coupon.maxUses) {
        if (coupon.type === 'percentage') {
          discountAmount = (subtotal * coupon.value) / 100
        } else {
          discountAmount = Math.min(coupon.value, subtotal)
        }
      }
    }
  }

  const total = subtotal + shippingCost - discountAmount

  // Sipariş oluştur
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: session?.user ? (session.user as any).id : null,
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      shippingName,
      shippingPhone,
      shippingCity,
      shippingDistrict,
      shippingAddress,
      shippingPostalCode: shippingPostalCode || null,
      subtotal,
      shippingCost,
      discountAmount,
      taxAmount: 0,
      total,
      customerNote: customerNote || null,
      items: {
        create: cartItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          productSku: item.product.sku,
          productImage: item.product.images[0]?.imagePath ?? null,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.product.price * item.quantity,
        })),
      },
      history: {
        create: { status: 'Sipariş alındı', note: 'Sipariş başarıyla oluşturuldu.' },
      },
    },
  })

  // Stokları güncelle
  await Promise.all(
    cartItems.map(item =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    )
  )

  // Kuponu kullanıldı say
  if (coupon) {
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    })
  }

  // Sepeti temizle
  await prisma.cartItem.deleteMany({ where: key })

  return NextResponse.json({ success: true, orderNumber: order.orderNumber, orderId: order.id })
}
