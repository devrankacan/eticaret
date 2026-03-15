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

  // ─── Eski ürün/kategori verilerini temizle ────────────────
  console.log('🗑  Eski veriler temizleniyor...')
  await prisma.cartItem.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.productVariation.deleteMany()
  await prisma.review.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

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
    { key: 'site_name',              value: 'Ateşoğlu Süt Ürünleri', group: 'general' },
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

  // ─── Kategoriler ─────────────────────────────────────────
  console.log('📂 Kategoriler oluşturuluyor...')
  const catPeynir  = await prisma.category.create({ data: { name: 'Peynirler',     slug: 'peynirler',     sortOrder: 1 } })
  const catBal     = await prisma.category.create({ data: { name: 'Bal & Pekmez',  slug: 'bal-pekmez',    sortOrder: 2 } })
  const catTereyag = await prisma.category.create({ data: { name: 'Tereyağı',      slug: 'tereyagi',      sortOrder: 3 } })
  const catDogal   = await prisma.category.create({ data: { name: 'Doğal Ürünler', slug: 'dogal-urunler', sortOrder: 4 } })

  // ─── Yardımcı ────────────────────────────────────────────
  type Variation = { name: string; price: number; comparePrice?: number; isDefault?: boolean; sortOrder?: number }
  type ProductInput = {
    categoryId: string; name: string; slug: string
    shortDescription?: string; description?: string
    price: number; comparePrice?: number; stock?: number; weight?: number
    isFeatured?: boolean; images: string[]; variations?: Variation[]
  }

  async function createProduct(data: ProductInput) {
    const hasVariations = !!(data.variations && data.variations.length > 0)
    const product = await prisma.product.create({
      data: {
        categoryId: data.categoryId, name: data.name, slug: data.slug,
        shortDescription: data.shortDescription, description: data.description,
        price: data.price, comparePrice: data.comparePrice,
        stock: hasVariations ? 0 : (data.stock ?? 199),
        weight: data.weight, hasVariations, isFeatured: data.isFeatured ?? false,
        isActive: true, lowStockThreshold: 5,
      },
    })
    for (let i = 0; i < data.images.length; i++) {
      await prisma.productImage.create({
        data: { productId: product.id, imagePath: data.images[i], isPrimary: i === 0, sortOrder: i },
      })
    }
    if (hasVariations && data.variations) {
      for (let i = 0; i < data.variations.length; i++) {
        const v = data.variations[i]
        await prisma.productVariation.create({
          data: {
            productId: product.id, name: v.name, price: v.price, comparePrice: v.comparePrice,
            stock: 199, isDefault: v.isDefault ?? i === 0, sortOrder: v.sortOrder ?? i,
          },
        })
      }
    }
    return product
  }

  const BASE = 'https://linen-frog-157147.hostingersite.com/wp-content/uploads/2025/08'

  // ═══════════════════════════════════════════════════════════
  //  PEYNİRLER
  // ═══════════════════════════════════════════════════════════
  console.log('🧀 Peynirler...')

  // ═══════════════════════════════════════════════════════════
  //  PEYNİRLER
  // ═══════════════════════════════════════════════════════════
  console.log('🧀 Peynirler...')

  await createProduct({
    categoryId: catPeynir.id, name: 'Göbek Kaşar', slug: 'gobek-kasar',
    description: `<h2>Doğallık ve Lezzetin Buluştuğu Göbek Kaşarı</h2><p>Göbek kaşarı, peynir severlerin ilk tercihi olmaya aday, tam yağlı inek sütünden üretilmiş özel bir kaşar peyniridir. Yuvarlak şekli ve daha yumuşak iç dokusuyla, klasik kaşar peynirlerinden ayrılan bu ürün, farkını hemen hissettirir.</p><h2>Göbek Kaşarın Kullanım Kolaylığı</h2><p>Göbek kaşarı, tostlardan pizzalara, makarnalardan salatalara kadar geniş bir yelpazede kullanılabilir.</p>`,
    price: 249.99, isFeatured: true,
    images: [`${BASE}/Gobek-Kasar-1.png`],
  })

  await createProduct({
    categoryId: catPeynir.id, name: 'Yağlı Çeçil', slug: 'yagli-cecil',
    shortDescription: 'Yağlı çeçil peyniri, geleneksel yöntemlerle üretilen, damak tadınıza uygun eşsiz bir peynir çeşididir.',
    description: `<p>Yağlı çeçil peyniri, geleneksel yöntemlerle üretilen, damak tadınıza uygun eşsiz bir peynir çeşididir. Yağlı sütten üretilen bu peynir, tuzlu ve lifli yapısıyla sofralarınıza hem lezzet hem de kalite getirir.</p>`,
    price: 499.99,
    images: [`${BASE}/Yagli-Cecil.png`],
    variations: [
      { name: '1 Kg',   price: 499.99, isDefault: true, sortOrder: 0 },
      { name: '1.5 Kg', price: 749.99, sortOrder: 1 },
    ],
  })

  await createProduct({
    categoryId: catPeynir.id, name: 'Obruk Peyniri', slug: 'obruk-peyniri',
    price: 229.99,
    images: [`${BASE}/Obruk-Peyniri.png`],
  })

  await createProduct({
    categoryId: catPeynir.id, name: 'Çökelek Peyniri', slug: 'cokelek-peyniri',
    price: 239.99,
    images: [`${BASE}/Cokelek.png`],
  })

  await createProduct({
    categoryId: catPeynir.id, name: 'Çörek Otlu Peynir', slug: 'corek-otlu-peynir',
    shortDescription: 'Çörek otunun aromatik lezzetiyle zenginleştirilmiş, doğal ve taze peynir.',
    description: `<h2>Doğallık ve Tazelik Bir Arada</h2><p>Çörek otlu peynir, eşsiz aromasıyla sofralarınıza doğal bir lezzet getiriyor. Çörek otunun kendine has yoğun aromasıyla peynirin yumuşak ve zengin dokusu mükemmel bir uyumla birleşiyor.</p>`,
    price: 199.99,
    images: [`${BASE}/Corek-otlu-peynir.png`],
  })

  // ═══════════════════════════════════════════════════════════
  //  BAL & PEKMEZ
  // ═══════════════════════════════════════════════════════════
  console.log('🍯 Bal & Pekmez...')

  await createProduct({
    categoryId: catBal.id, name: 'Süzme Bal', slug: 'suzme-bal',
    description: `<h2>Süzme Bal: Doğal Tat ve Sağlık Bir Arada</h2><p>Yıllarca süregelen geleneksel bal üretim süreçleri ile hazırlanan süzme bal, saf ve doğal bir lezzet arayanların vazgeçilmezi. Bu özel bal, peteklerden özenle süzülerek elde edilir ve hiçbir katkı maddesi içermez.</p>`,
    price: 399.00, isFeatured: true,
    images: [`${BASE}/Suzme-Bal.png`],
  })

  await createProduct({
    categoryId: catBal.id, name: 'Petek Bal', slug: 'petek-bal',
    shortDescription: 'Petek bal, doğanın bizlere sunduğu en saf ve en doğal ürünlerden biridir.',
    description: `<h2>Petek Bal: Doğal Bir Lezzet Deneyimi</h2><p>Petek bal, doğanın bizlere sunduğu en saf ve en doğal ürünlerden biridir. Arıların büyük bir emekle ürettiği bu özel bal, petek halinde doğal dokusunu koruyarak sofralarınıza ulaşır.</p>`,
    price: 499.99,
    images: [`${BASE}/Petek-Bal.png`],
  })

  await createProduct({
    categoryId: catBal.id, name: 'Dut Pekmezi', slug: 'dut-pekmezi',
    price: 249.99,
    images: [`${BASE}/Dut-Pekmezi.png`],
  })

  await createProduct({
    categoryId: catBal.id, name: 'Keçi Boynuzu', slug: 'keci-boynuzu',
    description: `<h2>Keçi Boynuzunun Doğal ve Besleyici Özellikleri</h2><p>Keçi boynuzu, doğanın bize sunduğu mucizevi bir lezzettir. Zengin vitamin ve mineral içeriği sayesinde günlük enerji ihtiyacınızı karşılamaya yardımcı olurken, doğal bir tatlı aromasıyla diğer tatlardan ayrılır.</p>`,
    price: 249.99,
    images: [`${BASE}/Keci-boynuzu.png`],
  })

  // ═══════════════════════════════════════════════════════════
  //  TEREYAĞI
  // ═══════════════════════════════════════════════════════════
  console.log('🧈 Tereyağı...')

  await createProduct({
    categoryId: catTereyag.id, name: 'Tereyağı', slug: 'tereyagi',
    price: 399.00, isFeatured: true,
    images: [`${BASE}/tereyag.png`],
  })

  await createProduct({
    categoryId: catTereyag.id, name: 'Eritilmiş Tereyağı', slug: 'eritilmis-tereyagi',
    description: `<h2>Doğal ve Saf Lezzetin Gücü</h2><p>Eritilmiş tereyağı, doğal ve katkısız yapısı ile yemeklerinize ve tatlılarınıza eşsiz bir lezzet katar. Geleneksel yöntemlerle hazırlanan bu kaliteli tereyağı, mutfağınızda her detayıyla fark yaratır.</p>`,
    price: 299.99,
    images: [`${BASE}/Erilitmis-Tereyag.png`],
  })

  // ═══════════════════════════════════════════════════════════
  //  DOĞAL ÜRÜNLER
  // ═══════════════════════════════════════════════════════════
  console.log('🌿 Doğal Ürünler...')

  await createProduct({
    categoryId: catDogal.id, name: 'Cevizli Sucuk', slug: 'cevizli-sucuk',
    description: `<h2>Doğal ve Geleneksel Lezzet: Cevizli Sucuk</h2><p>Cevizli sucuk, geleneksel Türk mutfağından günümüze taşınmış doğal ve sağlıklı bir tatlı atıştırmalıktır. Üzüm pekmezi ve ceviz gibi tamamen doğal malzemelerle hazırlanan bu enfes lezzet, damaklarda eşsiz bir tat bırakır.</p>`,
    price: 149.99,
    images: [`${BASE}/Cevizli-Sucuk.png`],
  })

  console.log('✅ Seed tamamlandı! 4 kategori, 12 ürün (1 varyasyonlu), tüm stoklar 199')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
