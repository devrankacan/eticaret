import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
  const session = await getServerSession(authOptions)
  const cookieStore = cookies()

  const key = session?.user
    ? { userId: (session.user as any).id }
    : { sessionId: cookieStore.get('cart_session')?.value ?? '' }

  if (!key.sessionId && !('userId' in key)) {
    return NextResponse.json({ count: 0 })
  }

  const result = await prisma.cartItem.aggregate({
    where: key,
    _sum: { quantity: true },
  })

  return NextResponse.json({ count: result._sum.quantity ?? 0 })
}
