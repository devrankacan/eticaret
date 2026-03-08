import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return false
  }
  return true
}

export async function GET() {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(banners)
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const data = await req.json()
  const banner = await prisma.banner.create({
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
