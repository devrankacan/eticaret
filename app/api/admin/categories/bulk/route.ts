import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return false
  return true
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const { action, ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'ID listesi boş' }, { status: 400 })

  if (action === 'delete') {
    await prisma.category.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ ok: true, count: ids.length })
  }

  return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
}
