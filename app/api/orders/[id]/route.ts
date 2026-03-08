import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: (session.user as any).id },
    include: {
      items: true,
      history: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!order) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })

  return NextResponse.json({ order })
}
