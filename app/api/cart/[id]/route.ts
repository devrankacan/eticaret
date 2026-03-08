import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

async function verifyOwnership(itemId: string) {
  const session = await getServerSession(authOptions)
  const cookieStore = cookies()

  const item = await prisma.cartItem.findUnique({ where: { id: itemId } })
  if (!item) return null

  if (session?.user) {
    if (item.userId !== (session.user as any).id) return null
  } else {
    const sessionId = cookieStore.get('cart_session')?.value
    if (item.sessionId !== sessionId) return null
  }

  return item
}

// PATCH - miktar güncelle
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const item = await verifyOwnership(params.id)
  if (!item) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const { quantity } = await req.json()
  const product = await prisma.product.findUnique({ where: { id: item.productId } })

  await prisma.cartItem.update({
    where: { id: params.id },
    data: { quantity: Math.min(Math.max(1, quantity), product?.stock ?? 1) },
  })

  return NextResponse.json({ success: true })
}

// DELETE - sepetten kaldır
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await verifyOwnership(params.id)
  if (!item) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  await prisma.cartItem.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
