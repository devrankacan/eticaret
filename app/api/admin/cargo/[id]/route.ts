import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const body = await req.json()

  // Varsayılan seçilirse diğerlerini kaldır
  if (body.isDefault) {
    await prisma.cargoCompany.updateMany({
      where: { id: { not: params.id } },
      data: { isDefault: false },
    })
  }

  const updateData: Record<string, any> = {
    apiUrl: body.apiUrl || null,
    apiUser: body.apiUser || null,
    customerNumber: body.customerNumber || null,
    trackingUrl: body.trackingUrl || null,
    freeShippingThreshold: body.freeShippingThreshold ?? null,
    baseShippingCost: body.baseShippingCost ?? 0,
    isActive: Boolean(body.isActive),
    isDefault: Boolean(body.isDefault),
  }

  // Şifre sadece dolu gelirse güncelle
  if (body.apiPassword) {
    updateData.apiPassword = body.apiPassword
  }

  await prisma.cargoCompany.update({ where: { id: params.id }, data: updateData })

  return NextResponse.json({ success: true })
}
