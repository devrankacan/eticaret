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

    const body = await req.text()
    const params = new URLSearchParams(body)
    const token = params.get('token')
    const status = params.get('status')

    if (provider === 'iyzico') {
      if (!token) return new NextResponse('Bad Request', { status: 400 })

      const Iyzipay = require('iyzipay')
      const iyzipay = new Iyzipay({
        apiKey,
        secretKey,
        uri: mode === 'live' ? 'https://api.iyzipay.com' : 'https://sandbox-api.iyzipay.com',
      })

      const result: any = await new Promise((resolve) => {
        iyzipay.checkoutForm.retrieve({ locale: 'tr', token }, (err: any, res: any) => {
          resolve(err || res)
        })
      })

      if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
        const orderNumber = result.basketId
          ? (await prisma.order.findUnique({ where: { id: result.basketId }, select: { orderNumber: true } }))?.orderNumber
          : result.conversationId

        if (orderNumber) {
          await prisma.order.update({
            where: { orderNumber },
            data: {
              paymentStatus: 'paid',
              paymentRef: result.paymentId,
              status: 'confirmed',
            },
          })
          return NextResponse.redirect(
            new URL(`${process.env.NEXTAUTH_URL}/siparis-basarili?no=${orderNumber}`)
          )
        }
      }

      // Başarısız ödeme
      return NextResponse.redirect(new URL(`${process.env.NEXTAUTH_URL}/odeme?payment=failed`))
    }

    return new NextResponse('OK', { status: 200 })
  } catch (e: any) {
    console.error('Payment callback error:', e)
    return new NextResponse('Error', { status: 500 })
  }
}

// Stripe webhook için GET
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL(`${process.env.NEXTAUTH_URL || '/'}`))
}
