import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const cookieStore = cookies()

  const userId = (session?.user as any)?.id as string | undefined
  const sessionId = cookieStore.get('cart_session')?.value ?? ''

  const allCookies = cookieStore.getAll().map(c => c.name)

  let cartByUserId: any[] = []
  let cartBySessionId: any[] = []

  if (userId) {
    cartByUserId = await prisma.cartItem.findMany({
      where: { userId },
      select: { id: true, quantity: true, productId: true, userId: true, sessionId: true },
    })
  }

  if (sessionId) {
    cartBySessionId = await prisma.cartItem.findMany({
      where: { sessionId },
      select: { id: true, quantity: true, productId: true, userId: true, sessionId: true },
    })
  }

  // DB'deki tüm sepet kayıtlarından son 5 tane
  const recentCartItems = await prisma.cartItem.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, quantity: true, userId: true, sessionId: true, createdAt: true },
  })

  return NextResponse.json({
    loggedIn: !!session?.user,
    userId: userId || null,
    sessionId: sessionId || null,
    cookiesPresent: allCookies,
    cartByUserId,
    cartBySessionId,
    recentCartItemsInDB: recentCartItems,
  }, { status: 200 })
}
