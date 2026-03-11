/**
 * Güvenli ürün ekleme scripti
 * Mevcut siparişleri, kullanıcıları ve diğer verileri SİLMEZ.
 * Sadece ürünleri upsert (ekle/güncelle) yapar.
 *
 * Çalıştırmak için: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/add-products.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🛒 Ürün ekleme başlatılıyor...')

  // ─── Kategorileri bul veya oluştur ─────────────────────────
  const catPeynir = await prisma.category.upsert({
    where: { slug: 'peynirler' },
    update: {},
    create: { name: 'Peynirler', slug: 'peynirler', sortOrder: 1, isActive: true },
  })
  const catBal = await prisma.category.upsert({
    where: { slug: 'bal-pekmez' },
    update: {},
    create: { name: 'Bal & Pekmez', slug: 'bal-pekmez', sortOrder: 2, isActive: true },
  })
  const catTereyag = await prisma.category.upsert({
    where: { slug: 'tereyagi' },
    update: {},
    create: { name: 'Tereyağı', slug: 'tereyagi', sortOrder: 3, isActive: true },
  })
  const catDogal = await prisma.category.upsert({
    where: { slug: 'dogal-urunler' },
    update: {},
    create: { name: 'Doğal Ürünler', slug: 'dogal-urunler', sortOrder: 4, isActive: true },
  })

  type Variation = { name: string; price: number; comparePrice?: number; isDefault?: boolean; sortOrder?: number }
  type ProductInput = {
    categoryId: string; name: string; slug: string
    shortDescription?: string; description?: string
    price: number; comparePrice?: number; stock?: number; weight?: number
    isFeatured?: boolean; images: string[]; variations?: Variation[]
  }

  async function upsertProduct(data: ProductInput) {
    const hasVariations = !!(data.variations && data.variations.length > 0)

    // Ürün var mı kontrol et
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } })

    if (existing) {
      console.log(`⏭  Zaten var: ${data.name}`)
      return existing
    }

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

    if (data.images.length) {
      await prisma.productImage.createMany({
        data: data.images.map((url, i) => ({
          productId: product.id, imagePath: url, isPrimary: i === 0, sortOrder: i,
        })),
      })
    }

    if (hasVariations && data.variations) {
      await prisma.productVariation.createMany({
        data: data.variations.map((v) => ({
          productId: product.id, name: v.name, price: v.price,
          comparePrice: v.comparePrice, stock: 199,
          isDefault: v.isDefault ?? false, sortOrder: v.sortOrder ?? 0,
        })),
      })
    }

    console.log(`✅ Eklendi: ${data.name}`)
    return product
  }

  // ═══════════════════════════════════════════════════════════
  //  PEYNİRLER
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧀 Peynirler...')

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Göbek Kaşar', slug: 'gobek-kasar',
    shortDescription: 'Tam yağlı inek sütünden üretilmiş, yuvarlak formu ve yumuşak iç dokusuyla özel kaşar peyniri.',
    description: `<h2>Doğallık ve Lezzetin Buluştuğu Göbek Kaşarı</h2><p>Göbek kaşarı, peynir severlerin ilk tercihi olmaya aday, tam yağlı inek sütünden üretilmiş özel bir kaşar peyniridir. Yuvarlak şekli ve daha yumuşak iç dokusuyla, klasik kaşar peynirlerinden ayrılan bu ürün, farkını hemen hissettirir.</p><h2>Göbek Kaşarın Kullanım Kolaylığı</h2><p>Bu özel peynir, yuvarlak formu sayesinde dilimlemek ve istenilen ölçüde kullanmak oldukça kolaydır. Göbek kaşarı, tostlardan pizzalara, makarnalardan salatalara kadar geniş bir yelpazede kullanılabilir.</p><h2>Ustalıkla Hazırlanmış Bir Peynir</h2><p>Göbek kaşarı, üretim sürecinde özel yöntemlerle olgunlaştırılmış ve inek sütü ile mükemmel bir uyum yakalamıştır. Uzman üreticilerin ellerinden çıkan Göbek kaşarı, doğal lezzeti ve besleyici özellikleri ile peynir tutkunları için vazgeçilmez bir seçenektir.</p>`,
    price: 419.99, comparePrice: 439.99, weight: 1.5, isFeatured: true,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/09/gorsel_2025-11-01_125346790.png', 'https://sablonmarketi.com/wp-content/uploads/2025/09/Gobek-Kasar-1.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Yağlı Çeçil', slug: 'yagli-cecil',
    shortDescription: 'Yağlı çeçil peyniri, geleneksel yöntemlerle üretilen, damak tadınıza uygun eşsiz bir peynir çeşididir.',
    description: `<p>En çok tüketilen peynir türlerinden biridir. Klasik yöntem olan suda haşlanarak yapılır. Görünümü iplik şeklindedir ve rengi kaşar peynirine benzer.</p><p>Tam yağlı, yumuşak ve tuzlu bir peynirdir. El ile çekildiğinde kolaylıkla liflerine ayrılır. Doğanın sütlü, narin ve doygun lezzetli özel tarifidir.</p>`,
    price: 450, comparePrice: 499.99, weight: 1,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/09/gorsel_2025-11-01_124737410.png', 'https://sablonmarketi.com/wp-content/uploads/2025/09/gorsel_2025-10-03_010533624.png', 'https://sablonmarketi.com/wp-content/uploads/2025/09/Yagli-Cecil.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Obruk Peyniri', slug: 'obruk-peyniri',
    shortDescription: 'Geleneksel yöntemlerle hazırlanan, kendine özgü aromasıyla Obruk peyniri.',
    price: 699.99, weight: 1,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/09/Obruk-Peyniri.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Ardahan Damal Çökeleği', slug: 'ardahan-damal-cokele-i',
    shortDescription: 'Doğal yöntemlerle üretilen Ardahan yaylalarından çökelek.',
    description: `<p>Doğal yöntemlerle üretilen Damal çökeleği, Ardahan'ın yüksek rakımlı yaylalarında beslenen hayvanların sütünden elde edilir. Yoğurdun süzülmesiyle hazırlanan bu yöresel lezzet, yoğun kıvamı ve hafif ekşimsi tadıyla kahvaltılarda, börek içlerinde ve salatalarda sıkça tercih edilir. Katkısız, besleyici ve tamamen yerel üretimdir.</p>`,
    price: 449.99, comparePrice: 599.99, weight: 1,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/09/gorsel_2025-11-01_124424473.png', 'https://sablonmarketi.com/wp-content/uploads/2025/09/Cokelek.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Çörek Otlu Peynir', slug: 'corek-otlu-peynir',
    shortDescription: 'Çörek otunun aromatik lezzetiyle zenginleştirilmiş, doğal ve taze peynir.',
    description: `<h2>Doğallık ve Tazelik Bir Arada</h2><p>Çörek otlu peynir, eşsiz aromasıyla sofralarınıza doğal bir lezzet getiriyor. Tamamen taze, doğal malzemelerle üretilen bu peynir, özellikle kahvaltılarınıza ayrı bir tat katmak için ideal.</p><h2>Lezzet ve Aroma Dengesi</h2><p>Çörek otunun kendine has yoğun aromasıyla peynirin yumuşak ve zengin dokusu mükemmel bir uyumla birleşiyor.</p>`,
    price: 199.99, weight: 0.5,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/09/Corek-otlu-peynir.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Erzincan Tulum Peyniri', slug: 'erzincan-tulum-peyniri',
    shortDescription: 'Munzur Yaylalarının "Akkaraman" koyunlarından, şirden mayasıyla geleneksel yöntemlerle üretilen %100 doğal tulum peyniri.',
    description: `<p>Kekik kokulu Munzur Yaylalarının doğal ortamında beslenen "Akkaraman" ırkı koyunların organik sütü, şirden mayası ve tuz dışında hiçbir madde kullanılmadan geleneksel yöntemlerle, <strong>modern tesisimizde üretilmektedir. %100 doğal, sağlıklı ve lezzetlidir.</strong></p>`,
    price: 749.99, comparePrice: 799.99, weight: 1, isFeatured: true,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_124233356.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/DSC05911-scaled.jpg'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Ateşoğlu Kaşar (1.8Kg)', slug: 'atesoglu-kasar-1-8kg',
    shortDescription: 'Ardahan Göle yaylalarından elde edilen sütlerden, modern fabrikada olgunlaştırılmış tam yağlı taze kaşar.',
    description: `<p>Ardahan ili Göle ilçesinde yaz mevsiminde ve mera hayvancılığının yapıldığı bölgede doğal şekilde elde edilen sütlerin, son teknoloji ile üretim yapmakta olan fabrikamızda peynire dönüşmekte ve olgunlaştırmaya bırakılmaktadır.</p><p><strong>TAM YAĞLI bir üründür.</strong></p><p>1997'den bugüne doğal süt ürünlerinde Türkiye'nin aranan markası olan Ateşoğlu Taze Kaşar ürününü incelemektesiniz.</p>`,
    price: 779.99, comparePrice: 839.99, weight: 1.8,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_125106630.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/DSC05811-scaled.jpg'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Ateşoğlu Eski Kaşar', slug: 'atesoglu-eski-kasar',
    shortDescription: 'Ardahan Göle yaylalarından elde edilen sütlerden, uzun süre olgunlaştırılmış eski kaşar.',
    description: `<p>Ardahan ili Göle ilçesinde yaz mevsiminde mera hayvancılığının yapıldığı bölgede doğal şekilde elde edilen sütlerin, son teknoloji ile fabrikamızda peynire dönüşmekte ve olgunlaştırmaya bırakılmaktadır.</p><p><strong>TAM YAĞLI bir üründür.</strong></p>`,
    price: 449, comparePrice: 490, weight: 1,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_131002491.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_011946085.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Ateşoğlu Eski Kaşar (12.5-13Kg)', slug: 'atesoglu-eski-kasar-buyuk',
    shortDescription: 'Toplu alım için ideal, 12.5-13Kg büyük boy Ateşoğlu Eski Kaşar.',
    price: 5699.99, comparePrice: 5850, weight: 13,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_130204796.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/DSC05851-scaled.jpg'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Kars Köy Peyniri Az Tuzlu Tam Yağlı', slug: 'kars-koy-peyniri',
    shortDescription: 'Kars\'ta 1768m rakımda yayla ineklerinin sütünden, şirden mayalı, 3-4 ay salamurada dinlendirilmiş köy peyniri.',
    description: `<p>Kars peyniri içinde en sade lezzete sahip olan peynirdir. Çiğ sütün peynir mayası katılarak yapılan bu peynir süt mayalandıktan sonra küçük kalıplara ayrılır. 3-4 ay tuzlu suda bekletilerek daha sağlıklı bir hale getirilir.</p><ul><li><strong>Taze peynir olduğu için tuzlu değil. Peynir erimesin diye tuzlu su ile salamura yapılıyor.</strong></li><li><strong>Tam yağlı köy peynirimiz daha doğal, daha sağlıklı, daha hijyenik ve taptaze.</strong></li></ul>`,
    price: 399.99, comparePrice: 439.99, weight: 1,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_131446635.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012036718.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Konya Tulum Peyniri', slug: 'konya-tulum-peyniri',
    shortDescription: 'Konya\'nın eşsiz yaylalarından inek sütüyle, geleneksel yöntemlerle doğal ortamda olgunlaştırılan tulum peyniri.',
    description: `<p><strong>Konya Tulum Peyniri – Doğallığın ve Lezzetin Buluştuğu Nokta</strong></p><p>Konya'nın eşsiz yaylalarından gelen inek sütü ile hazırlanan Konya Tulum Peyniri, kendine has yoğun aroması ve kıvamıyla sofralarınıza gerçek bir lezzet şöleni sunar.</p><ul><li><strong>Doğal ve katkısız:</strong> Hiçbir koruyucu veya yapay aroma içermez.</li><li><strong>Zengin lezzet:</strong> Tulumda uzun süre olgunlaşarak yoğun ve karakteristik bir aroma kazanır.</li><li><strong>Çok yönlü kullanım:</strong> Kahvaltılardan mezeye, böreklerden salatalara kadar her tarifte harika bir tat.</li></ul>`,
    price: 299.99, comparePrice: 349.99, weight: 1,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_131253443.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012141891.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Blok Kaşar', slug: 'blok-kasar',
    shortDescription: 'Taze inek sütünden, haşlanıp soğuk depoda 2-3 ay dinlendirilerek üretilen, katkısız blok kaşar.',
    description: `<p>Taze inek sütü filtrelendikten sonra belirli sıcaklıklara kadar ısıtılır ve sonrasında mayalanır. Daha sonra bir iki gün acı suyunu atması için dinlendirilir. Acı suyunu attıktan sonra haşlanır ve yuvarlak kalıplara doldurulur, soğuk hava depolarında iki üç ay bekletilir ve tüketime hazır hale gelir.</p><p><strong>Bu işlemlerin tamamı hijyenik ortamlarda yapılır. Ve hiçbir katkı maddesi kullanılmaz.</strong></p>`,
    price: 419.99, comparePrice: 450, weight: 1,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_130131055.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012234860.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Trakya Tam Yağlı Beyaz Peynir', slug: 'trakya-beyaz-peynir',
    shortDescription: 'Trakya\'nın en bilinen inek sütü peyniri; minimum 6 ay tenekede olgunlaştırılmış, sert ve parlak yapılı.',
    description: `<p>Trakya'nın en iyi bilinen peyniridir. İnek sütünden üretilir ve kendine has bir tada sahiptir. <strong>Sert ve parlak bir yapısı vardır.</strong></p><p>Minimum 6 ay soğuk odalarda olgunlaştırılır. Olgunlaştırılma işlemi tenekelerde gerçekleşmektedir. <strong>Doğanın sütlü, vazgeçilmez klasik tarifidir.</strong></p>`,
    price: 429.99, comparePrice: 500, weight: 0.75,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123919344.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012356868.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Kars Gravyer Peyniri', slug: 'kars-gravyer-peyniri',
    shortDescription: '"Peynirlerin Kralı" Kars Gravyeri; İsviçre usulü, yağlı sütten 8-9 ay olgunlaştırılmış.',
    description: `<p>Peynirlerin kralı olarak da bilinen Gravyer Peyniri 1800'lü yıllarda İsviçrelilerin Kafkasya Bölgesine geldiklerinde Zavot adı verilen sığır türünün sütünden yapmış oldukları bir peynir çeşididir.</p><p>Kars gravyer peyniri Emmental Peyniri ile Gruyere Peyniri tadları arası bir tada sahiptir. <strong>Kars gravyeri yağlı sütten yapılmaktadır, dolayısı ile besin değeri yüksek bir peynirdir.</strong></p><p>Gravyer peyniri imalatından 8-9 ay sonra tüketilebilir. Şarap mezesi olarak tüketilmek istenirse en az 12 ay beklemiş olması gerekmektedir. Raf ömrü ise toplam 36 aydır.</p>`,
    price: 999.99, comparePrice: 1099.99, weight: 1, isFeatured: true,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123617869.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/Gravyer-kucuk.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Kars Göğermiş Çeçil Peyniri', slug: 'kars-gogermis-cecil-peyniri',
    shortDescription: 'Soğuk havada 7 ay olgunlaşan Kars küflü peyniri; doğal probiyotik, bağışıklık güçlendirici.',
    description: `<p>Taze civil peyniri tuzlandıktan sonra bir gün acı suyunu atması için dinlendirilir. Daha sonra lor peyniri ile karıştırılarak tahta kaplara doldurulur ve soğuk hava depolarında yedi ay kadar bekletildikten sonra tüketime hazır hale gelir.</p><p><strong>Bu işlemlerin tamamı hijyenik ortamlarda yapılır. Ve hiçbir katkı maddesi kullanılmaz.</strong></p><p>Kars Göğermiş Peyniri, peynir yapısındaki küften dolayı vücutta penisilinin üstlendiği işlevi yerine getirmektedir. <strong>Mineral bakımından zengin olan Kars küflü peyniri özellikle içeriğinde bulunan kalsiyum sebebiyle kemik ve diş sağlığını korumada oldukça etkindir.</strong></p>`,
    price: 374.99, comparePrice: 420, weight: 1,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_130712928.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012711167.png'],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Kars Taze Çeçil Peyniri', slug: 'kars-taze-cecil-peyniri',
    shortDescription: 'Haşlanıp el ile tel tel çekilerek örülen, salamurada katkısız taze çeçil peyniri.',
    description: `<p>Taze inek sütü filtrelendikten sonra belirli sıcaklıklara kadar ısıtılır ve sonrasında mayalanır. Acı suyunu attıktan sonra haşlanır ve el ile çekilerek tel tel olması sağlanır. Sonrasında örülür ve tuzlanarak salamura edilir.</p><p><strong>Bu işlemlerin tamamı hijyenik ortamlarda yapılır. Ve hiçbir katkı maddesi kullanılmaz.</strong></p>`,
    price: 349.99, comparePrice: 400, weight: 1,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_012818656.png'],
  })

  // ═══════════════════════════════════════════════════════════
  //  BAL & PEKMEZ
  // ═══════════════════════════════════════════════════════════
  console.log('\n🍯 Bal & Pekmez...')

  await upsertProduct({
    categoryId: catBal.id, name: 'Ardahan Petek Çiçek Balı', slug: 'ardahan-petek-cicek-bali',
    shortDescription: 'Kafkas arılarının Kars/Ardahan\'ın bin bir çiçeğinden ürettiği, petek halinde doğal çiçek balı.',
    description: `<p>Kars/Ardahan balı, Kars'ın kendi coğrafyasına has bin bir çeşit bitki çiçeklerinin özütünden Kafkas arılarının yaptığı bir baldır.</p><p>Bu arının temel özelliği dil uzunluğudur. Dili 7.2 mm olan Kafkas arısı, diğer arılardan 3mm daha fazla olan dili sayesinde derin tüplü çiçeklerin nektarlarından da faydalandığından Kars balına eşsiz lezzetini vermektedir.</p><p>Kars balının diğer bir özelliği de kristalize olması ve krema şeklinde olmasıdır. Beyaz ile amber renginde olur. Boğazı yakmaz.</p>`,
    price: 1199.99, weight: 2, isFeatured: true,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/09/gorsel_2025-11-01_125545760.png', 'https://sablonmarketi.com/wp-content/uploads/2025/09/Petek-Bal.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005955598.png'],
    variations: [
      { name: '2Kg', price: 1199.99, isDefault: true, sortOrder: 0 },
      { name: '3Kg', price: 1799.99, sortOrder: 1 },
      { name: '4Kg', price: 2399.99, sortOrder: 2 },
    ],
  })

  await upsertProduct({
    categoryId: catBal.id, name: 'Karakovan Balı', slug: 'karakovan-bali',
    shortDescription: 'Kafkas arılarının doğal kovanlarında ürettiği, kristalize amber renkli Ardahan/Kars karakovan balı.',
    description: `<p><strong>Kars/Ardahan balı, Kars'ın kendi coğrafyasına has bin bir çeşit bitki çiçeklerinin özütünden Kafkas arılarının yaptığı bir baldır.</strong></p><p>Kafkas ırkı arı sadece Kars yöresinde bulunur ve Kars balına lezzetini Kafkas arısı verir. Kars balının diğer bir özelliği de kristalize olması ve krema şeklinde olmasıdır. Beyaz ile amber renginde olur. Boğazı yakmaz.</p>`,
    price: 2599.99, weight: 2, isFeatured: true,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_125815162.png', 'https://sablonmarketi.com/wp-content/uploads/2025/09/Petek-Bal.png'],
    variations: [
      { name: '2kg', price: 2599.99, isDefault: true, sortOrder: 0 },
      { name: '3kg', price: 3899.99, sortOrder: 1 },
    ],
  })

  await upsertProduct({
    categoryId: catBal.id, name: 'Ateşoğlu Ardahan Süzme Çiçek Balı', slug: 'atesoglu-ardahan-suzme-cicek-bali',
    shortDescription: '2100 rakımlı yaylalarda 1400+ çiçek türüyle Kafkas arılarının ürettiği organik süzme çiçek balı.',
    description: `<p><strong>Çiçek Balımızı diğer ballardan ayıran en büyük özellik 2.100 rakımlı yaylalarımızda bulunan 1.400'den fazla çiçek türüyle kaplı bitki florasıdır.</strong></p><p>Ardahan Balı tamamen organiktir ve Kafkas Arı ırkı tarafından üretilmektedir. Bitkilerin çiçeklerinde bulunan nektar kafkas arıları tarafından toplanır ve petek gözlerinde depolanarak olgunlaştırılır.</p>`,
    price: 1099.99, comparePrice: 1200, weight: 3.5,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_125440137.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_010117554.png'],
  })

  await upsertProduct({
    categoryId: catBal.id, name: 'İspir Dut Pekmezi (1.4Kg)', slug: 'ispir-dut-pekmezi',
    shortDescription: 'Taze ağaç dutundan hiçbir katkı maddesi eklenmeden, odun ateşinde kaynatılıp güneşte kıvama getirilen gerçek dut pekmezi.',
    description: `<p>Taze olarak ağaçtan toplanan dutlar ayıklandıktan sonra genişçe bir kazana boşaltılır. Hiç bir ilave yapılmadan kazan odun ateşi üzerine bırakılır. Tamamen kendi suyuyla kaynayan dutun suyu alınır.</p><p>Elde edilen dut suyu iyice süzülerek yeniden farklı bir kazanda odun ateşinde kaynatılmaya başlanır. Son olarak büyük tavalarda üç dört gün boyunca güneşte bekletilerek kıvamını alması sağlanır. <strong>Bu işlemler esnasında hiçbir şekilde şeker ilavesi yapılmaz.</strong></p>`,
    price: 429.99, comparePrice: 470, weight: 1.4,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/09/gorsel_2025-11-01_125955510.png', 'https://sablonmarketi.com/wp-content/uploads/2025/09/Dut-Pekmezi-1.png'],
  })

  await upsertProduct({
    categoryId: catBal.id, name: 'Erzurum Ballı Keçi Boynuzu Özü Pekmezi', slug: 'keciboynuzu-pekmezi',
    shortDescription: 'Şifa kaynağı, C vitamini ve antioksidan deposu keçiboynuzu pekmezi (harnup pekmezi).',
    description: `<h2>Keçi Boynuzunun Doğal ve Besleyici Özellikleri</h2><p>Keçi boynuzu, doğanın bize sunduğu mucizevi bir lezzettir. Besleyici yapısıyla hem sağlığınızı destekler hem de damak zevkiniz için mükemmel bir seçenek oluşturur. Zengin vitamin ve mineral içeriği sayesinde günlük enerji ihtiyacınızı karşılamaya yardımcı olur.</p><h2>Sağlıklı Atıştırmalıklar İçin Mükemmel Bir Alternatif</h2><p>Doğal şekeri sayesinde tatlı krizlerinizi kontrol altına alabilirsiniz. Gluten içermediğinden, gluten hassasiyeti olan bireyler için de mükemmel bir seçenektir.</p>`,
    price: 349.99, comparePrice: 400, weight: 0.8,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/09/gorsel_2025-11-01_124035897.png', 'https://sablonmarketi.com/wp-content/uploads/2025/09/Keci-boynuzu.png'],
  })

  await upsertProduct({
    categoryId: catBal.id, name: 'Durmuşoğulları Üzüm Pekmezi', slug: 'uzum-pekmezi',
    shortDescription: 'Geleneksel yöntemlerle üretilen, doğal üzüm pekmezi.',
    price: 299.99, weight: 0.8,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_124547533.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-19-at-18.20.14.jpeg'],
  })

  // ═══════════════════════════════════════════════════════════
  //  TEREYAĞI
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧈 Tereyağı...')

  await upsertProduct({
    categoryId: catTereyag.id, name: 'Ardahan Tereyağı', slug: 'ardahan-tereyagi',
    shortDescription: 'Nisan-Mayıs kır çiçeklerinin bol olduğu dönemde, Ardahan yaylalarının doğal sütünden yapılan, katkısız organik tereyağı.',
    description: `<p>Kars tereyağı doğal kaynaklar ile tamamen organik şekilde üretilmektedir.</p><p>Genel olarak en kaliteli ve verimli tereyağı nisan ve mayıs ayları gibi yapılmaktadır. Bu dönemde kır çiçekleri daha fazladır ve bu çiçeklerle beslenen ineklerin sütlerinden elde edilen tereyağı daha sarı renkte olmaktadır.</p><p><strong>İçerisine hiçbir katkı maddesi ilave edilmeyen Ardahan tereyağı sağlık koşullarına uygun ortamlarda üretilmektedir.</strong></p>`,
    price: 574.99, isFeatured: true,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/09/gorsel_2025-11-01_125004971.png', 'https://sablonmarketi.com/wp-content/uploads/2025/09/tereyag.png'],
    variations: [
      { name: '1Kg',  price: 574.99,                isDefault: true, sortOrder: 0 },
      { name: '2Kg',  price: 1149.99,               sortOrder: 1 },
      { name: '5Kg',  price: 2800,  comparePrice: 2900,  sortOrder: 2 },
      { name: '10Kg', price: 5750,  comparePrice: 6000,  sortOrder: 3 },
      { name: '20Kg', price: 11500, comparePrice: 11750, sortOrder: 4 },
    ],
  })

  await upsertProduct({
    categoryId: catTereyag.id, name: 'Eritilmiş Ardahan Tereyağı', slug: 'eritilmis-ardahan-tereyagi',
    shortDescription: 'Tereyağından su ve yağsız maddeler uzaklaştırılarak elde edilen %99 saf süt yağı; 200-240°C dayanıklı.',
    description: `<p>Sade yağ tuzsuz tereyağından, su ve yağsız kuru maddeler uzaklaştırılarak elde ediliyor. Sonunda ise %99 oranında süt yağı barındıran sade yağ ortaya çıkıyor. 1 kg'lık tereyağından ortalama 900 gram sade yağ çıkıyor.</p><p>Tereyağı bir tencereye alınıp kısık ateşte eritilir. Köpükler alınır ve yağ sık dokulu bezden geçirilir. Donması beklenir.</p><p><strong>200-240 derece sıcağa kadar dayanıklıdır. Buzdolabında 1 yıl durabilecek kadar dayanıklıdır.</strong></p>`,
    price: 649.99, comparePrice: 699.99, weight: 1,
    images: ['https://sablonmarketi.com/wp-content/uploads/2025/09/gorsel_2025-11-01_124814503.png', 'https://sablonmarketi.com/wp-content/uploads/2025/09/Erilitmis-Tereyag.png', 'https://sablonmarketi.com/wp-content/uploads/2025/09/gorsel_2025-10-03_011037161.png'],
  })

  // ═══════════════════════════════════════════════════════════
  //  DOĞAL ÜRÜNLER
  // ═══════════════════════════════════════════════════════════
  console.log('\n🌿 Doğal Ürünler...')

  await upsertProduct({ categoryId: catDogal.id, name: 'Cevizli Sucuk', slug: 'cevizli-sucuk', shortDescription: 'Üzüm pekmezi ve cevizle geleneksel yöntemlerle hazırlanan, katkısız doğal tatlı.', price: 349.99, comparePrice: 379.99, weight: 0.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/09/Cevizli-Sucuk.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Siyah Erik Kurusu', slug: 'siyah-erik-kurusu', shortDescription: 'Artvin Yusufeli\'nde yetişen eriklerden doğal yöntemlerle kurutulmuş, katkısız enerji ve besin kaynağı.', description: `<p>Artvin, Yusufeli ilçesinde yetişen eriklerden doğal yöntemlerle kurutulup, katkı ve koruyucu madde eklenmeden doğal olarak tüketiciye sunulmuştur. Enerji ve doğal besin kaynağıdır.</p>`, price: 319.99, comparePrice: 350, weight: 0.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005306839.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005323294.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Çekirdeksiz Siyah Erik Kurusu', slug: 'cekirdeksiz-siyah-erik-kurusu', shortDescription: 'Artvin Yusufeli eriklerinden doğal kurutulmuş, çekirdeksiz, katkısız besin kaynağı.', description: `<p>Artvin, Yusufeli ilçesinde yetişen eriklerden doğal yöntemlerle kurutulup, katkı ve koruyucu madde eklenmeden doğal olarak tüketiciye sunulmuştur. Enerji ve doğal besin kaynağıdır.</p>`, price: 349.99, comparePrice: 370, weight: 0.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005306839.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005323294.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Kuru Kızılcık', slug: 'kuru-kizilcik', shortDescription: 'Ağustos-Eylül\'de olgun toplanıp kurutulan, C vitamini ve melatonin deposu kızılcık.', description: `<p>Ekşi vişne benzeri özelliklere sahip olan kızılcık genellikle komposto, jöle, reçel ve turta yapımında kullanılmaktadır. Kızılcıkta bol miktarda C vitamini, flavanoid, karotinoid ve müthiş bir antioksidan olan melatonin bulunur.</p>`, price: 279.99, comparePrice: 300, weight: 0.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005410072.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Kuru Kayısı (Aşma)', slug: 'kuru-kayisi-asma', shortDescription: 'Erzurum kayısısı, köylü eliyle açılıp güneşte kurutulmuş; kükürt-istim yok, naturel ve serttir.', description: `<p>Erzurum kayısı kurusu mevsiminde köylü eliyle açılarak güneşte kurutulmuştur. Tamamen doğal olan Erzurum kayısı kurusu ekşimsi tadıyla hoşaflık olarak tüketilmektedir.</p><p>Doğal kayısı kurusu birer birer köylü eliyle açılıp güneşte kurutulmuş olması, herhangi bir kükürt, istim olmaması nedeniyle naturel ve serttir.</p>`, price: 299.99, comparePrice: 350, weight: 0.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005554759.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Kızılcık Ekşisi', slug: 'kizilcik-eksisi', shortDescription: 'Bölgede "kiren ekşisi" olarak bilinen; olgun kızılcığın suyundan kaynatılarak hazırlanan doğal ekşi/şurup.', description: `<p>Kızılcık ekşisi, bölgemizde kiren ekşisi olarak bilinir. <strong>Kızılcıkta bol miktarda C vitamini, flavanoid, karotinoid ve müthiş bir antioksidan olan melatonin bulunur.</strong></p>`, price: 599.99, comparePrice: 699.99, weight: 0.7, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005639367.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Iğdır Dut Kurusu', slug: 'igdir-dut-kurusu', shortDescription: 'İspir dutları güneşte serilerek kurutulan, kuruyemiş gibi ya da hoşaflık olarak tüketilebilir dut kurusu.', description: `<p>Yaz mevsiminde Erzurum'un İspir ilçesinde toplanan dutlar güneş altına serilerek kurutulur. <strong>Kuruyemiş gibi tüketilebilir (cevizle önerilir). Hoşafı yapılıp içilebilir.</strong></p>`, price: 399.99, comparePrice: 450, weight: 0.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-10-03_005735750.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Kars Kaz Eti', slug: 'kars-kaz-eti', shortDescription: 'Merada büyütülüp ilk karla tuzlanarak kuru ayazda kurutulan Kars kazı; yeni yıl sofralarının vazgeçilmezi.', description: `<p>İlkbahar mevsiminde meralarda otlatılarak büyütülen kazlar, Kars/Ardahan'da kar yağışlarının başlamasıyla tuzlanıp kuru ayazda kurutulmaya bırakılır. Kazlarımız 2.300 gram ve 3.000 gram arasında değişiklik göstermektedir.</p><p>Yeni yıl sofralarının vazgeçilmez trendlerinden biri de kaz yemeğidir. Kalabalık sofraların, özel günlerin vazgeçilmezi olan kaz eti, Ateşoğlusüt aracılığıyla bir sipariş kadar uzağınızda.</p>`, price: 3999.99, weight: 2.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/WhatsApp-Gorsel-2025-11-17-saat-19.31.38_ea2d6ddb.jpg', 'https://sablonmarketi.com/wp-content/uploads/2025/10/WhatsApp-Gorsel-2025-11-17-saat-19.31.39_dae173f9-1.jpg'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Sarı Erik', slug: 'sari-erik', shortDescription: 'Doğal yetiştirilmiş sarı erik.', price: 319.99, weight: 0.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/Sari-Erik-1.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Cevizli Dut Pestili', slug: 'cevizli-dut-pestili', shortDescription: 'Dut şırasına ceviz batırılarak hazırlanan geleneksel pestil.', price: 319.99, weight: 0.3, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_132727215.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/Cevizli-Dut-Pestili.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Erik Ekşisi', slug: 'erik-eksisi', shortDescription: 'Doğal yöntemlerle hazırlanan geleneksel erik ekşisi.', price: 349.99, weight: 0.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/erik-eksisi-1.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Sade Dut Pestili', slug: 'sade-dut-pestili', shortDescription: 'Geleneksel yöntemlerle hazırlanan sade dut pestili.', price: 299.99, weight: 0.3, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123411096.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/sade-dut-pestili.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Siyah Special İri Zeytin', slug: 'siyah-special-iri-zeytin', shortDescription: 'Seçme iri taneli, doğal siyah zeytin.', price: 499.99, weight: 1, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_130831408.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/Siyah-Special-Iri-Zeytin.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Üçel Helva', slug: 'ucel-helva', shortDescription: 'Geleneksel yöntemlerle hazırlanan doğal Üçel helvası.', price: 379.99, weight: 0.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_131913652.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/DSC05893-scaled.jpg'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Kars Kavurması', slug: 'kars-kavurmasi', shortDescription: 'Geleneksel Kars mutfağından, doğal yöntemlerle hazırlanan et kavurması.', price: 1449.99, weight: 1, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_125248415.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/DSC05880-scaled.jpg'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Sucuk', slug: 'sucuk', shortDescription: 'Kars yöresine özgü baharatlarla hazırlanan doğal sucuk.', price: 1250, weight: 0.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123523247.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/DSC05908-scaled.jpg'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Evin Helva', slug: 'evin-helva', shortDescription: 'Ev yapımı tahin helvası.', price: 299.99, weight: 0.5, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123737620.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/DSC05896-scaled.jpg'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Elma Kurusu', slug: 'elma-kurusu', shortDescription: 'Doğal yöntemlerle güneşte kurutulmuş elma dilimleri.', price: 319.99, weight: 0.25, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_123159228.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/elma-kurusu.png'] })
  await upsertProduct({ categoryId: catDogal.id, name: 'Adıyaman Akide Şekeri', slug: 'adiyaman-akide-sekeri', shortDescription: 'Geleneksel yöntemlerle hazırlanan Adıyaman akide şekeri.', price: 129.99, weight: 0.25, images: ['https://sablonmarketi.com/wp-content/uploads/2025/10/gorsel_2025-11-01_131046636.png', 'https://sablonmarketi.com/wp-content/uploads/2025/10/Akide-Sekeri.png'] })

  console.log('\n✅ Tamamlandı! Mevcut ürünler atlandı, eksik olanlar eklendi.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
