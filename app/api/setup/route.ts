import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const maxDuration = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== 'atesoglu2025') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const prisma = new PrismaClient()
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.upsert({
      where: { email: 'admin@site.com' },
      update: {},
      create: { email: 'admin@site.com', name: 'Admin', password: hashedPassword, role: 'admin' },
    })

    await prisma.cartItem.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.productImage.deleteMany()
    await prisma.productVariation.deleteMany()
    await prisma.review.deleteMany()
    await prisma.stockMovement.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()

    await prisma.cargoCompany.upsert({
      where: { code: 'yurtici' },
      update: {},
      create: { name: 'Yurtiçi Kargo', code: 'yurtici', trackingUrl: 'https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code={tracking_number}', baseShippingCost: 39.90, freeShippingThreshold: 500, isActive: true, isDefault: true },
    })
    await prisma.cargoCompany.upsert({
      where: { code: 'aras' },
      update: {},
      create: { name: 'Aras Kargo', code: 'aras', trackingUrl: 'https://www.araskargo.com.tr/hizmetler/gonderitakip.aspx?tkn={tracking_number}', baseShippingCost: 39.90, isActive: true, isDefault: false },
    })

    const settings = [
      { key: 'site_name', value: 'Ateşoğlu Süt', group: 'general' },
      { key: 'site_logo', value: '', group: 'general' },
      { key: 'site_phone', value: '', group: 'general' },
      { key: 'site_email', value: 'info@atesoglusut.com', group: 'general' },
      { key: 'site_whatsapp', value: '', group: 'general' },
      { key: 'free_shipping_threshold', value: '500', group: 'shipping' },
      { key: 'shipping_cost', value: '39.90', group: 'shipping' },
      { key: 'payment_credit_card', value: 'false', group: 'payment' },
      { key: 'payment_bank_transfer', value: 'true', group: 'payment' },
      { key: 'payment_cash_on_delivery', value: 'true', group: 'payment' },
      { key: 'tax_rate', value: '8', group: 'general' },
    ]
    for (const s of settings) {
      await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
    }

    const catPeynir  = await prisma.category.create({ data: { name: 'Peynirler',     slug: 'peynirler',     sortOrder: 1 } })
    const catBal     = await prisma.category.create({ data: { name: 'Bal & Pekmez',  slug: 'bal-pekmez',    sortOrder: 2 } })
    const catTereyag = await prisma.category.create({ data: { name: 'Tereyağı',      slug: 'tereyagi',      sortOrder: 3 } })
    const catDogal   = await prisma.category.create({ data: { name: 'Doğal Ürünler', slug: 'dogal-urunler', sortOrder: 4 } })

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
            data: { productId: product.id, name: v.name, price: v.price, comparePrice: v.comparePrice, stock: 199, isDefault: v.isDefault ?? i === 0, sortOrder: v.sortOrder ?? i },
          })
        }
      }
      return product
    }

    // PEYNİRLER
    await createProduct({ categoryId: catPeynir.id, name: 'Göbek Kaşar', slug: 'gobek-kasar', shortDescription: 'Tam yağlı inek sütünden üretilmiş, yuvarlak formu ve yumuşak iç dokusuyla özel kaşar peyniri.', description: `<h2>Doğallık ve Lezzetin Buluştuğu Göbek Kaşarı</h2><p>Göbek kaşarı, peynir severlerin ilk tercihi olmaya aday, tam yağlı inek sütünden üretilmiş özel bir kaşar peyniridir. Yuvarlak şekli ve daha yumuşak iç dokusuyla, klasik kaşar peynirlerinden ayrılan bu ürün, farkını hemen hissettirir.</p>`, price: 419.99, comparePrice: 439.99, weight: 1.5, isFeatured: true, images: ['http://atesoglusut.com/wp-content/uploads/2025/09/gorsel_2025-11-01_125346790.png', 'http://atesoglusut.com/wp-content/uploads/2025/09/Gobek-Kasar-1.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Yağlı Çeçil', slug: 'yagli-cecil', shortDescription: 'Yağlı çeçil peyniri, geleneksel yöntemlerle üretilen, damak tadınıza uygun eşsiz bir peynir çeşididir.', description: `<p>En çok tüketilen peynir türlerinden biridir. Klasik yöntem olan suda haşlanarak yapılır.</p>`, price: 450, comparePrice: 499.99, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/09/gorsel_2025-11-01_124737410.png', 'http://atesoglusut.com/wp-content/uploads/2025/09/gorsel_2025-10-03_010533624.png', 'http://atesoglusut.com/wp-content/uploads/2025/09/Yagli-Cecil.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Obruk Peyniri', slug: 'obruk-peyniri', shortDescription: 'Geleneksel yöntemlerle hazırlanan, kendine özgü aromasıyla Obruk peyniri.', price: 699.99, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/09/Obruk-Peyniri.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Ardahan Damal Çökeleği', slug: 'ardahan-damal-cokele-i', shortDescription: 'Doğal yöntemlerle üretilen Ardahan yaylalarından çökelek.', description: `<p>Doğal yöntemlerle üretilen Damal çökeleği, Ardahan'ın yüksek rakımlı yaylalarında beslenen hayvanların sütünden elde edilir.</p>`, price: 449.99, comparePrice: 599.99, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/09/gorsel_2025-11-01_124424473.png', 'http://atesoglusut.com/wp-content/uploads/2025/09/Cokelek.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Çörek Otlu Peynir', slug: 'corek-otlu-peynir', shortDescription: 'Çörek otunun aromatik lezzetiyle zenginleştirilmiş, doğal ve taze peynir.', price: 199.99, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/09/Corek-otlu-peynir.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Erzincan Tulum Peyniri', slug: 'erzincan-tulum-peyniri', shortDescription: 'Munzur Yaylalarının "Akkaraman" koyunlarından, şirden mayasıyla geleneksel yöntemlerle üretilen %100 doğal tulum peyniri.', price: 749.99, comparePrice: 799.99, weight: 1, isFeatured: true, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_124233356.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/DSC05911-scaled.jpg'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Ateşoğlu Kaşar (1.8Kg)', slug: 'atesoglu-kasar-1-8kg', shortDescription: 'Ardahan Göle yaylalarından elde edilen sütlerden, modern fabrikada olgunlaştırılmış tam yağlı taze kaşar.', price: 779.99, comparePrice: 839.99, weight: 1.8, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_125106630.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/DSC05811-scaled.jpg'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Ateşoğlu Eski Kaşar', slug: 'atesoglu-eski-kasar', shortDescription: 'Ardahan Göle yaylalarından elde edilen sütlerden, uzun süre olgunlaştırılmış eski kaşar.', price: 449, comparePrice: 490, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_131002491.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_011946085.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Ateşoğlu Eski Kaşar (12.5-13Kg)', slug: 'atesoglu-eski-kasar-buyuk', shortDescription: 'Toplu alım için ideal, 12.5-13Kg büyük boy Ateşoğlu Eski Kaşar.', price: 5699.99, comparePrice: 5850, weight: 13, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_130204796.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/DSC05851-scaled.jpg'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Kars Köy Peyniri Az Tuzlu Tam Yağlı', slug: 'kars-koy-peyniri', shortDescription: "Kars'ta 1768m rakımda yayla ineklerinin sütünden, şirden mayalı, 3-4 ay salamurada dinlendirilmiş köy peyniri.", price: 399.99, comparePrice: 439.99, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_131446635.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012036718.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Konya Tulum Peyniri', slug: 'konya-tulum-peyniri', shortDescription: "Konya'nın eşsiz yaylalarından inek sütüyle, geleneksel yöntemlerle doğal ortamda olgunlaştırılan tulum peyniri.", price: 299.99, comparePrice: 349.99, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_131253443.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012141891.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Blok Kaşar', slug: 'blok-kasar', shortDescription: 'Taze inek sütünden, haşlanıp soğuk depoda 2-3 ay dinlendirilerek üretilen, katkısız blok kaşar.', price: 419.99, comparePrice: 450, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_130131055.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012234860.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Trakya Tam Yağlı Beyaz Peynir', slug: 'trakya-beyaz-peynir', shortDescription: "Trakya'nın en bilinen inek sütü peyniri; minimum 6 ay tenekede olgunlaştırılmış, sert ve parlak yapılı.", price: 429.99, comparePrice: 500, weight: 0.75, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123919344.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012356868.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Kars Gravyer Peyniri', slug: 'kars-gravyer-peyniri', shortDescription: '"Peynirlerin Kralı" Kars Gravyeri; İsviçre usulü, yağlı sütten 8-9 ay olgunlaştırılmış.', price: 999.99, comparePrice: 1099.99, weight: 1, isFeatured: true, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123617869.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/Gravyer-kucuk.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Kars Göğermiş Çeçil Peyniri', slug: 'kars-gogermis-cecil-peyniri', shortDescription: 'Soğuk havada 7 ay olgunlaşan Kars küflü peyniri; doğal probiyotik, bağışıklık güçlendirici.', price: 374.99, comparePrice: 420, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_130712928.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012711167.png'] })
    await createProduct({ categoryId: catPeynir.id, name: 'Kars Taze Çeçil Peyniri', slug: 'kars-taze-cecil-peyniri', shortDescription: 'Haşlanıp el ile tel tel çekilerek örülen, salamurada katkısız taze çeçil peyniri.', price: 349.99, comparePrice: 400, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012818656.png'] })

    // BAL & PEKMEZ
    await createProduct({ categoryId: catBal.id, name: 'Ardahan Petek Çiçek Balı', slug: 'ardahan-petek-cicek-bali', shortDescription: "Kafkas arılarının Kars/Ardahan'ın bin bir çiçeğinden ürettiği, petek halinde doğal çiçek balı.", price: 1199.99, weight: 2, isFeatured: true, images: ['http://atesoglusut.com/wp-content/uploads/2025/09/gorsel_2025-11-01_125545760.png', 'http://atesoglusut.com/wp-content/uploads/2025/09/Petek-Bal.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005955598.png'], variations: [{ name: '2Kg', price: 1199.99, isDefault: true, sortOrder: 0 }, { name: '3Kg', price: 1799.99, sortOrder: 1 }, { name: '4Kg', price: 2399.99, sortOrder: 2 }] })
    await createProduct({ categoryId: catBal.id, name: 'Karakovan Balı', slug: 'karakovan-bali', shortDescription: 'Kafkas arılarının doğal kovanlarında ürettiği, kristalize amber renkli Ardahan/Kars karakovan balı.', price: 2599.99, weight: 2, isFeatured: true, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_125815162.png', 'http://atesoglusut.com/wp-content/uploads/2025/09/Petek-Bal.png'], variations: [{ name: '2kg', price: 2599.99, isDefault: true, sortOrder: 0 }, { name: '3kg', price: 3899.99, sortOrder: 1 }] })
    await createProduct({ categoryId: catBal.id, name: 'Ateşoğlu Ardahan Süzme Çiçek Balı', slug: 'atesoglu-ardahan-suzme-cicek-bali', shortDescription: '2100 rakımlı yaylalarda 1400+ çiçek türüyle Kafkas arılarının ürettiği organik süzme çiçek balı.', price: 1099.99, comparePrice: 1200, weight: 3.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_125440137.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_010117554.png'] })
    await createProduct({ categoryId: catBal.id, name: 'İspir Dut Pekmezi (1.4Kg)', slug: 'ispir-dut-pekmezi', shortDescription: 'Taze ağaç dutundan hiçbir katkı maddesi eklenmeden, odun ateşinde kaynatılıp güneşte kıvama getirilen gerçek dut pekmezi.', price: 429.99, comparePrice: 470, weight: 1.4, images: ['http://atesoglusut.com/wp-content/uploads/2025/09/gorsel_2025-11-01_125955510.png', 'http://atesoglusut.com/wp-content/uploads/2025/09/Dut-Pekmezi-1.png'] })
    await createProduct({ categoryId: catBal.id, name: 'Erzurum Ballı Keçi Boynuzu Özü Pekmezi', slug: 'keciboynuzu-pekmezi', shortDescription: 'Şifa kaynağı, C vitamini ve antioksidan deposu keçiboynuzu pekmezi (harnup pekmezi).', price: 349.99, comparePrice: 400, weight: 0.8, images: ['http://atesoglusut.com/wp-content/uploads/2025/09/gorsel_2025-11-01_124035897.png', 'http://atesoglusut.com/wp-content/uploads/2025/09/Keci-boynuzu.png'] })
    await createProduct({ categoryId: catBal.id, name: 'Durmuşoğulları Üzüm Pekmezi', slug: 'uzum-pekmezi', shortDescription: 'Geleneksel yöntemlerle üretilen, doğal üzüm pekmezi.', price: 299.99, weight: 0.8, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_124547533.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-19-at-18.20.14.jpeg'] })

    // TEREYAĞI
    await createProduct({ categoryId: catTereyag.id, name: 'Ardahan Tereyağı', slug: 'ardahan-tereyagi', shortDescription: 'Nisan-Mayıs kır çiçeklerinin bol olduğu dönemde, Ardahan yaylalarının doğal sütünden yapılan, katkısız organik tereyağı.', price: 574.99, isFeatured: true, images: ['http://atesoglusut.com/wp-content/uploads/2025/09/gorsel_2025-11-01_125004971.png', 'http://atesoglusut.com/wp-content/uploads/2025/09/tereyag.png'], variations: [{ name: '1Kg', price: 574.99, isDefault: true, sortOrder: 0 }, { name: '2Kg', price: 1149.99, sortOrder: 1 }, { name: '5Kg', price: 2800, comparePrice: 2900, sortOrder: 2 }, { name: '10Kg', price: 5750, comparePrice: 6000, sortOrder: 3 }, { name: '20Kg', price: 11500, comparePrice: 11750, sortOrder: 4 }] })
    await createProduct({ categoryId: catTereyag.id, name: 'Eritilmiş Ardahan Tereyağı', slug: 'eritilmis-ardahan-tereyagi', shortDescription: 'Tereyağından su ve yağsız maddeler uzaklaştırılarak elde edilen %99 saf süt yağı; 200-240°C dayanıklı.', price: 649.99, comparePrice: 699.99, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/09/gorsel_2025-11-01_124814503.png', 'http://atesoglusut.com/wp-content/uploads/2025/09/Erilitmis-Tereyag.png', 'http://atesoglusut.com/wp-content/uploads/2025/09/gorsel_2025-10-03_011037161.png'] })

    // DOĞAL ÜRÜNLER
    await createProduct({ categoryId: catDogal.id, name: 'Cevizli Sucuk', slug: 'cevizli-sucuk', shortDescription: 'Üzüm pekmezi ve cevizle geleneksel yöntemlerle hazırlanan, katkısız doğal tatlı.', price: 349.99, comparePrice: 379.99, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/09/Cevizli-Sucuk.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Siyah Erik Kurusu', slug: 'siyah-erik-kurusu', shortDescription: "Artvin Yusufeli'nde yetişen eriklerden doğal yöntemlerle kurutulmuş, katkısız enerji ve besin kaynağı.", price: 319.99, comparePrice: 350, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005306839.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005323294.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Çekirdeksiz Siyah Erik Kurusu', slug: 'cekirdeksiz-siyah-erik-kurusu', shortDescription: 'Artvin Yusufeli eriklerinden doğal kurutulmuş, çekirdeksiz, katkısız besin kaynağı.', price: 349.99, comparePrice: 370, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005306839.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005323294.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Kuru Kızılcık', slug: 'kuru-kizilcik', shortDescription: "Ağustos-Eylül'de olgun toplanıp kurutulan, C vitamini ve melatonin deposu kızılcık.", price: 279.99, comparePrice: 300, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005410072.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Kuru Kayısı (Aşma)', slug: 'kuru-kayisi-asma', shortDescription: 'Erzurum kayısısı, köylü eliyle açılıp güneşte kurutulmuş; kükürt-istim yok, naturel ve serttir.', price: 299.99, comparePrice: 350, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005554759.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Kızılcık Ekşisi', slug: 'kizilcik-eksisi', shortDescription: 'Bölgede "kiren ekşisi" olarak bilinen; olgun kızılcığın suyundan kaynatılarak hazırlanan doğal ekşi/şurup.', price: 599.99, comparePrice: 699.99, weight: 0.7, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005639367.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Iğdır Dut Kurusu', slug: 'igdir-dut-kurusu', shortDescription: "İspir dutları güneşte serilerek kurutulan, kuruyemiş gibi ya da hoşaflık olarak tüketilebilir dut kurusu.", price: 399.99, comparePrice: 450, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005735750.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Kars Kaz Eti', slug: 'kars-kaz-eti', shortDescription: 'Merada büyütülüp ilk karla tuzlanarak kuru ayazda kurutulan Kars kazı; yeni yıl sofralarının vazgeçilmezi.', price: 3999.99, weight: 2.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/WhatsApp-Gorsel-2025-11-17-saat-19.31.38_ea2d6ddb.jpg', 'http://atesoglusut.com/wp-content/uploads/2025/10/WhatsApp-Gorsel-2025-11-17-saat-19.31.39_dae173f9-1.jpg'] })
    await createProduct({ categoryId: catDogal.id, name: 'Sarı Erik', slug: 'sari-erik', shortDescription: 'Doğal yetiştirilmiş sarı erik.', price: 319.99, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/Sari-Erik-1.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Cevizli Dut Pestili', slug: 'cevizli-dut-pestili', shortDescription: 'Dut şırasına ceviz batırılarak hazırlanan geleneksel pestil.', price: 319.99, weight: 0.3, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_132727215.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/Cevizli-Dut-Pestili.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Erik Ekşisi', slug: 'erik-eksisi', shortDescription: 'Doğal yöntemlerle hazırlanan geleneksel erik ekşisi.', price: 349.99, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/erik-eksisi-1.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Sade Dut Pestili', slug: 'sade-dut-pestili', shortDescription: 'Geleneksel yöntemlerle hazırlanan sade dut pestili.', price: 299.99, weight: 0.3, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123411096.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/sade-dut-pestili.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Siyah Special İri Zeytin', slug: 'siyah-special-iri-zeytin', shortDescription: 'Seçme iri taneli, doğal siyah zeytin.', price: 499.99, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_130831408.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/Siyah-Special-Iri-Zeytin.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Üçel Helva', slug: 'ucel-helva', shortDescription: 'Geleneksel yöntemlerle hazırlanan doğal Üçel helvası.', price: 379.99, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_131913652.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/DSC05893-scaled.jpg'] })
    await createProduct({ categoryId: catDogal.id, name: 'Kars Kavurması', slug: 'kars-kavurmasi', shortDescription: 'Geleneksel Kars mutfağından, doğal yöntemlerle hazırlanan et kavurması.', price: 1449.99, weight: 1, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_125248415.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/DSC05880-scaled.jpg'] })
    await createProduct({ categoryId: catDogal.id, name: 'Sucuk', slug: 'sucuk', shortDescription: 'Kars yöresine özgü baharatlarla hazırlanan doğal sucuk.', price: 1250, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123523247.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/DSC05908-scaled.jpg'] })
    await createProduct({ categoryId: catDogal.id, name: 'Evin Helva', slug: 'evin-helva', shortDescription: 'Ev yapımı tahin helvası.', price: 299.99, weight: 0.5, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123737620.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/DSC05896-scaled.jpg'] })
    await createProduct({ categoryId: catDogal.id, name: 'Elma Kurusu', slug: 'elma-kurusu', shortDescription: 'Doğal yöntemlerle güneşte kurutulmuş elma dilimleri.', price: 319.99, weight: 0.25, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123159228.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/elma-kurusu.png'] })
    await createProduct({ categoryId: catDogal.id, name: 'Adıyaman Akide Şekeri', slug: 'adiyaman-akide-sekeri', shortDescription: 'Geleneksel yöntemlerle hazırlanan Adıyaman akide şekeri.', price: 129.99, weight: 0.25, images: ['http://atesoglusut.com/wp-content/uploads/2025/10/gorsel_2025-11-01_131046636.png', 'http://atesoglusut.com/wp-content/uploads/2025/10/Akide-Sekeri.png'] })

    return NextResponse.json({ ok: true, mesaj: '43 ürün ve 4 kategori başarıyla eklendi.' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
