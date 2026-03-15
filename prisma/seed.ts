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
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s })
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
    isFeatured?: boolean; isActive?: boolean; images: string[]; variations?: Variation[]
  }

  const BASE9  = 'https://sablonmarketi.com/wp-content/uploads/2025/09'
  const BASE10 = 'https://sablonmarketi.com/wp-content/uploads/2025/10'

  async function createProduct(data: ProductInput) {
    const hasVariations = !!(data.variations && data.variations.length > 0)
    const product = await prisma.product.create({
      data: {
        categoryId: data.categoryId, name: data.name, slug: data.slug,
        shortDescription: data.shortDescription, description: data.description,
        price: data.price, comparePrice: data.comparePrice,
        stock: hasVariations ? 0 : (data.stock ?? 199),
        weight: data.weight, hasVariations,
        isFeatured: data.isFeatured ?? false,
        isActive: data.isActive ?? true,
        lowStockThreshold: 5,
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

  // ═══════════════════════════════════════════════════════════
  //  TEREYAĞI
  // ═══════════════════════════════════════════════════════════
  console.log('🧈 Tereyağı...')

  // ID 133 - Ardahan Tereyağı (variable)
  await createProduct({
    categoryId: catTereyag.id, name: 'Ardahan Tereyağı', slug: 'ardahan-tereyagi',
    description: `<p>Kars tereyağı doğal kaynaklar ile tamamen organik şekilde üretilmektedir.</p><p>Genel olarak en kaliteli ve verimli tereyağı nisan ve mayıs ayları gibi yapılmaktadır. Bu dönemde kır çiçekleri daha fazladır ve bu çiçeklerle beslenen ineklerin sütlerinden elde edilen tereyağı daha sarı renkte olmaktadır.</p><p>Ardahan/Kars bölgesinde hayvanlar meralara bırakılarak doğal yollar ile beslendiklerinden sütlerinin kalitesi yüksek olmakta ve elde edilen gıdalarda olumlu etki olarak kendini göstermektedir. Doğal Ardahan tereyağı yapmak için taze olan inek sütü filtrelenerek kaymağı üzerinden alınır. Bu kaymak yaklaşık iki gün boyunca dinlenmeye bırakılır ve daha sonra yayıklarda kıvam alıncaya kadar yayılır.</p><p><strong>İçerisine hiçbir katkı maddesi ilave edilmeyen Ardahan tereyağı sağlık koşullarına uygun ortamlarda üretilmektedir.</strong></p>`,
    price: 574.99, isFeatured: true,
    images: [
      `${BASE9}/gorsel_2025-11-01_125004971.png`,
      `${BASE9}/tereyag.png`,
    ],
    variations: [
      { name: '1Kg',  price: 574.99,  isDefault: true, sortOrder: 0 },
      { name: '2Kg',  price: 1149.99, sortOrder: 1 },
      { name: '5Kg',  price: 2800,    comparePrice: 2900,  sortOrder: 2 },
      { name: '10Kg', price: 5750,    comparePrice: 6000,  sortOrder: 3 },
      { name: '20Kg', price: 11500,   comparePrice: 11750, sortOrder: 4 },
    ],
  })

  // ID 146 - Eritilmiş Ardahan Tereyağı
  await createProduct({
    categoryId: catTereyag.id, name: 'Eritilmiş Ardahan Tereyağı', slug: 'eritilmis-ardahan-tereyagi',
    shortDescription: 'Eritilmiş tereyağı, doğal ve katkısız yapısı ile yemeklerinize ve tatlılarınıza eşsiz bir lezzet katar.',
    description: `<p>Sade yağ tuzsuz tereyağından, su ve yağsız kuru maddeler uzaklaştırılarak elde ediliyor. Sonunda ise %99 oranında süt yağı barındıran sade yağ ortaya çıkıyor. 1 kg'lık tereyağından ortalama 900 gram sade yağ çıkıyor.</p><p><strong>Yemeklere tereyağı dahil diğer yağlardan daha fazla lezzet verir. Sade yağı makarnalardan yemeklere, kahvaltıdan pilavlara pek çok yerde kullanabilirsiniz. 200-240 derece sıcağa kadar dayanıklıdır. Buzdolabında 1 yıl durabilecek kadar dayanıklıdır.</strong></p>`,
    price: 649.99, comparePrice: 699.99,
    images: [
      `${BASE9}/gorsel_2025-11-01_124814503.png`,
      `${BASE9}/Erilitmis-Tereyag.png`,
      `${BASE10}/gorsel_2025-10-03_011037161.png`,
    ],
  })

  // ═══════════════════════════════════════════════════════════
  //  PEYNİRLER
  // ═══════════════════════════════════════════════════════════
  console.log('🧀 Peynirler...')

  // ID 134 - Göbek Kaşar
  await createProduct({
    categoryId: catPeynir.id, name: 'Göbek Kaşar', slug: 'gobek-kasar',
    description: `<h2>Doğallık ve Lezzetin Buluştuğu Göbek Kaşarı</h2><p>Göbek kaşarı, peynir severlerin ilk tercihi olmaya aday, tam yağlı inek sütünden üretilmiş özel bir kaşar peyniridir. Yuvarlak şekli ve daha yumuşak iç dokusuyla, klasik kaşar peynirlerinden ayrılan bu ürün, farkını hemen hissettirir. Hem kahvaltılarda hem de yemek tariflerinde kullanabileceğiniz bu lezzet, yoğun aroması ve dengeli tuz oranıyla sofralarınızı zenginleştirir.</p><h2>Göbek Kaşarın Kullanım Kolaylığı</h2><p>Göbek kaşarı, tostlardan pizzalara, makarnalardan salatalara kadar geniş bir yelpazede kullanılabilir.</p><h2>Göbek Kaşarı: Ustalıkla Hazırlanmış Bir Peynir</h2><p>Göbek kaşarı, üretim sürecinde özel yöntemlerle olgunlaştırılmış ve inek sütü ile mükemmel bir uyum yakalamıştır.</p>`,
    price: 419.99, comparePrice: 439.99, isFeatured: true,
    images: [
      `${BASE9}/gorsel_2025-11-01_125346790.png`,
      `${BASE9}/Gobek-Kasar-1.png`,
    ],
  })

  // ID 137 - Yağlı Çeçil
  await createProduct({
    categoryId: catPeynir.id, name: 'Yağlı Çeçil', slug: 'yagli-cecil',
    shortDescription: 'Yağlı çeçil peyniri, geleneksel yöntemlerle üretilen, damak tadınıza uygun eşsiz bir peynir çeşididir.',
    description: `<p>En çok tüketilen peynir türlerinden biridir.</p><p>Klasik yöntem olan suda haşlanarak yapılır. Görünümü iplik şeklindedir ve rengi kaşar peynirine benzer.</p><p>Tam yağlı, yumuşak ve tuzlu bir peynirdir. El ile çekildiğinde kolaylıkla liflerine ayrılır. Doğanın sütlü, narin ve doygun lezzetli özel tarifidir.</p>`,
    price: 450, comparePrice: 499.99,
    images: [
      `${BASE9}/gorsel_2025-11-01_124737410.png`,
      `${BASE10}/gorsel_2025-10-03_010533624.png`,
      `${BASE9}/Yagli-Cecil.png`,
    ],
  })

  // ID 140 - Obruk Peyniri (stokta yok)
  await createProduct({
    categoryId: catPeynir.id, name: 'Obruk Peyniri', slug: 'obruk-peyniri',
    price: 699.99, stock: 0, isActive: false,
    images: [`${BASE9}/Obruk-Peyniri.png`],
  })

  // ID 141 - Ardahan Damal Çökeleği
  await createProduct({
    categoryId: catPeynir.id, name: 'Ardahan Damal Çökeleği', slug: 'ardahan-damal-cokelegı',
    description: `<p>Doğal yöntemlerle üretilen Damal çökeleği, Ardahan'ın yüksek rakımlı yaylalarında beslenen hayvanların sütünden elde edilir. Yoğurdun süzülmesiyle hazırlanan bu yöresel lezzet, yoğun kıvamı ve hafif ekşimsi tadıyla kahvaltılarda, börek içlerinde ve salatalarda sıkça tercih edilir. Katkısız, besleyici ve tamamen yerel üretimdir.</p>`,
    price: 449.99, comparePrice: 599.99,
    images: [
      `${BASE9}/gorsel_2025-11-01_124424473.png`,
      `${BASE9}/Cokelek.png`,
    ],
  })

  // ID 145 - Çörek Otlu Peynir
  await createProduct({
    categoryId: catPeynir.id, name: 'Çörek Otlu Peynir', slug: 'corek-otlu-peynir',
    shortDescription: 'Çörek otlu peynir, eşsiz aromasıyla sofralarınıza doğal bir lezzet getiriyor.',
    description: `<h2>Doğallık ve Tazelik Bir Arada</h2><p>Çörek otlu peynir, eşsiz aromasıyla sofralarınıza doğal bir lezzet getiriyor. Tamamen taze, doğal malzemelerle üretilen bu peynir, özellikle kahvaltılarınıza ve gün içinde tercih edeceğiniz atıştırmalıklara ayrı bir tat katmak için ideal.</p><h2>Lezzet ve Aroma Dengesi</h2><p>Bu peynir, çörek otunun kendine has yoğun aromasıyla peynirin yumuşak ve zengin dokusunu mükemmel bir uyumla birleştiriyor.</p><h2>Kullanım Alanları ve Faydaları</h2><p>Çörek otlu peynir, sadece lezzetiyle değil, çok yönlü kullanımıyla da öne çıkıyor.</p>`,
    price: 199.99,
    images: [`${BASE9}/Corek-otlu-peynir.png`],
  })

  // ID 477 - Erzincan Tulum Peyniri
  await createProduct({
    categoryId: catPeynir.id, name: 'Erzincan Tulum Peyniri', slug: 'erzincan-tulum-peyniri',
    description: `<p>Kekik kokulu Munzur Yaylalarının doğal ortamında beslenen "Akkaraman" ırkı koyunların organik sütü, şirden mayası ve tuz dışında hiçbir madde kullanılmadan geleneksel yöntemlerle, <strong>modern tesisimizde üretilmektedir. %100 doğal, sağlıklı ve lezzetlidir.</strong></p>`,
    price: 749.99, comparePrice: 799.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_124233356.png`,
      `${BASE10}/DSC05911-scaled.jpg`,
    ],
  })

  // ID 479 - Ateşoğlu Kaşar (1.8Kg)
  await createProduct({
    categoryId: catPeynir.id, name: 'Ateşoğlu Kaşar (1.8Kg)', slug: 'atesoglu-kasar-1-8kg',
    shortDescription: 'Ardahan ili Göle ilçesinde yaz mevsiminde ve mera hayvancılığının yapıldığı bölgede doğal şekilde elde edilen sütlerden üretilmektedir.',
    description: `<p>Ardahan ili Göle ilçesinde yaz mevsiminde ve mera hayvancılığının yapıldığı bölgede doğal şekilde elde edilen sütlerin, son teknoloji ile üretim yapmakta olan fabrikamızda peynire dönüşmekte ve olgunlaştırmaya (fermantasyon) bırakılmaktadır.</p><p><strong>TAM YAĞLI bir üründür.</strong></p><p>1997'den bugüne doğal süt ürünlerinde Türkiye'nin aranan markası olan Ateşoğlu <strong>Taze Kaşar</strong> ürününü incelemektesiniz.</p>`,
    price: 779.99, comparePrice: 839.99, weight: 1.8,
    images: [
      `${BASE10}/gorsel_2025-11-01_125106630.png`,
      `${BASE10}/DSC05811-scaled.jpg`,
    ],
  })

  // ID 481 - Ateşoğlu Eski Kaşar
  await createProduct({
    categoryId: catPeynir.id, name: 'Ateşoğlu Eski Kaşar', slug: 'atesoglu-eski-kasar',
    description: `<p>Ardahan ili Göle ilçesinde yaz mevsiminde ve mera hayvancılığının yapıldığı bölgede doğal şekilde elde edilen sütlerin, son teknoloji ile üretim yapmakta olan fabrikamızda peynire dönüşmekte ve olgunlaştırmaya (fermantasyon) bırakılmaktadır.</p><p><strong>TAM YAĞLI bir üründür.</strong></p><p>1997'den bugüne doğal süt ürünlerinde Türkiye'nin aranan markası olan Ateşoğlu <strong>Eski Kaşar</strong> ürününü incelemektesiniz.</p>`,
    price: 449, comparePrice: 490,
    images: [
      `${BASE10}/gorsel_2025-11-01_131002491.png`,
      `${BASE10}/gorsel_2025-10-03_011946085.png`,
    ],
  })

  // ID 483 - Kars Köy Peyniri Az Tuzlu Tam Yağlı
  await createProduct({
    categoryId: catPeynir.id, name: 'Kars Köy Peyniri Az Tuzlu Tam Yağlı', slug: 'kars-koy-peyniri-az-tuzlu',
    shortDescription: 'Çiğ sütün peynir mayası katılarak yapılan bu peynir süt mayalandıktan sonra küçük kalıplara ayrılır.',
    description: `<p>Kars peyniri içinde en sade lezzete sahip olan peynirdir.</p><p>Çiğ sütün peynir mayası katılarak yapılan bu peynir süt mayalandıktan sonra küçük kalıplara ayrılır. 3-4 ay tuzlu suda bekletilerek daha sağlıklı bir hale getirilir.</p><p>Kars'ta 1768 m rakım yükseklikte yayla ve meralarda otlayan gezen ineklerin mis gibi kokan sütlerinden elde edilmiştir.</p>`,
    price: 399.99, comparePrice: 439.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_131446635.png`,
      `${BASE10}/gorsel_2025-10-03_012036718.png`,
    ],
  })

  // ID 485 - Konya Tulum Peyniri
  await createProduct({
    categoryId: catPeynir.id, name: 'Konya Tulum Peyniri', slug: 'konya-tulum-peyniri',
    shortDescription: 'Konya\'nın eşsiz yaylalarından gelen inek sütü ile hazırlanan Konya Tulum Peyniri, kendine has yoğun aroması ve kıvamıyla sofralarınıza gerçek bir lezzet şöleni sunar.',
    description: `<p><strong>Konya Tulum Peyniri – Doğallığın ve Lezzetin Buluştuğu Nokta</strong></p><p>Konya'nın eşsiz yaylalarından gelen inek sütü ile hazırlanan Konya Tulum Peyniri, kendine has yoğun aroması ve kıvamıyla sofralarınıza gerçek bir lezzet şöleni sunar. Geleneksel yöntemlerle, doğal ortamda olgunlaştırılan bu peynir, hem kahvaltılarınızda hem de yemeklerinizde eşsiz bir tat bırakır.</p><ul><li><strong>Doğal ve katkısız:</strong> Hiçbir koruyucu veya yapay aroma içermez.</li><li><strong>Zengin lezzet:</strong> Tulumda uzun süre olgunlaşarak yoğun ve karakteristik bir aroma kazanır.</li><li><strong>Çok yönlü kullanım:</strong> Kahvaltılardan mezeye, böreklerden salatalara kadar her tarifte harika bir tat.</li></ul>`,
    price: 299.99, comparePrice: 349.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_131253443.png`,
      `${BASE10}/gorsel_2025-10-03_012141891.png`,
    ],
  })

  // ID 487 - Blok Kaşar
  await createProduct({
    categoryId: catPeynir.id, name: 'Blok Kaşar', slug: 'blok-kasar',
    shortDescription: 'Taze inek sütü filtrelendikten sonra belirli sıcaklıklara kadar ısıtılır ve sonrasında mayalanır.',
    description: `<p>Taze inek sütü filtrelendikten sonra belirli sıcaklıklara kadar ısıtılır ve sonrasında mayalanır.</p><p>Daha sonra bir iki gün acı suyunu atması için dinlendirilir. Acı suyunu attıktan sonra haşlanır ve yuvarlak kalıplara doldurulur, kurutulduktan sonra soğuka hava depolarında iki üç ay bekletilir ve tüketime hazır hale gelir.</p><p>Yaklaşık on litre sütten bir kg kaşar elde edilir.</p><p><strong>Bu işlemlerin tamamı hijyenik ortamlarda yapılır. Ve hiçbir katkı maddesi kullanılmaz.</strong></p>`,
    price: 419.99, comparePrice: 450,
    images: [
      `${BASE10}/gorsel_2025-11-01_130131055.png`,
      `${BASE10}/gorsel_2025-10-03_012234860.png`,
    ],
  })

  // ID 489 - Trakya Tam Yağlı Beyaz Peynir
  await createProduct({
    categoryId: catPeynir.id, name: 'Trakya Tam Yağlı Beyaz Peynir', slug: 'trakya-tam-yagli-beyaz-peynir',
    shortDescription: 'İnek sütünden üretilir ve kendine has bir tada sahiptir.',
    description: `<p>Trakya'nın en iyi bilinen peyniridir.</p><p>İnek sütünden üretilir ve kendine has bir tada sahiptir. <strong>Sert ve parlak bir yapısı vardır.</strong></p><p>Minimum 6 ay soğuk odalarda olgunlaştırılır. <strong>Doğanın sütlü, vazgeçilmez klasik tarifidir.</strong></p>`,
    price: 429.99, comparePrice: 500,
    images: [
      `${BASE10}/gorsel_2025-11-01_123919344.png`,
      `${BASE10}/gorsel_2025-10-03_012356868.png`,
    ],
  })

  // ID 491 - Kars Gravyer Peyniri
  await createProduct({
    categoryId: catPeynir.id, name: 'Kars Gravyer Peyniri', slug: 'kars-gravyer-peyniri',
    shortDescription: 'Peynirlerin kralı olarak da bilinen Gravyer Peyniri, Kars\'ın eşsiz doğasında üretilmektedir.',
    description: `<p>Peynirlerin kralı olarak da bilinen Gravyer Peyniri 1800'lü yıllarda İsviçrelilerin Kafkasya Bölgesine geldiklerinde Zavot adı verilen sığır türünün sütünden yapmış oldukları bir peynir çeşididir.</p><p>Kars gravyer peyniri Emmental Peyniri ile Gruyere Peyniri tadları arası bir tada sahiptir. <strong>Kars gravyeri yağlı sütten yapılmaktadır, dolayısı ile besin değeri yüksek bir peynirdir.</strong></p><p>Gravyer peyniri imalatından 8-9 ay sonra tüketilebilir. Raf ömrü ise toplam 36 aydır.</p>`,
    price: 999.99, comparePrice: 1099.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_123617869.png`,
      `${BASE10}/Gravyer-kucuk.png`,
    ],
  })

  // ID 493 - Kars Göğermiş Çeçil Peyniri
  await createProduct({
    categoryId: catPeynir.id, name: 'Kars Göğermiş Çeçil Peyniri', slug: 'kars-gogermis-cecil-peyniri',
    shortDescription: 'Kars Göğermiş Peyniri, peynir yapısındaki küften dolayı vücutta penisilinin üstlendiği işlevi yerine getirmektedir.',
    description: `<p>Taze civil peyniri tuzlandıktan sonra bir gün acı suyunu atması için dinlendirilir. Daha sonra lor peyniri ile karıştırılarak tahta kaplara doldurulur ve preslenerek suyunu iyice atması sağlanır. Suyunu atan peynirler soğuk hava depolerında yedi ay kadar bekletildikten sonra tüketime hazır hale gelir.</p><p><strong>Bu işlemlerin tamamı hijyenik ortamlarda yapılır. Ve hiçbir katkı maddesi kullanılmaz.</strong></p><p><strong>Mineral bakımından zengin olan Kars küflü peyniri özellikle içeriğinde bulunan kalsiyum sebebiyle kemik ve diş sağlığını korumada oldukça etkindir.</strong></p>`,
    price: 374.99, comparePrice: 420,
    images: [
      `${BASE10}/gorsel_2025-11-01_130712928.png`,
      `${BASE10}/gorsel_2025-10-03_012711167.png`,
      `${BASE10}/gorsel_2025-10-03_012659647.png`,
    ],
  })

  // ID 496 - Kars Taze Çeçil Peyniri
  await createProduct({
    categoryId: catPeynir.id, name: 'Kars Taze Çeçil Peyniri', slug: 'kars-taze-cecil-peyniri',
    shortDescription: 'Taze inek sütü filtrelendikten sonra belirli sıcaklıklara kadar ısıtılır ve sonrasında mayalanır.',
    description: `<p>Taze inek sütü filtrelendikten sonra belirli sıcaklıklara kadar ısıtılır ve sonrasında mayalanır.</p><p>Daha sonra bir iki gün acı suyunu atması için dinlendirilir. Acı suyunu attıktan sonra haşlanır ve el ile çekilerek tel tel olması sağlanır. Sonrasında örülür ve tuzlanarak salamura edilir.</p><p><strong>Bu işlemlerin tamamı hijyenik ortamlarda yapılır. Ve hiçbir katkı maddesi kullanılmaz.</strong></p>`,
    price: 349.99, comparePrice: 400,
    images: [`${BASE10}/gorsel_2025-10-03_012818656.png`],
  })

  // ID 822 - Ateşoğlu Eski Kaşar (12.5-13Kg)
  await createProduct({
    categoryId: catPeynir.id, name: 'Ateşoğlu Eski Kaşar (12.5-13Kg)', slug: 'atesoglu-eski-kasar-buyuk',
    price: 5699.99, comparePrice: 5850,
    images: [
      `${BASE10}/gorsel_2025-11-01_130204796.png`,
      `${BASE10}/DSC05851-scaled.jpg`,
    ],
  })

  // ═══════════════════════════════════════════════════════════
  //  BAL & PEKMEZ
  // ═══════════════════════════════════════════════════════════
  console.log('🍯 Bal & Pekmez...')

  // ID 136 - Ardahan Petek Çiçek Balı (variable)
  await createProduct({
    categoryId: catBal.id, name: 'Ardahan Petek Çiçek Balı', slug: 'ardahan-petek-cicek-bali',
    shortDescription: 'Petek bal, doğanın bizlere sunduğu en saf ve en doğal ürünlerden biridir.',
    description: `<p>Kars/Ardahan balı, Kars'ın kendi coğrafyasına has bin bir çeşit bitki çiçeklerinin özütünden Kafkas arılarının yaptığı bir baldır.</p><p>Kars balı çoğunlukla göçebe arıcıların kovanlarında üretilir. Kafkas ırkı arı sadece Kars yöresinde bulunur ve Kars balına lezzetini Kafkas arısı verir.</p><p>Bu arının temel özelliği dil uzunluğudur. Dili 7.2 mm olan Kafkas arısı, diğer arılardan 3mm daha fazla olan dili sayesinde derin tüplü çiçeklerin nektarlarından da faydalandığından Kars balına eşsiz lezzetini vermektedir.</p>`,
    price: 1199.99, isFeatured: true,
    images: [
      `${BASE9}/gorsel_2025-11-01_125545760.png`,
      `${BASE9}/Petek-Bal.png`,
      `${BASE10}/gorsel_2025-10-03_005955598.png`,
    ],
    variations: [
      { name: '2Kg', price: 1199.99, isDefault: true, sortOrder: 0 },
      { name: '3Kg', price: 1799.99, sortOrder: 1 },
      { name: '4Kg', price: 2399.99, sortOrder: 2 },
    ],
  })

  // ID 142 - İspir Dut Pekmezi (1.4Kg)
  await createProduct({
    categoryId: catBal.id, name: 'İspir Dut Pekmezi (1.4Kg)', slug: 'ispir-dut-pekmezi',
    shortDescription: 'Taze olarak ağaçtan toplanan dutlar ayıklandıktan sonra genişçe bir kazana boşaltılır.',
    description: `<p>Taze olarak ağaçtan toplanan dutlar ayıklandıktan sonra genişçe bir kazana boşaltılır. Hiç bir ilave yapılmadan kazan odun ateşi üzerine bırakılır. Tamamen kendi suyuyla kaynayan dutun suyu alınır ve kazanda kalan dutlar ise süzülmesi için özel bez çuvallara alınır.</p><p>Elde edilen dut suyu iyice süzülerek yeniden farklı bir kazana alınarak odun ateşinde kaynatılmaya başlanır. <strong>Bu işlemler esnasından hiçbir şekilde şeker ilavesi yapılmaz, işlemler tamamlanınca şekersiz hakiki İspir dut pekmezi tüketime hazır hale gelir.</strong></p>`,
    price: 429.99, comparePrice: 470,
    images: [
      `${BASE9}/gorsel_2025-11-01_125955510.png`,
      `${BASE9}/Dut-Pekmezi-1.png`,
    ],
  })

  // ID 143 - Erzurum Ballı Keçi Boynuzu Özü Pekmezi
  await createProduct({
    categoryId: catBal.id, name: 'Erzurum Ballı Keçi Boynuzu Özü Pekmezi', slug: 'erzurum-balli-keci-boynuzu-pekmezi',
    shortDescription: 'Şifa kaynağı olan keçiboynuzu pekmezi, besin değerleri bakımından oldukça zengindir.',
    description: `<h2>Keçi Boynuzunun Doğal ve Besleyici Özellikleri</h2><p>Keçi boynuzu, doğanın bize sunduğu mucizevi bir lezzettir. Besleyici yapısıyla hem sağlığınızı destekler hem de damak zevkiniz için mükemmel bir seçenek oluşturur.</p><h2>Tatlı Tarifleriniz İçin İdeal Bir Seçenek</h2><p>Eşsiz tat profiliyle keçi boynuzu, tatlı tariflerinize yeni bir soluk getiriyor.</p><h2>Sağlıklı Atıştırmalıklar İçin Mükemmel Bir Alternatif</h2><p>Keçi boynuzu sadece tariflerde değil, aynı zamanda sağlıklı bir atıştırmalık olarak da tercih edilebilir. Gluten içermediğinden, gluten hassasiyeti olan bireyler için de mükemmel bir seçenektir.</p>`,
    price: 349.99, comparePrice: 400, stock: 640,
    images: [
      `${BASE9}/gorsel_2025-11-01_124035897.png`,
      `${BASE9}/Keci-boynuzu.png`,
    ],
  })

  // ID 468 - Karakovan Balı (variable)
  await createProduct({
    categoryId: catBal.id, name: 'Karakovan Balı', slug: 'karakovan-bali',
    description: `<p><strong>Kars/Ardahan balı, Kars'ın kendi coğrafyasına has bin bir çeşit bitki çiçeklerinin özütünden Kafkas arılarının yaptığı bir baldır.</strong></p><p>Kars balı çoğunlukla göçebe arıcıların kovanlarında üretilir. Kafkas ırkı arı sadece Kars yöresinde bulunur ve Kars balına lezzetini Kafkas arısı verir.</p><p>Kars balının diğer bir özelliği de kristalize olması ve krema şeklinde olmasıdır. Beyaz ile amber renginde olur. Boğazı yakmaz.</p>`,
    price: 2599.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_125815162.png`,
      `${BASE9}/Petek-Bal.png`,
    ],
    variations: [
      { name: '2kg', price: 2599.99, isDefault: true, sortOrder: 0 },
      { name: '3kg', price: 3899.99, sortOrder: 1 },
    ],
  })

  // ID 470 - Ateşoğlu Ardahan Süzme Çiçek Balı
  await createProduct({
    categoryId: catBal.id, name: 'Ateşoğlu Ardahan Süzme Çiçek Balı', slug: 'atesoglu-ardahan-suzme-cicek-bali',
    description: `<p><strong>Çiçek Balımızı diğer ballardan ayıran en büyük özellik 2.100 rakımlı yaylalarımızda bulunan 1.400'den fazla çiçek türüyle kaplı bitki florasıdır.</strong></p><p>Ardahan Balı tamamen organiktir ve Kafkas Arı ırkı tarafından üretilmektedir. Bitkilerin çiçeklerinde bulunan nektar bal kafkas arıları tarafından toplanır. Toplanan maddeler arı tarafından salgılanan ve sindirimde rol oynayan enzim ile bileşimi değiştirilerek petek gözlerinde depolanır ve arılar tarafından olgunlaştırılarak Ardahan balı oluşumu tamamlanır.</p>`,
    price: 1099.99, comparePrice: 1200,
    images: [
      `${BASE10}/gorsel_2025-11-01_125440137.png`,
      `${BASE10}/gorsel_2025-10-03_010117554.png`,
    ],
  })

  // ID 900 - Durmuşoğulları Üzüm Pekmezi
  await createProduct({
    categoryId: catBal.id, name: 'Durmuşoğulları Üzüm Pekmezi', slug: 'durmusogullari-uzum-pekmezi',
    price: 299.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_124547533.png`,
      `${BASE10}/WhatsApp-Image-2025-10-19-at-18.20.14.jpeg`,
    ],
  })

  // ═══════════════════════════════════════════════════════════
  //  DOĞAL ÜRÜNLER
  // ═══════════════════════════════════════════════════════════
  console.log('🌿 Doğal Ürünler...')

  // ID 144 - Cevizli Sucuk
  await createProduct({
    categoryId: catDogal.id, name: 'Cevizli Sucuk', slug: 'cevizli-sucuk',
    shortDescription: 'Cevizli sucuk veya orcik veya köme, genellikle doğu yörelerinde üzüm ya da dut şırası ve ceviz kullanılarak yapılan tatlıdır.',
    description: `<h2>Doğal ve Geleneksel Lezzet: Cevizli Sucuk</h2><p>Cevizli sucuk, geleneksel Türk mutfağından günümüze taşınmış doğal ve sağlıklı bir tatlı atıştırmalıktır. Üzüm pekmezi ve ceviz gibi tamamen doğal malzemelerle hazırlanan bu enfes lezzet, damaklarda eşsiz bir tat bırakır.</p><h2>Üzüm Pekmezinin Sağlıklı Dokunuşu</h2><p>Cevizli sucuk, üzüm pekmezi ile hazırlanan özel bir karışım sayesinde şekersiz bir tatlı alternatifi sunar.</p><h2>Cevizle Gelen Besleyicilik</h2><p>Cevizli sucukta kullanılan taze cevizler, zengin omega-3 yağ asitleri, antioksidanlar ve çeşitli vitaminlerle doludur.</p>`,
    price: 349.99, comparePrice: 379.99,
    images: [`${BASE9}/Cevizli-Sucuk.png`],
  })

  // ID 457 - Siyah Erik Kurusu
  await createProduct({
    categoryId: catDogal.id, name: 'Siyah Erik Kurusu', slug: 'siyah-erik-kurusu',
    description: `<p>Artvin, Yusufeli ilçesinde yetişen eriklerden doğal yöntemlerle kurutulup, katkı ve koruyucu madde eklenmeden doğal olarak tüketiciye sunulmuştur. Enerji ve doğal besin kaynağıdır.</p>`,
    price: 319.99, comparePrice: 350,
    images: [
      `${BASE10}/gorsel_2025-10-03_005306839.png`,
      `${BASE10}/gorsel_2025-10-03_005323294.png`,
    ],
  })

  // ID 460 - Kuru Kızılcık
  await createProduct({
    categoryId: catDogal.id, name: 'Kuru Kızılcık', slug: 'kuru-kizilcik',
    description: `<p>Ekşi vişne benzeri özelliklere sahip olan kızılcık genellikle komposto, jöle, reçel, turta ve çeşitli unlu mamüllerin yapımında kullanılmaktadır.</p><p>Genellikle Ağustos sonu ve Eylül aylarında ortaya çıkan kızılcık ekşi ve kırmızı rengiyle mutfaklarınızda her zaman bulundurmanız gereken meyveler arasında yer almaktadır.</p>`,
    price: 279.99, comparePrice: 300,
    images: [`${BASE10}/gorsel_2025-10-03_005410072.png`],
  })

  // ID 462 - Kuru Kayısı (Aşma)
  await createProduct({
    categoryId: catDogal.id, name: 'Kuru Kayısı (Aşma)', slug: 'kuru-kayisi-asma',
    description: `<p>Erzurum kayısı kurusu mevsiminde köylü eliyle açılarak güneşte kurutulmuştur.</p><p>Tamamen doğal olan Erzurum kayısı kurusu ekşimsi tadıyla hoşaflık olarak tüketilmektedir.</p><p>Doğal kayısı kurusu birer birer köylü eliyle açılıp güneşte kurutulmuş olması, herhangi bir kükürt, istim olmaması nedeniyle naturel ve serttir. Uzun zaman saklanması Erzurum kayısı kurusunun özelliğidir.</p>`,
    price: 299.99, comparePrice: 350,
    images: [`${BASE10}/gorsel_2025-10-03_005554759.png`],
  })

  // ID 464 - Kızılcık Ekşisi
  await createProduct({
    categoryId: catDogal.id, name: 'Kızılcık Ekşisi', slug: 'kizilcik-eksisi',
    description: `<p>Kızılcık ekşisi, bölgemizde kiren ekşisi olarak bilinir.</p><p><strong>Kızılcıkta bol miktarda c vitamini, flavanoid, karotinoid ve müthiş bir antioksidan olan melatonin bulunur.</strong></p><p>Kızılcık ekşisi, meyvenin suyu ile yapılır. Vücuda pek çok faydası olan kızılcıklar en olgun zamanında tek tek toplanır, ezilerek çıkarılan suyu kaynatılarak elde edilen kızılcık ekşisi marmelat olarak tüketilebildiği gibi, sulandırılarak surup olarak da içilir.</p>`,
    price: 599.99, comparePrice: 699.99,
    images: [`${BASE10}/gorsel_2025-10-03_005639367.png`],
  })

  // ID 466 - Iğdır Dut Kurusu
  await createProduct({
    categoryId: catDogal.id, name: 'Iğdır Dut Kurusu', slug: 'igdir-dut-kurusu',
    description: `<p>Yaz mevsiminde Erzurum'un İspir ilçesinde toplanan dutlar güneş altına serilerek kurutulur, bu kurutulma sonucu yaz kış tüketilebilen bir besin halini alır.</p><p><strong>Kuruyemiş gibi tüketilebilir (cevizle önerilir). Hoşafı yapılıp içilebilir. Uygun ortamda saklanırsa tazeliğini korur.</strong></p>`,
    price: 399.99, comparePrice: 450,
    images: [`${BASE10}/gorsel_2025-10-03_005735750.png`],
  })

  // ID 506 - Kars Kaz Eti
  await createProduct({
    categoryId: catDogal.id, name: 'Kars Kaz Eti', slug: 'kars-kaz-eti',
    shortDescription: 'Yeni yıl sofralarının vazgeçilmez trendlerinden biri de kaz yemeğidir.',
    description: `<p>İlkbahar mevsiminde meralarda otlatılarak büyütülen kazlar, Kars/Ardahan'da kar yağışlarının başlaması ile mevsimin ilk karı, kazlara yedirilir. Böylece kaz etinin daha lezzetli olması sağlanır. Daha sonra kesime alınan kazlar tuzlanıp kuru ayazda kurutulmaya bırakılır.</p><p>Kazlarımız 2.300 gram ve 3.000 gram arasında değişiklik göstermektedir.</p><p>Yeni yıl sofralarının vazgeçilmez trendlerinden biri de kaz yemeğidir. Kalabalık sofraların, özel günlerin vazgeçilmezi olan kaz eti, Ateşoğlusüt aracılığıyla bir sipariş kadar uzağınızda.</p>`,
    price: 3999.99,
    images: [
      `${BASE10}/WhatsApp-Gorsel-2025-11-17-saat-19.31.38_ea2d6ddb.jpg`,
      `${BASE10}/WhatsApp-Gorsel-2025-11-17-saat-19.31.39_dae173f9-1.jpg`,
    ],
  })

  // ID 825 - Çekirdeksiz Siyah Erik Kurusu
  await createProduct({
    categoryId: catDogal.id, name: 'Çekirdeksiz Siyah Erik Kurusu', slug: 'cekirdeksiz-siyah-erik-kurusu',
    description: `<p>Artvin, Yusufeli ilçesinde yetişen eriklerden doğal yöntemlerle kurutulup, katkı ve koruyucu madde eklenmeden doğal olarak tüketiciye sunulmuştur. Enerji ve doğal besin kaynağıdır.</p>`,
    price: 349.99, comparePrice: 370,
    images: [
      `${BASE10}/gorsel_2025-10-03_005306839.png`,
      `${BASE10}/gorsel_2025-10-03_005323294.png`,
    ],
  })

  // ID 902 - Sarı Erik
  await createProduct({
    categoryId: catDogal.id, name: 'Sarı Erik', slug: 'sari-erik',
    price: 319.99,
    images: [`${BASE10}/Sari-Erik-1.png`],
  })

  // ID 903 - Cevizli Dut Pestili
  await createProduct({
    categoryId: catDogal.id, name: 'Cevizli Dut Pestili', slug: 'cevizli-dut-pestili',
    price: 319.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_132727215.png`,
      `${BASE10}/Cevizli-Dut-Pestili.png`,
    ],
  })

  // ID 904 - Erik Ekşisi
  await createProduct({
    categoryId: catDogal.id, name: 'Erik Ekşisi', slug: 'erik-eksisi',
    price: 349.99,
    images: [`${BASE10}/erik-eksisi-1.png`],
  })

  // ID 905 - Sade Dut Pestili
  await createProduct({
    categoryId: catDogal.id, name: 'Sade Dut Pestili', slug: 'sade-dut-pestili',
    price: 299.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_123411096.png`,
      `${BASE10}/sade-dut-pestili.png`,
    ],
  })

  // ID 906 - Siyah Special İri Zeytin
  await createProduct({
    categoryId: catDogal.id, name: 'Siyah Special İri Zeytin', slug: 'siyah-special-iri-zeytin',
    price: 499.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_130831408.png`,
      `${BASE10}/Siyah-Special-Iri-Zeytin.png`,
    ],
  })

  // ID 907 - Üçel Helva
  await createProduct({
    categoryId: catDogal.id, name: 'Üçel Helva', slug: 'ucel-helva',
    price: 379.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_131913652.png`,
      `${BASE10}/DSC05893-scaled.jpg`,
    ],
  })

  // ID 908 - Kars Kavurması
  await createProduct({
    categoryId: catDogal.id, name: 'Kars Kavurması', slug: 'kars-kavurmasi',
    price: 1449.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_125248415.png`,
      `${BASE10}/DSC05880-scaled.jpg`,
    ],
  })

  // ID 909 - Sucuk
  await createProduct({
    categoryId: catDogal.id, name: 'Sucuk', slug: 'sucuk',
    price: 1250,
    images: [
      `${BASE10}/gorsel_2025-11-01_123523247.png`,
      `${BASE10}/DSC05908-scaled.jpg`,
    ],
  })

  // ID 910 - Evin Helva
  await createProduct({
    categoryId: catDogal.id, name: 'Evin Helva', slug: 'evin-helva',
    price: 299.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_123737620.png`,
      `${BASE10}/DSC05896-scaled.jpg`,
    ],
  })

  // ID 911 - Elma Kurusu
  await createProduct({
    categoryId: catDogal.id, name: 'Elma Kurusu', slug: 'elma-kurusu',
    price: 319.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_123159228.png`,
      `${BASE10}/elma-kurusu.png`,
    ],
  })

  // ID 912 - Adıyaman Akide Şekeri
  await createProduct({
    categoryId: catDogal.id, name: 'Adıyaman Akide Şekeri', slug: 'adiyaman-akide-sekeri',
    price: 129.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_131046636.png`,
      `${BASE10}/Akide-Sekeri.png`,
    ],
  })

  console.log('✅ Seed tamamlandı! 4 kategori, 43 ürün (3 varyasyonlu)')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
