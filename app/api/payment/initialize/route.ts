import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllSettings } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
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
      include: {
        items: true,
        user: { select: { email: true } },
      },
    })
    if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })

    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const callbackUrl = `${baseUrl}/api/payment/callback`

    // ── iyzico ──────────────────────────────────────────────────────────────
    if (provider === 'iyzico') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Iyzipay = require('iyzipay')
      const iyzipay = new Iyzipay({
        apiKey,
        secretKey,
        uri: mode === 'live'
          ? 'https://api.iyzipay.com'
          : 'https://sandbox-api.iyzipay.com',
      })

      const buyerName = order.shippingName.trim() || 'Müşteri'
      const nameParts = buyerName.split(' ')
      const firstName = nameParts[0] || 'Müşteri'
      const lastName = nameParts.slice(1).join(' ') || 'Soyad'

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
          name: firstName,
          surname: lastName,
          gsmNumber: order.shippingPhone,
          email: order.user?.email || 'musteri@iyzipay.com',
          identityNumber: '11111111111',
          registrationAddress: order.shippingAddress,
          city: order.shippingCity,
          country: 'Turkey',
          zipCode: order.shippingPostalCode || '00000',
        },
        shippingAddress: {
          contactName: buyerName,
          city: order.shippingCity,
          country: 'Turkey',
          address: order.shippingAddress,
          zipCode: order.shippingPostalCode || '00000',
        },
        billingAddress: {
          contactName: buyerName,
          city: order.shippingCity,
          country: 'Turkey',
          address: order.shippingAddress,
          zipCode: order.shippingPostalCode || '00000',
        },
        basketItems: order.items.map((item) => ({
          id: item.id,
          name: item.productName.substring(0, 100),
          category1: 'Ürün',
          itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
          price: item.totalPrice.toFixed(2),
        })),
      }

      return new Promise<NextResponse>((resolve) => {
        iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
          if (err || result?.status !== 'success') {
            resolve(NextResponse.json(
              { error: result?.errorMessage || 'Ödeme başlatılamadı' },
              { status: 400 }
            ))
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

    // ── Halkbank Sanal POS 3D Secure ──────────────────────────────────────
    if (provider === 'halkbank') {
      const clientId = settings.payment_merchant_id
      const storeKey = settings.payment_secret_key

      if (!clientId || !storeKey) {
        return NextResponse.json({ error: 'Halkbank bilgileri eksik' }, { status: 400 })
      }

      const amount = order.total.toFixed(2)
      const oid = order.orderNumber
      const okUrl = callbackUrl
      const failUrl = callbackUrl
      const rnd = Date.now().toString()
      const islemtipi = 'Auth'
      const taksit = ''
      const currency = '949'

      const crypto = require('crypto')
      const hashStr = clientId + oid + amount + okUrl + failUrl + islemtipi + taksit + rnd + storeKey
      const hash = Buffer.from(
        crypto.createHash('sha1').update(hashStr, 'utf8').digest()
      ).toString('base64')

      const gatewayUrl = mode === 'live'
        ? 'https://spos.halkbank.com.tr/fim/est3Dgate'
        : 'https://entegrasyon.halkbank.com.tr/fim/est3Dgate'

      const formHtml = `
        <html><body>
        <form id="hbForm" method="POST" action="${gatewayUrl}">
          <input type="hidden" name="clientid" value="${clientId}" />
          <input type="hidden" name="storetype" value="3d_pay_hosting" />
          <input type="hidden" name="amount" value="${amount}" />
          <input type="hidden" name="currency" value="${currency}" />
          <input type="hidden" name="oid" value="${oid}" />
          <input type="hidden" name="okUrl" value="${okUrl}" />
          <input type="hidden" name="failUrl" value="${failUrl}" />
          <input type="hidden" name="lang" value="tr" />
          <input type="hidden" name="rnd" value="${rnd}" />
          <input type="hidden" name="hash" value="${hash}" />
          <input type="hidden" name="islemtipi" value="${islemtipi}" />
          <input type="hidden" name="taksit" value="${taksit}" />
        </form>
        <script>document.getElementById('hbForm').submit();</script>
        </body></html>
      `

      return NextResponse.json({
        provider: 'halkbank',
        formHtml,
      })
    }

    // ── PayTR ─────────────────────────────────────────────────────────────
    if (provider === 'paytr') {
      return NextResponse.json(
        { error: 'PayTR entegrasyonu yakında eklenecek' },
        { status: 501 }
      )
    }

    return NextResponse.json({ error: 'Desteklenmeyen ödeme sağlayıcısı' }, { status: 400 })
  } catch (e: any) {
    console.error('Payment init error:', e)
    return NextResponse.json(
      { error: 'Ödeme başlatılamadı: ' + (e?.message || 'Bilinmeyen hata') },
      { status: 500 }
    )
  }
}
