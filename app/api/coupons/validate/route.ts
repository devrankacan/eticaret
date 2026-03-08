import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json()

  if (!code) return NextResponse.json({ error: 'Kupon kodu gerekli' }, { status: 400 })

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: 'Geçersiz kupon kodu' }, { status: 400 })
  }

  const now = new Date()
  if (coupon.startsAt && coupon.startsAt > now) {
    return NextResponse.json({ error: 'Kupon henüz aktif değil' }, { status: 400 })
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return NextResponse.json({ error: 'Kuponun süresi dolmuş' }, { status: 400 })
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: 'Kupon kullanım limiti dolmuş' }, { status: 400 })
  }
  if (subtotal < coupon.minOrderAmount) {
    return NextResponse.json({
      error: `Bu kupon için minimum sipariş tutarı ${coupon.minOrderAmount} TL`,
    }, { status: 400 })
  }

  let discount = 0
  if (coupon.type === 'percentage') {
    discount = (subtotal * coupon.value) / 100
  } else {
    discount = Math.min(coupon.value, subtotal)
  }

  return NextResponse.json({ discount: Math.round(discount * 100) / 100, couponId: coupon.id })
}
