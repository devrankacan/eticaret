import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Güvenlik: Sadece secret key ile çalışır
const SEED_SECRET = process.env.SEED_SECRET || 'seed-dogal-lezzet-2026'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== SEED_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const results: string[] = []

  try {
    // Admin kullanıcısı
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.upsert({
      where: { email: 'admin@site.com' },
      update: {},
      create: { name: 'Admin', email: 'admin@site.com', password: hashedPassword, role: 'admin' },
    })
    results.push('✅ Admin kullanıcısı')

    // Site ayarları
    const settings = [
      { key: 'site_name',                value: 'Doğal Lezzet',          group: 'general' },
      { key: 'site_logo',                value: '',                       group: 'general' },
      { key: 'site_phone',               value: '0212 555 44 33',         group: 'contact' },
      { key: 'site_email',               value: 'info@dogallezzet.com',   group: 'contact' },
      { key: 'site_whatsapp',            value: '905551234567',           group: 'contact' },
      { key: 'site_address',             value: 'Atatürk Cad. No:12\nBeyoğlu / İstanbul', group: 'contact' },
      { key: 'about_text',               value: '2010 yılından bu yana doğal ve organik gıda ürünlerini sizlerle buluşturuyoruz. Türkiye\'nin dört bir yanından özenle seçilmiş köy ürünleri, organik bal çeşitleri, geleneksel yöntemlerle üretilmiş peynirler ve doğal tereyağları ile sofralarınıza lezzet katıyoruz.\n\nTüm ürünlerimiz doğrudan üreticilerden temin edilmekte olup hiçbir katkı maddesi içermemektedir.', group: 'general' },
      { key: 'social_instagram',         value: 'https://instagram.com',  group: 'social' },
      { key: 'social_facebook',          value: 'https://facebook.com',   group: 'social' },
      { key: 'seo_title',                value: 'Doğal Lezzet | Organik & Doğal Ürünler', group: 'seo' },
      { key: 'seo_description',          value: 'En kaliteli doğal bal, peynir, tereyağı ve organik gıda ürünleri.', group: 'seo' },
      { key: 'meta_description',         value: 'En kaliteli doğal bal, peynir, tereyağı ve organik gıda ürünleri.', group: 'seo' },
      { key: 'free_shipping_threshold',  value: '500',  group: 'shipping' },
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

    // Ürünler
    type P = { categoryId: string; name: string; slug: string; sku: string; shortDescription: string; price: number; comparePrice?: number; stock: number; weight: number; isFeatured: boolean; image: string }
    const products: P[] = [
      { categoryId: balPekmez.id,    name: 'Organik Çiçek Balı 850g',       slug: 'organik-cicek-bali-850g',       sku: 'BAL-001', shortDescription: 'Doğu Anadolu yaylalarından toplanan soğuk sıkım organik çiçek balı',    price: 420, comparePrice: 480, stock: 85,  weight: 1.0,  isFeatured: true,  image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80' },
      { categoryId: balPekmez.id,    name: 'Çam Balı 460g',                  slug: 'cam-bali-460g',                  sku: 'BAL-002', shortDescription: 'Ege çam ormanlarından toplanan koyu renkli, yoğun aromalı çam balı',      price: 360, comparePrice: 420, stock: 60,  weight: 0.6,  isFeatured: true,  image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&q=80' },
      { categoryId: balPekmez.id,    name: 'Üzüm Pekmezi 1kg',               slug: 'uzum-pekmezi-1kg',               sku: 'PKM-001', shortDescription: 'Geleneksel taş kazanlarda kaynatılan şekersiz doğal üzüm pekmezi',        price: 185, comparePrice: 210, stock: 120, weight: 1.1,  isFeatured: false, image: 'https://images.unsplash.com/photo-1502741126161-b048400d085d?w=600&q=80' },
      { categoryId: balPekmez.id,    name: 'Dut Pekmezi 700g',               slug: 'dut-pekmezi-700g',               sku: 'PKM-002', shortDescription: 'Güneydoğu Anadolu\'dan doğal siyah dut pekmezi',                           price: 165, stock: 90,  weight: 0.8,  isFeatured: false, image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&q=80' },
      { categoryId: balPekmez.id,    name: 'Keçiboynuzu Pekmezi 700g',       slug: 'keciboynuzu-pekmezi-700g',       sku: 'PKM-003', shortDescription: 'Güçlü antioksidan Toros keçiboynuzu pekmezi',                              price: 195, comparePrice: 230, stock: 70,  weight: 0.8,  isFeatured: true,  image: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80' },
      { categoryId: peynirler.id,    name: 'Ezine Beyaz Peynir 500g',        slug: 'ezine-beyaz-peynir-500g',        sku: 'PYN-001', shortDescription: 'Coğrafi işaretli Ezine beyaz peyniri, koyun-keçi sütü',                    price: 285, comparePrice: 320, stock: 45,  weight: 0.55, isFeatured: true,  image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80' },
      { categoryId: peynirler.id,    name: 'Erzincan Tulum Peyniri 500g',    slug: 'tulum-peyniri-500g',             sku: 'PYN-002', shortDescription: 'Koyun sütünden deri tulumda 6 ay olgunlaştırılmış tulum peyniri',          price: 340, comparePrice: 390, stock: 35,  weight: 0.55, isFeatured: true,  image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&q=80' },
      { categoryId: peynirler.id,    name: 'Olgunlaştırılmış Kaşar 500g',    slug: 'kasar-peyniri-500g',             sku: 'PYN-003', shortDescription: 'En az 3 ay olgunlaştırılmış geleneksel kaşar peyniri',                     price: 245, stock: 60,  weight: 0.55, isFeatured: false, image: 'https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=600&q=80' },
      { categoryId: tereyagi.id,     name: 'Köy Tereyağı 500g',              slug: 'koy-tereyagi-500g',              sku: 'TRY-001', shortDescription: 'Taze yayıklanmış, tuzsuz köy tereyağı — sarı renk, güçlü aroma',           price: 395, comparePrice: 450, stock: 50,  weight: 0.55, isFeatured: true,  image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=80' },
      { categoryId: tereyagi.id,     name: 'Tuzlu Köy Tereyağı 500g',        slug: 'tuzlu-koy-tereyagi-500g',        sku: 'TRY-002', shortDescription: 'Az tuzlu köy tereyağı, ekmek ve poğaça için ideal',                       price: 405, comparePrice: 460, stock: 45,  weight: 0.55, isFeatured: false, image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&q=80' },
      { categoryId: tereyagi.id,     name: 'Süzme Kaymak 300g',              slug: 'suzme-kaymak-300g',              sku: 'KYM-001', shortDescription: 'Geleneksel yöntemle hazırlanan tam yağlı süzme kaymak',                    price: 175, comparePrice: 200, stock: 30,  weight: 0.35, isFeatured: true,  image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=80' },
      { categoryId: dogalUrunler.id, name: 'Susam Tahin 650g',               slug: 'susam-tahin-650g',               sku: 'THN-001', shortDescription: 'Soğuk sıkım %100 susam tahini, pürüzsüz kıvam',                          price: 225, comparePrice: 260, stock: 95,  weight: 0.7,  isFeatured: true,  image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=600&q=80' },
      { categoryId: dogalUrunler.id, name: 'Sade Helva 500g',                slug: 'sade-helva-500g',                sku: 'HLV-001', shortDescription: 'Geleneksel tahin helvası, içli ve ufalanan doku',                          price: 185, stock: 70,  weight: 0.55, isFeatured: false, image: 'https://images.unsplash.com/photo-1589881133595-a3c085cb731d?w=600&q=80' },
      { categoryId: dogalUrunler.id, name: 'Kurutulmuş Domates 250g',        slug: 'kurutulmus-domates-250g',        sku: 'KRT-001', shortDescription: 'Güneşte kurutulmuş zeytinyağlı İtalyan tipi domates',                     price: 125, comparePrice: 145, stock: 110, weight: 0.28, isFeatured: false, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80' },
      { categoryId: receller.id,     name: 'Çilek Reçeli 380g',              slug: 'cilek-receli-380g',              sku: 'RCL-001', shortDescription: 'Ev yapımı az şekerli doğal çilek reçeli',                                 price: 135, comparePrice: 155, stock: 75,  weight: 0.43, isFeatured: true,  image: 'https://images.unsplash.com/photo-1563246598-8b3c2c4e95a3?w=600&q=80' },
      { categoryId: receller.id,     name: 'Malatya Kayısı Reçeli 380g',     slug: 'kayisi-receli-380g',             sku: 'RCL-002', shortDescription: 'Malatya kayısısından ev yapımı doğal reçel',                               price: 145, stock: 65,  weight: 0.43, isFeatured: false, image: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80' },
      { categoryId: receller.id,     name: 'Aydın İncir Reçeli 380g',        slug: 'incir-receli-380g',              sku: 'RCL-003', shortDescription: 'Aydın incirinden geleneksel yöntemle hazırlanan reçel',                   price: 155, comparePrice: 175, stock: 50,  weight: 0.43, isFeatured: true,  image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&q=80' },
      { categoryId: zeytinler.id,    name: 'Soğuk Sıkım Zeytinyağı 1lt',     slug: 'soguk-sikim-zeytinyagi-1lt',     sku: 'ZYT-001', shortDescription: 'Ayvalık erken hasat sızma zeytinyağı, 0.3 asit',                          price: 495, comparePrice: 560, stock: 55,  weight: 1.1,  isFeatured: true,  image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80' },
      { categoryId: zeytinler.id,    name: 'Gemlik Siyah Zeytin 500g',       slug: 'siyah-salamura-zeytin-500g',     sku: 'ZYT-002', shortDescription: 'Gemlik zeytini, geleneksel salamura yöntemiyle',                          price: 175, comparePrice: 200, stock: 80,  weight: 0.55, isFeatured: false, image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&q=80' },
      { categoryId: zeytinler.id,    name: 'Ayvalık Yeşil Kırma Zeytin 500g',slug: 'yesil-kirma-zeytin-500g',        sku: 'ZYT-003', shortDescription: 'Kekik ve sarımsak ile tatlandırılmış Ayvalık kırma zeytin',               price: 165, stock: 75,  weight: 0.55, isFeatured: false, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80' },
    ]

    let productCount = 0
    for (const p of products) {
      const { image, ...data } = p
      const existing = await prisma.product.findUnique({ where: { slug: data.slug } })
      if (!existing) {
        const created = await prisma.product.create({ data: { ...data, isActive: true } })
        await prisma.productImage.create({ data: { productId: created.id, imagePath: image, sortOrder: 0, isPrimary: true, altText: data.name } })
        productCount++
      }
    }
    results.push(`✅ Ürünler (${productCount} yeni eklendi)`)

    // Bannerlar
    const bannerCount = await prisma.banner.count()
    if (bannerCount === 0) {
      await prisma.banner.createMany({
        data: [
          { title: 'Doğal Ürünler Kampanyası', imageDesktop: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80', imageMobile: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=750&q=80', link: '/urunler', sortOrder: 1, isActive: true },
          { title: 'Bal & Pekmez Çeşitleri',   imageDesktop: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1920&q=80', imageMobile: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=750&q=80', link: '/kategori/bal-pekmez', sortOrder: 2, isActive: true },
          { title: 'Taze Peynir & Tereyağı',   imageDesktop: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=1920&q=80', imageMobile: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=750&q=80', link: '/kategori/peynirler', sortOrder: 3, isActive: true },
        ],
      })
      results.push('✅ Bannerlar')
    } else {
      results.push('⏭️  Bannerlar zaten mevcut')
    }

    return NextResponse.json({ success: true, results, message: 'Seed tamamlandı! Şimdi /admin adresine gidin.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, results }, { status: 500 })
  }
}
