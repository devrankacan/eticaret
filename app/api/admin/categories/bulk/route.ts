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
    // Ürünü olan kategorileri tespit et
    const withProducts = await prisma.category.findMany({
      where: { id: { in: ids }, products: { some: {} } },
      select: { id: true, name: true, _count: { select: { products: true } } },
    })
    if (withProducts.length > 0) {
      const names = withProducts.map(c => `"${c.name}" (${c._count.products} ürün)`).join(', ')
      return NextResponse.json({ error: `Şu kategorilerde ürün var: ${names}. Önce ürünleri taşıyın.` }, { status: 400 })
    }
    // Alt kategorilerin parentId'sini temizle
    await prisma.category.updateMany({ where: { parentId: { in: ids } }, data: { parentId: null } })
    await prisma.category.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ ok: true, count: ids.length })
  }

  return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
}
