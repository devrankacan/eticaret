import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return false
  return true
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const pages = await prisma.page.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })
  return NextResponse.json(pages)
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const data = await req.json()

  const rawSlug = (data.slug || data.title || 'sayfa')
  const slug = rawSlug
    .toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  const page = await prisma.page.create({
    data: {
      title: data.title,
      slug,
      content: data.content || '',
      excerpt: data.excerpt || null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      isActive: data.isActive ?? true,
      showInNav: data.showInNav ?? false,
      navLabel: data.navLabel || null,
      sortOrder: data.sortOrder ?? 0,
    },
  })
  return NextResponse.json(page)
}
