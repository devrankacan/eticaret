'use server'

import { prisma } from './prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { cookies } from 'next/headers'

function getSessionId(): string {
  const cookieStore = cookies()
  let sessionId = cookieStore.get('cart_session')?.value
  if (!sessionId) {
    sessionId = crypto.randomUUID()
  }
  return sessionId
}

async function getCartKey() {
  const session = await getServerSession(authOptions)
  if (session?.user) {
    return { userId: (session.user as any).id as string }
  }
  return { sessionId: getSessionId() }
}

export async function getCartItems() {
  const key = await getCartKey()
  return prisma.cartItem.findMany({
    where: key,
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getCartCount(): Promise<number> {
  const key = await getCartKey()
  const result = await prisma.cartItem.aggregate({
    where: key,
    _sum: { quantity: true },
  })
  return result._sum.quantity ?? 0
}
