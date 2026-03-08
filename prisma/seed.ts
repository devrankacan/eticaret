import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed başlıyor...')

  // ============================================
  // ADMİN KULLANICISI
  // ============================================
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
  console.log('✅ Admin:', admin.email)

  // ============================================
  // SİTE AYARLARI
  // ============================================
  const settings = [
    { key: 'site_name',               value: 'Doğal Lezzet',          group: 'general' },
    { key: 'site_logo',               value: '',                       group: 'general' },
    { key: 'site_phone',              value: '0212 555 44 33',         group: 'contact' },
    { key: 'site_email',              value: 'info@dogallezzet.com',   group: 'contact' },
    { key: 'site_whatsapp',           value: '905551234567',           group: 'contact' },
    { key: 'site_address',            value: 'Atatürk Cad. No:12\nBeyoğlu / İstanbul', group: 'contact' },
    { key: 'about_text',              value: '2010 yılından bu yana doğal ve organik gıda ürünlerini sizlerle buluşturuyoruz. Türkiye\'nin dört bir yanından özenle seçilmiş köy ürünleri, organik bal çeşitleri, geleneksel yöntemlerle üretilmiş peynirler ve doğal tereyağları ile sofralarınıza lezzet katıyoruz.\n\nTüm ürünlerimiz doğrudan üreticilerden temin edilmekte olup hiçbir katkı maddesi içermemektedir.', group: 'general' },
    { key: 'social_instagram',        value: 'https://instagram.com',  group: 'social' },
    { key: 'social_facebook',         value: 'https://facebook.com',   group: 'social' },
    { key: 'social_youtube',          value: '',                       group: 'social' },
    { key: 'seo_title',               value: 'Doğal Lezzet | Organik & Doğal Ürünler', group: 'seo' },
    { key: 'seo_description',         value: 'En kaliteli doğal bal, peynir, tereyağı ve organik gıda ürünleri. Üreticiden sofrağınıza en taze ürünler.', group: 'seo' },
    { key: 'meta_description',        value: 'En kaliteli doğal bal, peynir, tereyağı ve organik gıda ürünleri.', group: 'seo' },
    { key: 'free_shipping_threshold', value: '500',                    group: 'shipping' },
    { key: 'min_order_amount',        value: '0',                      group: 'shipping' },
    { key: 'bank_transfer_enabled',   value: '1',                      group: 'payment' },
    { key: 'cash_on_delivery_enabled',value: '1',                      group: 'payment' },
    { key: 'cash_on_delivery_fee',    value: '0',                      group: 'payment' },
    { key: 'iyzico_enabled',          value: '0',                      group: 'payment' },
    { key: 'iyzico_api_key',          value: '',                       group: 'payment' },
    { key: 'iyzico_secret_key',       value: '',                       group: 'payment' },
    { key: 'iyzico_base_url',         value: 'https://sandbox-api.iyzipay.com', group: 'payment' },
  ]
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
  }
  console.log('✅ Site ayarları')

  // ============================================
  // KARGO FİRMALARI
  // ============================================
  await prisma.cargoCompany.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Yurtiçi Kargo', code: 'yurtici', trackingUrl: 'https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code={tracking_number}', freeShippingThreshold: 500, baseShippingCost: 39.90, isActive: true, isDefault: true },
      { name: 'Aras Kargo',    code: 'aras',    trackingUrl: 'https://www.araskargo.com.tr/pages/kargo-takip.aspx?q={tracking_number}', baseShippingCost: 44.90, isActive: true },
      { name: 'MNG Kargo',     code: 'mng',     trackingUrl: 'https://www.mngkargo.com.tr/wps/portal/mng/main/gonderitakip?durum=TAKIP&takipNo={tracking_number}', baseShippingCost: 44.90, isActive: true },
    ],
  })
  console.log('✅ Kargo firmaları')

  // ============================================
  // KATEGORİLER
  // ============================================
  const balPekmez = await prisma.category.upsert({
    where: { slug: 'bal-pekmez' },
    update: { name: 'Bal & Pekmez', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=300&q=80', sortOrder: 1 },
    create: { name: 'Bal & Pekmez', slug: 'bal-pekmez', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=300&q=80', description: 'Doğal ve organik bal çeşitleri, üzüm & dut pekmezi', sortOrder: 1 },
  })
  const peynirler = await prisma.category.upsert({
    where: { slug: 'peynirler' },
    update: { name: 'Peynirler', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&q=80', sortOrder: 2 },
    create: { name: 'Peynirler', slug: 'peynirler', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&q=80', description: 'El yapımı köy peynirleri, tulum ve kaşar çeşitleri', sortOrder: 2 },
  })
  const tereyagi = await prisma.category.upsert({
    where: { slug: 'tereyagi' },
    update: { name: 'Tereyağı', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&q=80', sortOrder: 3 },
    create: { name: 'Tereyağı', slug: 'tereyagi', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&q=80', description: 'Köy tereyağı ve kaymak çeşitleri', sortOrder: 3 },
  })
  const dogalUrunler = await prisma.category.upsert({
    where: { slug: 'dogal-urunler' },
    update: { name: 'Doğal Ürünler', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80', sortOrder: 4 },
    create: { name: 'Doğal Ürünler', slug: 'dogal-urunler', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80', description: 'Zeytin, zeytinyağı, tahin, reçel ve daha fazlası', sortOrder: 4 },
  })
  const receller = await prisma.category.upsert({
    where: { slug: 'recel-marmelat' },
    update: { name: 'Reçel & Marmelat', image: 'https://images.unsplash.com/photo-1563246598-8b3c2c4e95a3?w=300&q=80', sortOrder: 5 },
    create: { name: 'Reçel & Marmelat', slug: 'recel-marmelat', image: 'https://images.unsplash.com/photo-1563246598-8b3c2c4e95a3?w=300&q=80', description: 'Ev yapımı doğal reçel ve marmelatlar', sortOrder: 5 },
  })
  const zeytinler = await prisma.category.upsert({
    where: { slug: 'zeytin-zeytinyagi' },
    update: { name: 'Zeytin & Zeytinyağı', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80', sortOrder: 6 },
    create: { name: 'Zeytin & Zeytinyağı', slug: 'zeytin-zeytinyagi', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80', description: 'Soğuk sıkım zeytinyağı ve salamura zeytin çeşitleri', sortOrder: 6 },
  })

  // Alt kategoriler
  await prisma.category.createMany({
    skipDuplicates: true,
    data: [
      { parentId: balPekmez.id,   name: 'Çiçek Balı',       slug: 'cicek-bali',        sortOrder: 1 },
      { parentId: balPekmez.id,   name: 'Çam Balı',          slug: 'cam-bali',          sortOrder: 2 },
      { parentId: balPekmez.id,   name: 'Üzüm Pekmezi',      slug: 'uzum-pekmezi',      sortOrder: 3 },
      { parentId: balPekmez.id,   name: 'Dut Pekmezi',       slug: 'dut-pekmezi',       sortOrder: 4 },
      { parentId: peynirler.id,   name: 'Beyaz Peynir',      slug: 'beyaz-peynir',      sortOrder: 1 },
      { parentId: peynirler.id,   name: 'Tulum Peyniri',     slug: 'tulum-peyniri',     sortOrder: 2 },
      { parentId: peynirler.id,   name: 'Kaşar Peyniri',     slug: 'kasar-peyniri',     sortOrder: 3 },
      { parentId: tereyagi.id,    name: 'Köy Tereyağı',      slug: 'koy-tereyagi',      sortOrder: 1 },
      { parentId: tereyagi.id,    name: 'Kaymak',            slug: 'kaymak',            sortOrder: 2 },
      { parentId: dogalUrunler.id,name: 'Tahin & Helva',     slug: 'tahin-helva',       sortOrder: 1 },
      { parentId: dogalUrunler.id,name: 'Kurutulmuş Sebze',  slug: 'kurutulmus-sebze',  sortOrder: 2 },
      { parentId: zeytinler.id,   name: 'Soğuk Sıkım Yağ',  slug: 'soguk-sikim-yag',   sortOrder: 1 },
      { parentId: zeytinler.id,   name: 'Salamura Zeytin',   slug: 'salamura-zeytin',   sortOrder: 2 },
    ],
  })
  console.log('✅ Kategoriler')

  // ============================================
  // ÜRÜNLER
  // ============================================
  type ProductData = {
    categoryId: string
    name: string
    slug: string
    sku: string
    shortDescription: string
    description: string
    price: number
    comparePrice?: number
    stock: number
    weight: number
    isActive: boolean
    isFeatured: boolean
    images: string[]
  }

  const products: ProductData[] = [
    // BAL & PEKMEZ
    {
      categoryId: balPekmez.id,
      name: 'Organik Çiçek Balı 850g',
      slug: 'organik-cicek-bali-850g',
      sku: 'BAL-001',
      shortDescription: 'Doğu Anadolu yaylalarından toplanan, soğuk sıkım organik çiçek balı',
      description: 'Doğu Anadolu\'nun el değmemiş yaylalarından toplanan organik çiçek balımız, tamamen doğal ve katkısızdır. Isıl işlem uygulanmaz, ham olarak kavanoza doldurulur. Zengin enzim ve mineral içeriğiyle bağışıklık sistemini güçlendirir.',
      price: 420, comparePrice: 480, stock: 85, weight: 1.0, isActive: true, isFeatured: true,
      images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80'],
    },
    {
      categoryId: balPekmez.id,
      name: 'Çam Balı 460g',
      slug: 'cam-bali-460g',
      sku: 'BAL-002',
      shortDescription: 'Ege çam ormanlarından toplanan, koyu renkli, yoğun aromalı çam balı',
      description: 'Ege\'nin kadim çam ormanlarından özenle toplanan çam balımız, koyu rengi ve yoğun aromasıyla sofranızı taçlandırır. Antioksidan açısından zengindir.',
      price: 360, comparePrice: 420, stock: 60, weight: 0.6, isActive: true, isFeatured: true,
      images: ['https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&q=80'],
    },
    {
      categoryId: balPekmez.id,
      name: 'Üzüm Pekmezi 1kg',
      slug: 'uzum-pekmezi-1kg',
      sku: 'PKM-001',
      shortDescription: 'Geleneksel taş kazanlarda kaynatılan, şekersiz doğal üzüm pekmezi',
      description: 'Manisa\'nın verimli bağlarından devşirilen üzümlerden, geleneksel taş kazanlarda hiçbir katkı maddesi eklenmeden elde edilen doğal pekmezimiz.',
      price: 185, comparePrice: 210, stock: 120, weight: 1.1, isActive: true, isFeatured: false,
      images: ['https://images.unsplash.com/photo-1502741126161-b048400d085d?w=600&q=80'],
    },
    {
      categoryId: balPekmez.id,
      name: 'Dut Pekmezi 700g',
      slug: 'dut-pekmezi-700g',
      sku: 'PKM-002',
      shortDescription: 'Güneydoğu Anadolu\'dan doğal siyah dut pekmezi',
      description: 'Güneydoğu Anadolu\'da yetişen siyah dutlardan elde edilen bu pekmez, zengin demir ve vitamin içeriğiyle öne çıkar.',
      price: 165, stock: 90, weight: 0.8, isActive: true, isFeatured: false,
      images: ['https://images.unsplash.com/photo-1563246598-8b3c2c4e95a3?w=600&q=80'],
    },
    {
      categoryId: balPekmez.id,
      name: 'Keçiboynuzu Pekmezi 700g',
      slug: 'keciboynuzu-pekmezi-700g',
      sku: 'PKM-003',
      shortDescription: 'Güçlü antioksidan keçiboynuzu pekmezi',
      description: 'Toros Dağları eteklerinden toplanan keçiboynuzlarından elde edilen, doğal şeker içeriği yüksek geleneksel pekmez.',
      price: 195, comparePrice: 230, stock: 70, weight: 0.8, isActive: true, isFeatured: true,
      images: ['https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&q=80'],
    },

    // PEYNİRLER
    {
      categoryId: peynirler.id,
      name: 'Ezine Beyaz Peynir 500g',
      slug: 'ezine-beyaz-peynir-500g',
      sku: 'PYN-001',
      shortDescription: 'Coğrafi işaretli Ezine beyaz peyniri, koyun-keçi sütü',
      description: 'Çanakkale Ezine\'nin meşhur koyun ve keçi sütünden geleneksel yöntemlerle üretilen, coğrafi işaretli beyaz peynir. Lezzeti ve dokusuyla sofranızın vazgeçilmezi.',
      price: 285, comparePrice: 320, stock: 45, weight: 0.55, isActive: true, isFeatured: true,
      images: ['https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80'],
    },
    {
      categoryId: peynirler.id,
      name: 'Tulum Peyniri 500g',
      slug: 'tulum-peyniri-500g',
      sku: 'PYN-002',
      shortDescription: 'Erzincan tulum peyniri, koyun sütünden olgunlaştırılmış',
      description: 'Erzincan\'ın saf yaylalarında otlayan koyunların sütünden üretilen tulum peyniri, geleneksel deri tulumda 6 ay olgunlaştırılır. Keskin ve derin tadıyla öne çıkar.',
      price: 340, comparePrice: 390, stock: 35, weight: 0.55, isActive: true, isFeatured: true,
      images: ['https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&q=80'],
    },
    {
      categoryId: peynirler.id,
      name: 'Kaşar Peyniri 500g',
      slug: 'kasar-peyniri-500g',
      sku: 'PYN-003',
      shortDescription: 'Olgunlaştırılmış doğal kaşar peyniri, inek sütünden',
      description: 'Doğu Anadolu meraları inek sütünden üretilen, en az 3 ay olgunlaştırılmış geleneksel kaşar peyniri.',
      price: 245, stock: 60, weight: 0.55, isActive: true, isFeatured: false,
      images: ['https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=600&q=80'],
    },
    {
      categoryId: peynirler.id,
      name: 'Lor Peyniri 400g',
      slug: 'lor-peyniri-400g',
      sku: 'PYN-004',
      shortDescription: 'Taze köy loru, koyun sütünden',
      description: 'Koyun sütünden elde edilen taze lor peyniri. Yumurtalı börek, mantı ve tatlılarda kullanım için idealdir.',
      price: 155, stock: 40, weight: 0.45, isActive: true, isFeatured: false,
      images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80'],
    },

    // TEREYAĞI
    {
      categoryId: tereyagi.id,
      name: 'Köy Tereyağı 500g',
      slug: 'koy-tereyagi-500g',
      sku: 'TRY-001',
      shortDescription: 'Taze yayıklanmış, tuzsuz köy tereyağı — sarı renk, güçlü aroma',
      description: 'Doğu Anadolu yaylalarında otlayan ineklerin sütünden, geleneksel yayık yöntemiyle elde edilen köy tereyağı. Tuzsuz, katkısız ve doğal. Rengi yaz aylarında daha yoğun sarı olur.',
      price: 395, comparePrice: 450, stock: 50, weight: 0.55, isActive: true, isFeatured: true,
      images: ['https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=80'],
    },
    {
      categoryId: tereyagi.id,
      name: 'Tuzlu Köy Tereyağı 500g',
      slug: 'tuzlu-koy-tereyagi-500g',
      sku: 'TRY-002',
      shortDescription: 'Az tuzlu köy tereyağı, ekmek & poğaça için ideal',
      description: 'Yayık tereyağına hafif doğal kaya tuzu eklenerek hazırlanır. Kahvaltı sofrasının vazgeçilmezi.',
      price: 405, comparePrice: 460, stock: 45, weight: 0.55, isActive: true, isFeatured: false,
      images: ['https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&q=80'],
    },
    {
      categoryId: tereyagi.id,
      name: 'Süzme Kaymak 300g',
      slug: 'suzme-kaymak-300g',
      sku: 'KYM-001',
      shortDescription: 'Geleneksel yöntemle hazırlanan tam yağlı süzme kaymak',
      description: 'Süt yüzeyindeki en yoğun kremadan elde edilen, geleneksel yöntemlerle hazırlanan kaymak. Bal ile birlikte kahvaltıda veya tatlıların üzerinde servis edilir.',
      price: 175, comparePrice: 200, stock: 30, weight: 0.35, isActive: true, isFeatured: true,
      images: ['https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=80'],
    },

    // DOĞAL ÜRÜNLER
    {
      categoryId: dogalUrunler.id,
      name: 'Susam Tahin 650g',
      slug: 'susam-tahin-650g',
      sku: 'THN-001',
      shortDescription: 'Tam buğday unlu, soğuk sıkım %100 susam tahin',
      description: 'Urfa\'nın ünlü susam tarlalarından gelen kabuğu soyulmuş susam tanelerinden, soğuk sıkım yöntemiyle elde edilen tahin. Pürüzsüz kıvamı ve yoğun aromasıyla öne çıkar.',
      price: 225, comparePrice: 260, stock: 95, weight: 0.7, isActive: true, isFeatured: true,
      images: ['https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=600&q=80'],
    },
    {
      categoryId: dogalUrunler.id,
      name: 'Sade Helva 500g',
      slug: 'sade-helva-500g',
      sku: 'HLV-001',
      shortDescription: 'Geleneksel tahin helvası, içli ve ufalanan doku',
      description: 'Kaliteli tahin ve şekerden hazırlanan geleneksel helva. Ufalanan dokusu ve zengin susam aromasıyla çay yanında ideal.',
      price: 185, stock: 70, weight: 0.55, isActive: true, isFeatured: false,
      images: ['https://images.unsplash.com/photo-1589881133595-a3c085cb731d?w=600&q=80'],
    },
    {
      categoryId: dogalUrunler.id,
      name: 'Kurutulmuş Domates 250g',
      slug: 'kurutulmus-domates-250g',
      sku: 'KRT-001',
      shortDescription: 'Güneşte kurutulmuş, yağlı İtalyan tipi kurutulmuş domates',
      description: 'Ege\'nin bereketli topraklarında yetişen, güneşte doğal yöntemle kurutulan domatesler. Zeytinyağı ile tatlandırılmış, makarna ve salatalarda kullanım için idealdir.',
      price: 125, comparePrice: 145, stock: 110, weight: 0.28, isActive: true, isFeatured: false,
      images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'],
    },

    // REÇEL & MARMELAT
    {
      categoryId: receller.id,
      name: 'Çilek Reçeli 380g',
      slug: 'cilek-receli-380g',
      sku: 'RCL-001',
      shortDescription: 'Ev yapımı, az şekerli doğal çilek reçeli',
      description: 'Manisa\'nın taze çileklerinden, az şekerle hazırlanan ev reçeli. Meyve dokusu korunur, katkı maddesi içermez.',
      price: 135, comparePrice: 155, stock: 75, weight: 0.43, isActive: true, isFeatured: true,
      images: ['https://images.unsplash.com/photo-1563246598-8b3c2c4e95a3?w=600&q=80'],
    },
    {
      categoryId: receller.id,
      name: 'Kayısı Reçeli 380g',
      slug: 'kayisi-receli-380g',
      sku: 'RCL-002',
      shortDescription: 'Malatya kayısısından ev yapımı doğal reçel',
      description: 'Dünyanın en lezzetli kayısılarından biri olan Malatya kayısısından yapılan bu reçel, yoğun meyve tadıyla sofranıza ayrı bir keyif katar.',
      price: 145, stock: 65, weight: 0.43, isActive: true, isFeatured: false,
      images: ['https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80'],
    },
    {
      categoryId: receller.id,
      name: 'İncir Reçeli 380g',
      slug: 'incir-receli-380g',
      sku: 'RCL-003',
      shortDescription: 'Aydın incirinden geleneksel yöntemle hazırlanan reçel',
      description: 'Aydın\'ın meşhur siyah incirlerinden hazırlanan bu reçel, eşsiz aromasıyla peynirle birlikte mükemmel bir ikili oluşturur.',
      price: 155, comparePrice: 175, stock: 50, weight: 0.43, isActive: true, isFeatured: true,
      images: ['https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&q=80'],
    },

    // ZEYTİN & ZEYTİNYAĞI
    {
      categoryId: zeytinler.id,
      name: 'Soğuk Sıkım Zeytinyağı 1lt',
      slug: 'soguk-sikim-zeytinyagi-1lt',
      sku: 'ZYT-001',
      shortDescription: 'Erken hasat, sızma zeytinyağı — 0,3 asit',
      description: 'Ayvalık\'ın ünlü memecik zeytinlerinden, erken hasatta soğuk sıkım yöntemiyle elde edilen naturel sızma zeytinyağı. 0,3 asit oranıyla mükemmel kalite. Salata ve zeytinyağlı yemekler için idealdir.',
      price: 495, comparePrice: 560, stock: 55, weight: 1.1, isActive: true, isFeatured: true,
      images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80'],
    },
    {
      categoryId: zeytinler.id,
      name: 'Siyah Salamura Zeytin 500g',
      slug: 'siyah-salamura-zeytin-500g',
      sku: 'ZYT-002',
      shortDescription: 'Gemlik zeytini, geleneksel salamura yöntemiyle',
      description: 'Bursa Gemlik\'in dünyaca ünlü siyah zeytinleri. Geleneksel salamura tekniğiyle hazırlanmış, yumuşak etli ve yoğun aromalı.',
      price: 175, comparePrice: 200, stock: 80, weight: 0.55, isActive: true, isFeatured: false,
      images: ['https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&q=80'],
    },
    {
      categoryId: zeytinler.id,
      name: 'Yeşil Kırma Zeytin 500g',
      slug: 'yesil-kirma-zeytin-500g',
      sku: 'ZYT-003',
      shortDescription: 'Ayvalık kırma yeşil zeytin, baharatlı',
      description: 'Ayvalık\'ın tanesiz yeşil zeytinleri kırma yöntemiyle hazırlanmış, kekik ve sarımsak ile tatlandırılmıştır.',
      price: 165, stock: 75, weight: 0.55, isActive: true, isFeatured: false,
      images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80'],
    },
  ]

  for (const p of products) {
    const { images, ...productData } = p
    const existing = await prisma.product.findUnique({ where: { slug: productData.slug } })
    if (!existing) {
      const created = await prisma.product.create({ data: productData })
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img, i) => ({ productId: created.id, imagePath: img, sortOrder: i, isPrimary: i === 0, altText: productData.name })),
        })
      }
    }
  }
  console.log('✅ Ürünler (', products.length, ')')

  // ============================================
  // BANNERLAR
  // ============================================
  const bannerCount = await prisma.banner.count()
  if (bannerCount === 0) {
    await prisma.banner.createMany({
      data: [
        {
          title: 'Doğal Ürünler Kampanyası',
          imageDesktop: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80',
          imageMobile:  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=750&q=80',
          link: '/urunler',
          sortOrder: 1,
          isActive: true,
        },
        {
          title: 'Bal & Pekmez Çeşitleri',
          imageDesktop: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1920&q=80',
          imageMobile:  'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=750&q=80',
          link: '/kategori/bal-pekmez',
          sortOrder: 2,
          isActive: true,
        },
        {
          title: 'Taze Peynir & Tereyağı',
          imageDesktop: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=1920&q=80',
          imageMobile:  'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=750&q=80',
          link: '/kategori/peynirler',
          sortOrder: 3,
          isActive: true,
        },
      ],
    })
    console.log('✅ Bannerlar')
  } else {
    console.log('⏭️  Bannerlar zaten mevcut, atlandı')
  }

  console.log('\n🎉 Seed tamamlandı!')
  console.log('📧 Admin: admin@site.com')
  console.log('🔑 Şifre: admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
