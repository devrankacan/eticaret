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

  // Sepeti al — userId yoksa veya userId sepeti boşsa sessionId ile dene
  const userId = session?.user ? (session.user as any).id as string : undefined
  const sessionId = cookieStore.get('cart_session')?.value ?? ''

  const include = {
    product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
  } as const

  let cartItems = userId
    ? await prisma.cartItem.findMany({ where: { userId }, include })
    : []

  if (cartItems.length === 0 && sessionId) {
    cartItems = await prisma.cartItem.findMany({ where: { sessionId }, include })
  }

  if (cartItems.length === 0) {
    return NextResponse.json({ error: 'Sepetiniz boş' }, { status: 400 })
  }

  // Hangi key ile bulunduysak onu sileceğiz
  const deleteKey = cartItems[0].userId ? { userId: cartItems[0].userId } : { sessionId: cartItems[0].sessionId! }

  // Stok kontrol
  for (const item of cartItems) {
    if (!item.product.isActive || item.product.stock < item.quantity) {
      return NextResponse.json({ error: `"${item.product.name}" ürünü stokta yok` }, { status: 400 })
    }
  }

  // Ayarları çek
  const settingRows = await prisma.setting.findMany({
    where: { key: { in: ['min_order_amount', 'free_shipping_threshold'] } },
  })
  const settingsMap = Object.fromEntries(settingRows.map(s => [s.key, s.value ?? '']))
  const minOrderAmount = parseFloat(settingsMap.min_order_amount || '0') || 0
  const freeShippingThreshold = parseFloat(settingsMap.free_shipping_threshold || '0') || 0

  // Fiyat hesaplama
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  // Minimum sipariş tutarı kontrolü
  if (minOrderAmount > 0 && subtotal < minOrderAmount) {
    return NextResponse.json(
      { error: `Minimum sipariş tutarı ${minOrderAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺'dir. Sepetinize ürün ekleyiniz.` },
      { status: 400 }
    )
  }

  const shippingCost = (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) ? 0 : 250

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

  // Kredi kartı ödemesinde sepeti henüz silme — ödeme callback'de silinecek
  // (3D Secure başarısız olursa kullanıcı tekrar deneyebilsin)
  const isCreditCard = paymentMethod === 'credit_card'
  if (!isCreditCard) {
    await prisma.cartItem.deleteMany({ where: deleteKey })
  }

  return NextResponse.json({ success: true, orderNumber: order.orderNumber, orderId: order.id })
}
