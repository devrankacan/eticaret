import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() || ''

  if (q.length < 2) return NextResponse.json({ products: [] })

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      name: { contains: q, mode: 'insensitive' },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: { where: { isPrimary: true }, take: 1, select: { imagePath: true } },
    },
    take: 6,
    orderBy: { views: 'desc' },
  })

  return NextResponse.json({ products })
}
