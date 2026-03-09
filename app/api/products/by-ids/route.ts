import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids')
  if (!ids) return NextResponse.json([])

  const idList = ids.split(',').filter(Boolean).slice(0, 100)
  if (idList.length === 0) return NextResponse.json([])

  const products = await prisma.product.findMany({
    where: { id: { in: idList }, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      stock: true,
      lowStockThreshold: true,
      images: {
        select: { id: true, imagePath: true, isPrimary: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return NextResponse.json(products)
}
