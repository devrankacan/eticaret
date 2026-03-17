import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidateSettings } from '@/lib/utils'

// Tek seferlik DB düzeltme endpoint'i
// Kullanım: /api/init-db?key=eticaret2024
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'eticaret2024') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const updates = [
    { key: 'free_shipping_threshold', value: '3500', group: 'shipping' },
    { key: 'shipping_cost', value: '250', group: 'shipping' },
  ]

  const results: Record<string, string> = {}
  for (const u of updates) {
    await prisma.setting.upsert({
      where: { key: u.key },
      update: { value: u.value },
      create: { key: u.key, value: u.value, group: u.group },
    })
    results[u.key] = u.value
  }

  // CargoCompany tablosundaki eşiği ve kargo ücretini güncelle
  await prisma.cargoCompany.updateMany({
    data: { freeShippingThreshold: 3500, baseShippingCost: 250 },
  })

  await revalidateSettings()

  // Mevcut değerleri kontrol et
  const all = await prisma.setting.findMany({
    where: { key: { in: ['free_shipping_threshold', 'shipping_cost'] } },
  })
  const cargo = await prisma.cargoCompany.findMany({ select: { name: true, freeShippingThreshold: true } })

  return NextResponse.json({ ok: true, updated: results, current: all, cargo })
}
