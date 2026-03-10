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
    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin

    const body = await req.text()
    const params = new URLSearchParams(body)
    const token = params.get('token')

    if (provider === 'iyzico') {
      if (!token) {
        return NextResponse.redirect(`${baseUrl}/odeme?payment=failed`)
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Iyzipay = require('iyzipay')
      const iyzipay = new Iyzipay({
        apiKey,
        secretKey,
        uri: mode === 'live'
          ? 'https://api.iyzipay.com'
          : 'https://sandbox-api.iyzipay.com',
      })

      const result: any = await new Promise((resolve) => {
        iyzipay.checkoutForm.retrieve(
          { locale: 'tr', token },
          (err: any, res: any) => resolve(err || res)
        )
      })

      if (result?.status === 'success' && result?.paymentStatus === 'SUCCESS') {
        // Siparişi bul - basketId = orderId, conversationId = orderNumber
        let orderNumber = result.conversationId
        if (result.basketId) {
          const found = await prisma.order.findUnique({
            where: { id: result.basketId },
            select: { orderNumber: true },
          })
          if (found) orderNumber = found.orderNumber
        }

        if (orderNumber) {
          await prisma.order.update({
            where: { orderNumber },
            data: {
              paymentStatus: 'paid',
              paymentRef: String(result.paymentId || ''),
              status: 'confirmed',
            },
          })
          return NextResponse.redirect(`${baseUrl}/siparis-basarili?no=${orderNumber}`)
        }
      }

      return NextResponse.redirect(`${baseUrl}/odeme?payment=failed`)
    }

    return new NextResponse('OK', { status: 200 })
  } catch (e: any) {
    console.error('Payment callback error:', e)
    const baseUrl = process.env.NEXTAUTH_URL || ''
    return NextResponse.redirect(`${baseUrl}/odeme?payment=failed`)
  }
}

export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 })
}
