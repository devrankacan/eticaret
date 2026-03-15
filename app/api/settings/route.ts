import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Herkese açık ayarlar - sadece müşterinin görmesi gereken bilgiler
const PUBLIC_KEYS = ['bank_name', 'bank_iban', 'bank_account_holder', 'bank_branch', 'site_name', 'site_phone', 'site_email', 'free_shipping_threshold', 'shipping_cost']

export async function GET() {
  const settings = await prisma.setting.findMany({ where: { key: { in: PUBLIC_KEYS } } })
  const obj: Record<string, string> = {}
  settings.forEach(s => { obj[s.key] = s.value || '' })
  return NextResponse.json(obj)
}
