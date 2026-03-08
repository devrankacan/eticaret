import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

  const addresses = await prisma.address.findMany({
    where: { userId: (session.user as any).id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ addresses })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()
  const { title, name, phone, city, district, neighborhood, address, postalCode, isDefault } = body

  if (!title || !name || !phone || !city || !district || !address) {
    return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 })
  }

  // Eğer varsayılan yapılacaksa diğerlerini kaldır
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
  }

  const created = await prisma.address.create({
    data: { userId, title, name, phone, city, district, neighborhood: neighborhood || null, address, postalCode: postalCode || null, isDefault: isDefault || false },
  })

  return NextResponse.json({ address: created })
}
