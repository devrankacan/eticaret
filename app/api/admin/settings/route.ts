import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidateSettings } from '@/lib/utils'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return false
  return true
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } })
  // Obje formatına çevir
  const obj: Record<string, string> = {}
  settings.forEach(s => { obj[s.key] = s.value || '' })
  return NextResponse.json(obj)
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const data = await req.json()
  // Toplu kaydet (upsert)
  const ops = Object.entries(data).map(([key, value]) =>
    prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value), group: key.startsWith('social_') ? 'social' : key.startsWith('seo_') ? 'seo' : 'general' },
    })
  )
  await Promise.all(ops)
  await revalidateSettings()
  return NextResponse.json({ ok: true })
}
