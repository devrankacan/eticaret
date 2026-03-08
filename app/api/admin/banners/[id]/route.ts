import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return false
  return true
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const data = await req.json()
  const banner = await prisma.banner.update({
    where: { id: params.id },
    data: {
      title: data.title || null,
      imageDesktop: data.imageDesktop,
      imageMobile: data.imageMobile || null,
      link: data.link || null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  })
  return NextResponse.json(banner)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  await prisma.banner.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
