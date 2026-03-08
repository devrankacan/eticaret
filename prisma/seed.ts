import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed başlıyor...')

  // Admin kullanıcısı
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@site.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@site.com',
      password: hashedPassword,
      role: 'admin',
    },
  })
  console.log('✅ Admin oluşturuldu:', admin.email)

  // Kargo firmaları
  await prisma.cargoCompany.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Yurtiçi Kargo',
        code: 'yurtici',
        trackingUrl: 'https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code={tracking_number}',
        freeShippingThreshold: 500,
        baseShippingCost: 29.90,
        isActive: true,
        isDefault: true,
      },
      {
        name: 'Aras Kargo',
        code: 'aras',
        trackingUrl: 'https://www.araskargo.com.tr/pages/kargo-takip.aspx?q={tracking_number}',
        baseShippingCost: 34.90,
        isActive: true,
        isDefault: false,
      },
      {
        name: 'MNG Kargo',
        code: 'mng',
        trackingUrl: 'https://www.mngkargo.com.tr/wps/portal/mng/main/gonderitakip?durum=TAKIP&takipNo={tracking_number}',
        baseShippingCost: 34.90,
        isActive: true,
        isDefault: false,
      },
    ],
  })
  console.log('✅ Kargo firmaları oluşturuldu')

  // Site ayarları
  const defaultSettings = [
    { key: 'site_name', value: 'Mağaza Adı', group: 'general' },
    { key: 'site_phone', value: '', group: 'contact' },
    { key: 'site_email', value: '', group: 'contact' },
    { key: 'site_whatsapp', value: '', group: 'contact' },
    { key: 'meta_description', value: '', group: 'seo' },
    { key: 'free_shipping_threshold', value: '500', group: 'shipping' },
    { key: 'iyzico_api_key', value: '', group: 'payment' },
    { key: 'iyzico_secret_key', value: '', group: 'payment' },
    { key: 'iyzico_base_url', value: 'https://sandbox-api.iyzipay.com', group: 'payment' },
    { key: 'iyzico_enabled', value: '0', group: 'payment' },
    { key: 'bank_transfer_enabled', value: '1', group: 'payment' },
    { key: 'cash_on_delivery_enabled', value: '1', group: 'payment' },
    { key: 'cash_on_delivery_fee', value: '0', group: 'payment' },
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }
  console.log('✅ Site ayarları oluşturuldu')

  // Örnek kategoriler
  const organik = await prisma.category.upsert({
    where: { slug: 'organik-urunler' },
    update: {},
    create: { name: 'Organik Ürünler', slug: 'organik-urunler', sortOrder: 1 },
  })
  const baharat = await prisma.category.upsert({
    where: { slug: 'baharat' },
    update: {},
    create: { name: 'Baharat', slug: 'baharat', sortOrder: 2 },
  })
  const takviye = await prisma.category.upsert({
    where: { slug: 'gida-takviyesi' },
    update: {},
    create: { name: 'Gıda Takviyesi', slug: 'gida-takviyesi', sortOrder: 3 },
  })
  await prisma.category.upsert({
    where: { slug: 'bitki-urunleri' },
    update: {},
    create: { name: 'Bitki Ürünleri', slug: 'bitki-urunleri', sortOrder: 4 },
  })

  // Alt kategoriler
  await prisma.category.createMany({
    skipDuplicates: true,
    data: [
      { parentId: organik.id, name: 'Bitkisel Kozmetik', slug: 'bitkisel-kozmetik', sortOrder: 1 },
      { parentId: organik.id, name: 'Sos ve Salçalar', slug: 'sos-salcalar', sortOrder: 2 },
      { parentId: organik.id, name: 'Pekmez ve Püreler', slug: 'pekmez-pureler', sortOrder: 3 },
      { parentId: baharat.id, name: 'Paket Baharat', slug: 'paket-baharat', sortOrder: 1 },
      { parentId: baharat.id, name: 'Cam Şişe Baharatlar', slug: 'cam-sise-baharat', sortOrder: 2 },
      { parentId: takviye.id, name: 'Bitkisel Takviyeler', slug: 'bitkisel-takviyeler', sortOrder: 1 },
    ],
  })
  console.log('✅ Kategoriler oluşturuldu')

  // Örnek ürünler
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        categoryId: takviye.id,
        name: 'Zerdeçal Ekstresi 250ml',
        slug: 'zerdecal-ekstresi-250ml',
        sku: 'ZRD-001',
        shortDescription: 'Kurkumin içerikli doğal zerdeçal ekstresi',
        price: 1390.00,
        comparePrice: 1590.00,
        stock: 45,
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: true,
        weight: 0.35,
      },
      {
        categoryId: takviye.id,
        name: 'Ginseng Ekstresi 250ml',
        slug: 'ginseng-ekstresi-250ml',
        sku: 'GNS-001',
        shortDescription: 'Kore ginsengi içerikli enerji takviyesi',
        price: 1690.00,
        stock: 0,
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: true,
        weight: 0.35,
      },
      {
        categoryId: baharat.id,
        name: 'Pul Biber 200g',
        slug: 'pul-biber-200g',
        sku: 'PB-200',
        shortDescription: 'Acı kırmızı pul biber',
        price: 89.90,
        stock: 200,
        lowStockThreshold: 20,
        isActive: true,
        weight: 0.25,
      },
    ],
  })
  console.log('✅ Örnek ürünler oluşturuldu')

  console.log('\n🎉 Seed tamamlandı!')
  console.log('📧 Admin e-posta: admin@site.com')
  console.log('🔑 Admin şifre: admin123')
}

main()
  .catch(console.error)
  .finally(async () => { await prisma.$disconnect() })
