import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllSettings } from '@/lib/utils'
import crypto from 'crypto'

function generateHashKey(
  total: string,
  installment: string,
  currencyCode: string,
  merchantKey: string,
  invoiceId: string,
  appSecret: string
): string {
  const data = `${total}|${installment}|${currencyCode}|${merchantKey}|${invoiceId}`
  const iv = crypto.createHash('sha1').update(Math.random().toString()).digest('hex').slice(0, 16)
  const password = crypto.createHash('sha1').update(appSecret).digest('hex')
  const salt = crypto.createHash('sha1').update(Math.random().toString()).digest('hex').slice(0, 4)
  const saltWithPassword = crypto.createHash('sha256').update(password + salt).digest('hex')
  const cipher = crypto.createCipheriv('aes-256-cbc', saltWithPassword.slice(0, 32), iv)
  let encrypted = cipher.update(data, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return `${iv}:${salt}:${encrypted}`.replace(/\//g, '__')
}

export async function POST(req: NextRequest) {
  try {
    const settings = await getAllSettings()
    const provider = settings.payment_provider
    const appKey = settings.payment_api_key
    const appSecret = settings.payment_secret_key
    const merchantKey = settings.payment_merchant_key
    const merchantId = settings.payment_merchant_id
    const mode = settings.payment_mode || 'sandbox'

    if (!provider || !appKey || !appSecret || settings.payment_enabled !== '1') {
      return NextResponse.json({ error: 'Ödeme entegrasyonu aktif değil' }, { status: 400 })
    }

    const body = await req.json()
    const { orderId, ccHolderName, ccNo, expiryMonth, expiryYear, cvv } = body

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { email: true } } },
    })
    if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })

    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const callbackUrl = `${baseUrl}/api/payment/callback`

    // ── HalkÖde ─────────────────────────────────────────────────────────────
    if (provider === 'halkbank' || provider === 'halkode') {
      if (!merchantKey) {
        return NextResponse.json({ error: 'Üye İşyeri Anahtarı eksik' }, { status: 400 })
      }

      const gatewayUrl = mode === 'live'
        ? 'https://app.halkode.com.tr/ccpayment/api/paySmart3D'
        : 'https://testapp.halkode.com.tr/ccpayment/api/paySmart3D'

      const invoiceId = order.orderNumber
      const installment = '1'
      const currencyCode = 'TRY'

      // Use order.total as-is and send a single summary item to guarantee
      // sum(items) == total (avoids all floating-point mismatch issues)
      const total = order.total.toFixed(2)
      const paymentItems = [{
        name: `Sipariş #${invoiceId}`,
        price: total,
        quantity: 1,
        description: `Sipariş #${invoiceId}`,
      }]

      const hashKey = generateHashKey(total, installment, currencyCode, merchantKey, invoiceId, appSecret)

      const nameParts = (order.shippingName || 'Müşteri').split(' ')
      const firstName = nameParts[0] || 'Müşteri'
      const lastName = nameParts.slice(1).join(' ') || 'Soyad'

      const payload = {
        cc_holder_name: ccHolderName,
        cc_no: ccNo.replace(/\s/g, ''),
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        cvv,
        total,
        currency_code: currencyCode,
        installments_number: parseInt(installment),
        invoice_id: invoiceId,
        invoice_description: `Sipariş #${invoiceId}`,
        transaction_type: 'Auth',
        merchant_key: merchantKey,
        hash_key: hashKey,
        name: firstName,
        surname: lastName,
        items: paymentItems,
        return_url: callbackUrl,
        cancel_url: callbackUrl,
      }

      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': appKey,
        },
        body: JSON.stringify(payload),
      })

      const text = await response.text()
      let result: any
      try { result = JSON.parse(text) } catch { result = { data: text } }

      if (!response.ok) {
        return NextResponse.json({ error: result?.message || 'HalkÖde bağlantı hatası' }, { status: 400 })
      }

      // 3D yönlendirme HTML'i veya redirect URL
      if (result?.data && typeof result.data === 'string' && result.data.includes('<form')) {
        return NextResponse.json({ provider: 'halkode', formHtml: result.data })
      }
      if (result?.data?.redirect_url) {
        return NextResponse.json({ provider: 'halkode', redirectUrl: result.data.redirect_url })
      }
      if (typeof result?.data === 'string') {
        return NextResponse.json({ provider: 'halkode', formHtml: result.data })
      }

      return NextResponse.json({ error: result?.message || 'Ödeme başlatılamadı' }, { status: 400 })
    }

    // ── iyzico ──────────────────────────────────────────────────────────────
    if (provider === 'iyzico') {
      const Iyzipay = require('iyzipay')
      const iyzipay = new Iyzipay({
        apiKey: appKey,
        secretKey: appSecret,
        uri: mode === 'live' ? 'https://api.iyzipay.com' : 'https://sandbox-api.iyzipay.com',
      })
      const buyerName = order.shippingName.trim() || 'Müşteri'
      const nameParts = buyerName.split(' ')
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
          name: nameParts[0] || 'Müşteri',
          surname: nameParts.slice(1).join(' ') || 'Soyad',
          gsmNumber: order.shippingPhone,
          email: order.user?.email || 'musteri@iyzipay.com',
          identityNumber: '11111111111',
          registrationAddress: order.shippingAddress,
          city: order.shippingCity,
          country: 'Turkey',
          zipCode: order.shippingPostalCode || '00000',
        },
        shippingAddress: { contactName: buyerName, city: order.shippingCity, country: 'Turkey', address: order.shippingAddress, zipCode: order.shippingPostalCode || '00000' },
        billingAddress: { contactName: buyerName, city: order.shippingCity, country: 'Turkey', address: order.shippingAddress, zipCode: order.shippingPostalCode || '00000' },
        basketItems: order.items.map(item => ({
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
            resolve(NextResponse.json({ error: result?.errorMessage || 'Ödeme başlatılamadı' }, { status: 400 }))
          } else {
            resolve(NextResponse.json({ provider: 'iyzico', checkoutFormContent: result.checkoutFormContent, token: result.token }))
          }
        })
      })
    }

    return NextResponse.json({ error: 'Desteklenmeyen ödeme sağlayıcısı' }, { status: 400 })
  } catch (e: any) {
    console.error('Payment init error:', e)
    return NextResponse.json({ error: 'Ödeme başlatılamadı: ' + (e?.message || 'Bilinmeyen hata') }, { status: 500 })
  }
}
