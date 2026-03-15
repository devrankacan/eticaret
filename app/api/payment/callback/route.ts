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

      return NextResponse.redirect(`${baseUrl}/siparis-basarili?payment=failed`)
    }

    // HalkÖde POST callback (return_url POST)
    if (provider === 'halkode' || provider === 'halkbank') {
      const allParams: Record<string, string> = {}
      params.forEach((v, k) => { allParams[k] = v })
      console.log('[HalkOde POST callback] params:', JSON.stringify(allParams))

      const invoiceId = params.get('invoice_id') || ''
      const statusCode = params.get('status_code') || ''
      const mdStatus = params.get('md_status') || ''
      const paymentId = params.get('payment_id') || params.get('order_id') || ''

      if (invoiceId && (statusCode === '00' || statusCode === '100') && mdStatus === '1') {
        const updatedOrder = await prisma.order.update({
          where: { orderNumber: invoiceId },
          data: { paymentStatus: 'paid', paymentRef: paymentId, status: 'confirmed' },
          select: { userId: true },
        })
        if (updatedOrder.userId) {
          await prisma.cartItem.deleteMany({ where: { userId: updatedOrder.userId } })
        }
        return NextResponse.redirect(`${baseUrl}/siparis-basarili?no=${invoiceId}`)
      }

      return NextResponse.redirect(`${baseUrl}/siparis-basarili?payment=failed${invoiceId ? `&no=${invoiceId}` : ''}`)
    }

    return new NextResponse('OK', { status: 200 })
  } catch (e: any) {
    console.error('Payment callback error:', e)
    const baseUrl = process.env.NEXTAUTH_URL || ''
    return NextResponse.redirect(`${baseUrl}/siparis-basarili?payment=failed`)
  }
}

// ── HalkÖde 3D Secure GET Callback ────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const settings = await getAllSettings()
    const provider = settings.payment_provider
    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const qp = req.nextUrl.searchParams

    if (provider === 'halkode' || provider === 'halkbank') {
      // Log all params for debugging
      const allParams: Record<string, string> = {}
      qp.forEach((v, k) => { allParams[k] = v })
      console.log('[HalkOde GET callback] params:', JSON.stringify(allParams))

      const invoiceId = qp.get('invoice_id') || ''
      const statusCode = qp.get('status_code') || ''
      const mdStatus = qp.get('md_status') || ''
      const paymentId = qp.get('payment_id') || qp.get('order_id') || ''

      if (invoiceId && (statusCode === '00' || statusCode === '100') && mdStatus === '1') {
        const updatedOrder = await prisma.order.update({
          where: { orderNumber: invoiceId },
          data: {
            paymentStatus: 'paid',
            paymentRef: paymentId,
            status: 'confirmed',
          },
          select: { userId: true },
        })
        // Ödeme başarılı → sepeti temizle
        if (updatedOrder.userId) {
          await prisma.cartItem.deleteMany({ where: { userId: updatedOrder.userId } })
        }
        return NextResponse.redirect(`${baseUrl}/siparis-basarili?no=${invoiceId}`)
      }

      return NextResponse.redirect(`${baseUrl}/siparis-basarili?payment=failed${invoiceId ? `&no=${invoiceId}` : ''}`)
    }

    return NextResponse.redirect(`${baseUrl}/siparis-basarili?payment=failed`)
  } catch (e: any) {
    console.error('Payment GET callback error:', e)
    const baseUrl = process.env.NEXTAUTH_URL || ''
    return NextResponse.redirect(`${baseUrl}/siparis-basarili?payment=failed`)
  }
}
