import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const STATUS_LABELS: Record<string, string> = {
  pending:    'Beklemede',
  confirmed:  'Onaylandı',
  processing: 'Hazırlanıyor',
  shipped:    'Kargoya Verildi',
  delivered:  'Teslim Edildi',
  cancelled:  'İptal Edildi',
  refunded:   'İade Edildi',
}

const STATUS_STEP: Record<string, number> = {
  pending:    0,
  confirmed:  1,
  processing: 2,
  shipped:    3,
  delivered:  4,
  cancelled:  -1,
  refunded:   -1,
}

export async function GET(req: NextRequest) {
  const no = req.nextUrl.searchParams.get('no')?.trim()
  if (!no) return NextResponse.json({ error: 'Sipariş numarası gerekli' }, { status: 400 })

  const order = await prisma.order.findUnique({
    where: { orderNumber: no },
    select: {
      orderNumber: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      createdAt: true,
      shippedAt: true,
      deliveredAt: true,
      cargoCompany: true,
      cargoTrackingNumber: true,
      cargoTrackingUrl: true,
      total: true,
      shippingCity: true,
    },
  })

  if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı. Sipariş numarasını kontrol edin.' }, { status: 404 })

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status] || order.status,
    statusStep: STATUS_STEP[order.status] ?? 0,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    city: order.shippingCity,
    total: order.total,
    createdAt: order.createdAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    cargo: order.cargoCompany ? {
      company: order.cargoCompany,
      trackingNumber: order.cargoTrackingNumber,
      trackingUrl: order.cargoTrackingUrl
        ? order.cargoTrackingUrl.replace('{tracking_number}', order.cargoTrackingNumber || '')
        : null,
    } : null,
  })
}
