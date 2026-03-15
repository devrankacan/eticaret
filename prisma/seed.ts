import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed başlatılıyor...')

  // ─── Admin kullanıcı ────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Atesoglu.79', 10)
  const existingAdmin = await prisma.user.findFirst({
    where: { OR: [{ email: 'admin@site.com' }, { email: 'info@atesoglusut.com' }, { role: 'admin' }] }
  })
  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { email: 'info@atesoglusut.com', password: hashedPassword, role: 'admin' }
    })
  } else {
    await prisma.user.create({
      data: { email: 'info@atesoglusut.com', name: 'Admin', password: hashedPassword, role: 'admin' }
    })
  }

  // ─── Kargo firmaları ─────────────────────────────────────
  await prisma.cargoCompany.upsert({
    where: { code: 'yurtici' },
    update: {},
    create: {
      name: 'Yurtiçi Kargo', code: 'yurtici',
      trackingUrl: 'https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code={tracking_number}',
      baseShippingCost: 39.90, freeShippingThreshold: 500, isActive: true, isDefault: true,
    },
  })
  await prisma.cargoCompany.upsert({
    where: { code: 'aras' },
    update: {},
    create: {
      name: 'Aras Kargo', code: 'aras',
      trackingUrl: 'https://www.araskargo.com.tr/hizmetler/gonderitakip.aspx?tkn={tracking_number}',
      baseShippingCost: 39.90, isActive: true, isDefault: false,
    },
  })

  // ─── Site ayarları ────────────────────────────────────────
  const settings = [
    { key: 'site_name',              value: 'Ateşoğlu Süt ve Süt Ürünleri', group: 'general' },
    { key: 'site_logo',              value: '',                   group: 'general' },
    { key: 'site_phone',             value: '',                   group: 'general' },
    { key: 'site_email',             value: 'info@atesoglusut.com', group: 'general' },
    { key: 'site_whatsapp',          value: '',                   group: 'general' },
    { key: 'free_shipping_threshold',value: '500',                group: 'shipping' },
    { key: 'shipping_cost',          value: '39.90',              group: 'shipping' },
    { key: 'payment_credit_card',    value: 'false',              group: 'payment' },
    { key: 'payment_bank_transfer',  value: 'true',               group: 'payment' },
    { key: 'payment_cash_on_delivery', value: 'true',             group: 'payment' },
    { key: 'tax_rate',               value: '8',                  group: 'general' },
  ]
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
  }

  console.log('✅ Seed tamamlandı! Admin, kargo şirketleri ve site ayarları güncellendi.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
