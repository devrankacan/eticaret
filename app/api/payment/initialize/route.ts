import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAllSettings } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

    const settings = await getAllSettings()
    const provider = settings.payment_provider
    const apiKey = settings.payment_api_key
    const secretKey = settings.payment_secret_key
    const mode = settings.payment_mode || 'sandbox'

    if (!provider || !apiKey || !secretKey || settings.payment_enabled !== '1') {
      return NextResponse.json({ error: 'Ödeme entegrasyonu aktif değil' }, { status: 400 })
    }

    const body = await req.json()
    const { orderId } = body

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { email: true, name: true } } },
    })
    if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })

    const callbackUrl = `${process.env.NEXTAUTH_URL || req.nextUrl.origin}/api/payment/callback`

    // ── iyzico ──────────────────────────────────────────────────────────────
    if (provider === 'iyzico') {
      const Iyzipay = require('iyzipay')
      const iyzipay = new Iyzipay({
        apiKey,
        secretKey,
        uri: mode === 'live' ? 'https://api.iyzipay.com' : 'https://sandbox-api.iyzipay.com',
      })

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: order.orderNumber,
        price: order.total.toFixed(2),
        paidPrice: order.total.toFixed(2),
        currency: Iyzipay.CURRENCY.TRY,
        basketId: order.id,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl,
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: {
          id: order.userId || order.orderNumber,
          name: order.shippingName.split(' ')[0] || 'Müşteri',
          surname: order.shippingName.split(' ').slice(1).join(' ') || 'Soyad',
          gsmNumber: order.shippingPhone,
          email: order.user?.email || 'musteri@example.com',
          identityNumber: '11111111111',
          registrationAddress: order.shippingAddress,
          city: order.shippingCity,
          country: 'Turkey',
          zipCode: order.shippingPostalCode || '00000',
        },
        shippingAddress: {
          contactName: order.shippingName,
          city: order.shippingCity,
          country: 'Turkey',
          address: order.shippingAddress,
          zipCode: order.shippingPostalCode || '00000',
        },
        billingAddress: {
          contactName: order.shippingName,
          city: order.shippingCity,
          country: 'Turkey',
          address: order.shippingAddress,
          zipCode: order.shippingPostalCode || '00000',
        },
        basketItems: order.items.map((item, i) => ({
          id: item.id,
          name: item.productName,
          category1: 'Ürün',
          itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
          price: item.totalPrice.toFixed(2),
        })),
      }

      return new Promise((resolve) => {
        iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
          if (err || result.status !== 'success') {
            resolve(NextResponse.json({ error: result?.errorMessage || 'Ödeme başlatılamadı' }, { status: 400 }))
          } else {
            resolve(NextResponse.json({
              provider: 'iyzico',
              checkoutFormContent: result.checkoutFormContent,
              token: result.token,
            }))
          }
        })
      })
    }

    // ── Stripe ──────────────────────────────────────────────────────────────
    if (provider === 'stripe') {
      const Stripe = require('stripe')
      const stripe = new Stripe(secretKey)
      const session2 = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: order.items.map(item => ({
          price_data: {
            currency: 'try',
            product_data: { name: item.productName },
            unit_amount: Math.round(item.unitPrice * 100),
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/siparis-basarili?no=${order.orderNumber}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/odeme`,
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
      })
      return NextResponse.json({ provider: 'stripe', redirectUrl: session2.url })
    }

    return NextResponse.json({ error: 'Desteklenmeyen ödeme sağlayıcısı' }, { status: 400 })
  } catch (e: any) {
    console.error('Payment init error:', e)
    return NextResponse.json({ error: 'Ödeme başlatılamadı: ' + (e.message || 'Bilinmeyen hata') }, { status: 500 })
  }
}
