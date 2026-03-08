import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function verifyOwner(id: string, userId: string) {
  const addr = await prisma.address.findUnique({ where: { id } })
  return addr?.userId === userId ? addr : null
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

  const userId = (session.user as any).id
  const addr = await verifyOwner(params.id, userId)
  if (!addr) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const body = await req.json()
  const { title, name, phone, city, district, neighborhood, address, postalCode, isDefault } = body

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
  }

  const updated = await prisma.address.update({
    where: { id: params.id },
    data: { title, name, phone, city, district, neighborhood: neighborhood || null, address, postalCode: postalCode || null, isDefault: isDefault || false },
  })

  return NextResponse.json({ address: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

  const userId = (session.user as any).id
  const addr = await verifyOwner(params.id, userId)
  if (!addr) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  await prisma.address.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
