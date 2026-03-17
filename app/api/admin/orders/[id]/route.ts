import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ORDER_STATUS_LABELS } from '@/lib/utils'
import { sendOrderStatusUpdate } from '@/lib/email'

function isAdmin(session: any): boolean {
  return session?.user?.role === 'admin'
}

// PATCH - sipariş güncelle (durum, kargo, not)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json()
  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })

  const updateData: Record<string, any> = {}

  // Durum güncelle
  if (body.status && body.status !== order.status) {
    updateData.status = body.status
    await prisma.orderHistory.create({
      data: {
        orderId: order.id,
        status: ORDER_STATUS_LABELS[body.status] ?? body.status,
        note: body.note || null,
        createdBy: (session!.user as any).id,
      },
    })
  }

  // Kargo bilgisi
  if (body.cargoCompany && body.cargoTrackingNumber) {
    updateData.cargoCompany = body.cargoCompany
    updateData.cargoTrackingNumber = body.cargoTrackingNumber
    updateData.cargoTrackingUrl = body.cargoTrackingUrl || null
    updateData.status = 'shipped'
    updateData.shippedAt = new Date()

    await prisma.orderHistory.create({
      data: {
        orderId: order.id,
        status: 'Kargoya Verildi',
        note: `${body.cargoCompany} - Takip No: ${body.cargoTrackingNumber}`,
        createdBy: (session!.user as any).id,
      },
    })
  }

  // Havale onayı
  if (body.approvePayment) {
    updateData.paymentStatus = 'paid'
    updateData.status = 'confirmed'
    await prisma.orderHistory.create({
      data: {
        orderId: order.id,
        status: 'Ödeme Onaylandı',
        note: 'Havale/EFT ödeme onaylandı',
        createdBy: (session!.user as any).id,
      },
    })
  }

  // Admin notu
  if (body.adminNote !== undefined) {
    updateData.adminNote = body.adminNote
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: updateData,
    include: { items: true },
  })

  // Status veya kargo güncellemesinde e-posta gönder
  try {
    const hasStatusChange = body.status && body.status !== order.status
    const hasShipping = body.cargoCompany && body.cargoTrackingNumber
    const hasPaymentApproval = body.approvePayment

    if (hasStatusChange || hasShipping || hasPaymentApproval) {
      const statusForEmail = hasShipping ? 'shipped' : hasPaymentApproval ? 'confirmed' : body.status
      const statusLabel = ORDER_STATUS_LABELS[statusForEmail] ?? statusForEmail

      await sendOrderStatusUpdate({
        orderNumber: updated.orderNumber,
        customerName: updated.shippingName,
        customerEmail: updated.customerEmail,
        newStatus: statusForEmail,
        statusLabel,
        note: body.note || null,
        trackingNumber: body.cargoTrackingNumber || null,
        cargoCompany: body.cargoCompany || null,
        trackingUrl: body.cargoTrackingUrl || null,
      })
    }
  } catch (e) {
    console.error('[ORDER STATUS EMAIL ERROR]', e)
  }

  return NextResponse.json({ success: true })
}
