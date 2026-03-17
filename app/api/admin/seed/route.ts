import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {

  const results: string[] = []

  try {
    // Admin kullanıcısı
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
        data: { name: 'Admin', email: 'info@atesoglusut.com', password: hashedPassword, role: 'admin' }
      })
    }
    results.push('✅ Admin kullanıcısı')

    // Site ayarları
    const contactBranches = JSON.stringify([
      { id: '1', name: 'Esenyurt Şubesi', address: 'Saadetdere, Fevzi Çakmak Cd. No:9 D:11B, 34899 Esenyurt/İstanbul', phone: '02126905036', hours: '09:00-21:00' },
      { id: '2', name: 'Avcılar Şubesi',  address: 'Üniversite, Uran Cd. No:11, 34320 Avcılar/İstanbul',               phone: '02126905036', hours: '09:00-21:00' },
    ])
    const settings = [
      { key: 'site_name',                value: 'Ateşoğlu Süt ve Süt Ürünleri', group: 'general' },
      { key: 'site_logo',                value: '',                              group: 'general' },
      { key: 'site_phone',               value: '0537 779 0489',                group: 'contact' },
      { key: 'site_email',               value: 'info@atesoglusut.com',          group: 'contact' },
      { key: 'site_whatsapp',            value: '905385735075',                  group: 'contact' },
      { key: 'site_address',             value: 'Kubilaybey Mahallesi, Kars caddesi No:4, 75700 Göle/Ardahan', group: 'contact' },
      { key: 'contact_center_hours',     value: '09:00-21:00',                  group: 'contact' },
      { key: 'contact_branches',         value: contactBranches,                group: 'contact' },
      { key: 'about_text',               value: 'Ateşoğlu Süt ve Süt Ürünleri olarak Göle/Ardahan\'dan sofralarınıza en kaliteli ve doğal ürünleri ulaştırıyoruz. Geleneksel yöntemlerle üretilen peynirlerimiz, tereyağlarımız ve doğal ürünlerimizle her zaman yanınızdayız.', group: 'general' },
      { key: 'social_instagram',         value: 'https://www.instagram.com/atesoglu.sut/', group: 'social' },
      { key: 'social_facebook',          value: 'https://www.facebook.com/profile.php?id=61574833545804&locale=tr_TR', group: 'social' },
      { key: 'seo_title',                value: 'Ateşoğlu Süt ve Süt Ürünleri', group: 'seo' },
      { key: 'seo_description',          value: 'En kaliteli doğal bal, peynir, tereyağı ve organik gıda ürünleri.', group: 'seo' },
      { key: 'meta_description',         value: 'En kaliteli doğal bal, peynir, tereyağı ve organik gıda ürünleri.', group: 'seo' },
      { key: 'free_shipping_threshold',  value: '3500', group: 'shipping' },
      { key: 'min_order_amount',         value: '999',  group: 'shipping' },
      { key: 'bank_transfer_enabled',    value: '1',    group: 'payment' },
      { key: 'cash_on_delivery_enabled', value: '1',    group: 'payment' },
      { key: 'cash_on_delivery_fee',     value: '0',    group: 'payment' },
      { key: 'iyzico_enabled',           value: '0',    group: 'payment' },
      { key: 'iyzico_api_key',           value: '',     group: 'payment' },
      { key: 'iyzico_secret_key',        value: '',     group: 'payment' },
      { key: 'iyzico_base_url',          value: 'https://sandbox-api.iyzipay.com', group: 'payment' },
    ]
    for (const s of settings) {
      await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
    }
    results.push('✅ Site ayarları')

    // Kargo firmaları
    await prisma.cargoCompany.createMany({
      skipDuplicates: true,
      data: [
        { name: 'Yurtiçi Kargo', code: 'yurtici', trackingUrl: 'https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code={tracking_number}', freeShippingThreshold: 500, baseShippingCost: 39.90, isActive: true, isDefault: true },
        { name: 'Aras Kargo',    code: 'aras',    trackingUrl: 'https://www.araskargo.com.tr/pages/kargo-takip.aspx?q={tracking_number}', baseShippingCost: 44.90, isActive: true },
        { name: 'MNG Kargo',     code: 'mng',     trackingUrl: 'https://www.mngkargo.com.tr/wps/portal/mng/main/gonderitakip?durum=TAKIP&takipNo={tracking_number}', baseShippingCost: 44.90, isActive: true },
      ],
    })
    results.push('✅ Kargo firmaları')

    // Kategoriler
    const balPekmez = await prisma.category.upsert({
      where: { slug: 'bal-pekmez' },
      update: {},
      create: { name: 'Bal & Pekmez', slug: 'bal-pekmez', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=300&q=80', description: 'Doğal ve organik bal çeşitleri', sortOrder: 1 },
    })
    const peynirler = await prisma.category.upsert({
      where: { slug: 'peynirler' },
      update: {},
      create: { name: 'Peynirler', slug: 'peynirler', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&q=80', description: 'El yapımı köy peynirleri', sortOrder: 2 },
    })
    const tereyagi = await prisma.category.upsert({
      where: { slug: 'tereyagi' },
      update: {},
      create: { name: 'Tereyağı', slug: 'tereyagi', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&q=80', description: 'Köy tereyağı ve kaymak', sortOrder: 3 },
    })
    const dogalUrunler = await prisma.category.upsert({
      where: { slug: 'dogal-urunler' },
      update: {},
      create: { name: 'Doğal Ürünler', slug: 'dogal-urunler', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80', description: 'Zeytin, zeytinyağı, tahin ve daha fazlası', sortOrder: 4 },
    })
    const receller = await prisma.category.upsert({
      where: { slug: 'recel-marmelat' },
      update: {},
      create: { name: 'Reçel & Marmelat', slug: 'recel-marmelat', image: 'https://images.unsplash.com/photo-1563246598-8b3c2c4e95a3?w=300&q=80', description: 'Ev yapımı doğal reçel ve marmelatlar', sortOrder: 5 },
    })
    const zeytinler = await prisma.category.upsert({
      where: { slug: 'zeytin-zeytinyagi' },
      update: {},
      create: { name: 'Zeytin & Zeytinyağı', slug: 'zeytin-zeytinyagi', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80', description: 'Soğuk sıkım zeytinyağı', sortOrder: 6 },
    })

    await prisma.category.createMany({
      skipDuplicates: true,
      data: [
        { parentId: balPekmez.id,    name: 'Çiçek Balı',      slug: 'cicek-bali',       sortOrder: 1 },
        { parentId: balPekmez.id,    name: 'Çam Balı',         slug: 'cam-bali',         sortOrder: 2 },
        { parentId: balPekmez.id,    name: 'Üzüm Pekmezi',     slug: 'uzum-pekmezi',     sortOrder: 3 },
        { parentId: peynirler.id,    name: 'Beyaz Peynir',     slug: 'beyaz-peynir',     sortOrder: 1 },
        { parentId: peynirler.id,    name: 'Tulum Peyniri',    slug: 'tulum-peyniri',    sortOrder: 2 },
        { parentId: peynirler.id,    name: 'Kaşar Peyniri',    slug: 'kasar-peyniri',    sortOrder: 3 },
        { parentId: tereyagi.id,     name: 'Köy Tereyağı',     slug: 'koy-tereyagi',     sortOrder: 1 },
        { parentId: tereyagi.id,     name: 'Kaymak',           slug: 'kaymak',           sortOrder: 2 },
        { parentId: dogalUrunler.id, name: 'Tahin & Helva',    slug: 'tahin-helva',      sortOrder: 1 },
        { parentId: zeytinler.id,    name: 'Soğuk Sıkım Yağ', slug: 'soguk-sikim-yag',  sortOrder: 1 },
        { parentId: zeytinler.id,    name: 'Salamura Zeytin',  slug: 'salamura-zeytin',  sortOrder: 2 },
      ],
    })
    results.push('✅ Kategoriler')


    return NextResponse.json({ success: true, results, message: 'Seed tamamlandı! Şimdi /admin adresine gidin.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, results }, { status: 500 })
  }
}
