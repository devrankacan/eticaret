import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return false
  return true
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const q = searchParams.get('q') || ''
  const limit = 20
  const where = q
    ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
    : {}
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])
  return NextResponse.json({ users, total, pages: Math.ceil(total / limit) })
}
