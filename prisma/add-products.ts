/**
 * Güvenli ürün ekleme scripti
 * Mevcut siparişleri, kullanıcıları ve diğer verileri SİLMEZ.
 * Sadece ürünleri upsert (ekle/güncelle) yapar.
 *
 * Çalıştırmak için: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/add-products.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BASE9  = 'https://sablonmarketi.com/wp-content/uploads/2025/09'
const BASE10 = 'https://sablonmarketi.com/wp-content/uploads/2025/10'

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
    isFeatured?: boolean; isActive?: boolean; images: string[]; variations?: Variation[]
  }

  async function upsertProduct(data: ProductInput) {
    const hasVariations = !!(data.variations && data.variations.length > 0)
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
        weight: data.weight, hasVariations,
        isFeatured: data.isFeatured ?? false,
        isActive: data.isActive ?? true,
        lowStockThreshold: 5,
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
        data: data.variations.map((v, i) => ({
          productId: product.id, name: v.name, price: v.price,
          comparePrice: v.comparePrice, stock: 199,
          isDefault: v.isDefault ?? i === 0, sortOrder: v.sortOrder ?? i,
        })),
      })
    }

    console.log(`✅ Eklendi: ${data.name}`)
    return product
  }

  // ═══════════════════════════════════════════════════════════
  //  TEREYAĞI
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧈 Tereyağı...')

  await upsertProduct({
    categoryId: catTereyag.id, name: 'Ardahan Tereyağı', slug: 'ardahan-tereyagi',
    description: `<p>Kars tereyağı doğal kaynaklar ile tamamen organik şekilde üretilmektedir.</p><p>Ardahan/Kars bölgesinde hayvanlar meralara bırakılarak doğal yollar ile beslendiklerinden sütlerinin kalitesi yüksek olmaktadır. <strong>İçerisine hiçbir katkı maddesi ilave edilmeyen Ardahan tereyağı sağlık koşullarına uygun ortamlarda üretilmektedir.</strong></p>`,
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

  await upsertProduct({
    categoryId: catTereyag.id, name: 'Eritilmiş Ardahan Tereyağı', slug: 'eritilmis-ardahan-tereyagi',
    shortDescription: 'Eritilmiş tereyağı, doğal ve katkısız yapısı ile yemeklerinize ve tatlılarınıza eşsiz bir lezzet katar.',
    description: `<p>Sade yağ tuzsuz tereyağından, su ve yağsız kuru maddeler uzaklaştırılarak elde ediliyor. 1 kg'lık tereyağından ortalama 900 gram sade yağ çıkıyor.</p><p><strong>200-240 derece sıcağa kadar dayanıklıdır. Buzdolabında 1 yıl durabilecek kadar dayanıklıdır.</strong></p>`,
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
  console.log('\n🧀 Peynirler...')

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Göbek Kaşar', slug: 'gobek-kasar',
    description: `<h2>Doğallık ve Lezzetin Buluştuğu Göbek Kaşarı</h2><p>Göbek kaşarı, peynir severlerin ilk tercihi olmaya aday, tam yağlı inek sütünden üretilmiş özel bir kaşar peyniridir.</p>`,
    price: 419.99, comparePrice: 439.99, isFeatured: true,
    images: [
      `${BASE9}/gorsel_2025-11-01_125346790.png`,
      `${BASE9}/Gobek-Kasar-1.png`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Yağlı Çeçil', slug: 'yagli-cecil',
    shortDescription: 'Yağlı çeçil peyniri, geleneksel yöntemlerle üretilen, damak tadınıza uygun eşsiz bir peynir çeşididir.',
    description: `<p>En çok tüketilen peynir türlerinden biridir. Klasik yöntem olan suda haşlanarak yapılır. Görünümü iplik şeklindedir. Tam yağlı, yumuşak ve tuzlu bir peynirdir.</p>`,
    price: 450, comparePrice: 499.99,
    images: [
      `${BASE9}/gorsel_2025-11-01_124737410.png`,
      `${BASE10}/gorsel_2025-10-03_010533624.png`,
      `${BASE9}/Yagli-Cecil.png`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Obruk Peyniri', slug: 'obruk-peyniri',
    price: 699.99, stock: 0, isActive: false,
    images: [`${BASE9}/Obruk-Peyniri.png`],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Ardahan Damal Çökeleği', slug: 'ardahan-damal-cokelegı',
    description: `<p>Doğal yöntemlerle üretilen Damal çökeleği, Ardahan'ın yüksek rakımlı yaylalarında beslenen hayvanların sütünden elde edilir. Katkısız, besleyici ve tamamen yerel üretimdir.</p>`,
    price: 449.99, comparePrice: 599.99,
    images: [
      `${BASE9}/gorsel_2025-11-01_124424473.png`,
      `${BASE9}/Cokelek.png`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Çörek Otlu Peynir', slug: 'corek-otlu-peynir',
    shortDescription: 'Çörek otlu peynir, eşsiz aromasıyla sofralarınıza doğal bir lezzet getiriyor.',
    description: `<h2>Doğallık ve Tazelik Bir Arada</h2><p>Çörek otlu peynir, eşsiz aromasıyla sofralarınıza doğal bir lezzet getiriyor. Çörek otunun kendine has yoğun aromasıyla peynirin yumuşak ve zengin dokusu mükemmel bir uyumla birleşiyor.</p>`,
    price: 199.99,
    images: [`${BASE9}/Corek-otlu-peynir.png`],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Erzincan Tulum Peyniri', slug: 'erzincan-tulum-peyniri',
    description: `<p>Kekik kokulu Munzur Yaylalarının doğal ortamında beslenen "Akkaraman" ırkı koyunların organik sütü, şirden mayası ve tuz dışında hiçbir madde kullanılmadan geleneksel yöntemlerle üretilmektedir. <strong>%100 doğal, sağlıklı ve lezzetlidir.</strong></p>`,
    price: 749.99, comparePrice: 799.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_124233356.png`,
      `${BASE10}/DSC05911-scaled.jpg`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Ateşoğlu Kaşar (1.8Kg)', slug: 'atesoglu-kasar-1-8kg',
    description: `<p>Ardahan ili Göle ilçesinde yaz mevsiminde ve mera hayvancılığının yapıldığı bölgede doğal şekilde elde edilen sütlerin, son teknoloji ile üretim yapmakta olan fabrikamızda peynire dönüşmekte ve olgunlaştırmaya bırakılmaktadır. <strong>TAM YAĞLI bir üründür.</strong></p>`,
    price: 779.99, comparePrice: 839.99, weight: 1.8,
    images: [
      `${BASE10}/gorsel_2025-11-01_125106630.png`,
      `${BASE10}/DSC05811-scaled.jpg`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Ateşoğlu Eski Kaşar', slug: 'atesoglu-eski-kasar',
    description: `<p>Ardahan ili Göle ilçesinde yaz mevsiminde ve mera hayvancılığının yapıldığı bölgede doğal şekilde elde edilen sütlerin, son teknoloji ile üretim yapmakta olan fabrikamızda peynire dönüşmekte ve olgunlaştırmaya bırakılmaktadır. <strong>TAM YAĞLI bir üründür.</strong></p>`,
    price: 449, comparePrice: 490,
    images: [
      `${BASE10}/gorsel_2025-11-01_131002491.png`,
      `${BASE10}/gorsel_2025-10-03_011946085.png`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Kars Köy Peyniri Az Tuzlu Tam Yağlı', slug: 'kars-koy-peyniri-az-tuzlu',
    shortDescription: 'Çiğ sütün peynir mayası katılarak yapılan bu peynir, 3-4 ay tuzlu suda bekletilerek daha sağlıklı bir hale getirilir.',
    description: `<p>Kars peyniri içinde en sade lezzete sahip olan peynirdir. Kars'ta 1768 m rakım yükseklikte yayla ve meralarda otlayan gezen ineklerin mis gibi kokan sütlerinden elde edilmiştir. Doğal ve katkısız olarak üretilmiştir.</p>`,
    price: 399.99, comparePrice: 439.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_131446635.png`,
      `${BASE10}/gorsel_2025-10-03_012036718.png`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Konya Tulum Peyniri', slug: 'konya-tulum-peyniri',
    shortDescription: 'Konya\'nın eşsiz yaylalarından gelen inek sütü ile hazırlanan, kendine has yoğun aromasıyla sofralara gerçek bir lezzet şöleni sunan peynir.',
    description: `<p><strong>Konya Tulum Peyniri – Doğallığın ve Lezzetin Buluştuğu Nokta</strong></p><p>Geleneksel yöntemlerle, doğal ortamda olgunlaştırılan bu peynir, hem kahvaltılarınızda hem de yemeklerinizde eşsiz bir tat bırakır. Doğal ve katkısız; hiçbir koruyucu veya yapay aroma içermez.</p>`,
    price: 299.99, comparePrice: 349.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_131253443.png`,
      `${BASE10}/gorsel_2025-10-03_012141891.png`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Blok Kaşar', slug: 'blok-kasar',
    shortDescription: 'Taze inek sütü filtrelendikten sonra belirli sıcaklıklara kadar ısıtılır ve sonrasında mayalanır.',
    description: `<p>Taze inek sütü filtrelendikten sonra belirli sıcaklıklara kadar ısıtılır ve sonrasında mayalanır. Yaklaşık on litre sütten bir kg kaşar elde edilir. <strong>Bu işlemlerin tamamı hijyenik ortamlarda yapılır. Ve hiçbir katkı maddesi kullanılmaz.</strong></p>`,
    price: 419.99, comparePrice: 450,
    images: [
      `${BASE10}/gorsel_2025-11-01_130131055.png`,
      `${BASE10}/gorsel_2025-10-03_012234860.png`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Trakya Tam Yağlı Beyaz Peynir', slug: 'trakya-tam-yagli-beyaz-peynir',
    shortDescription: 'İnek sütünden üretilir ve kendine has bir tada sahiptir.',
    description: `<p>Trakya'nın en iyi bilinen peyniridir. İnek sütünden üretilir. <strong>Sert ve parlak bir yapısı vardır.</strong> Minimum 6 ay soğuk odalarda olgunlaştırılır. <strong>Doğanın sütlü, vazgeçilmez klasik tarifidir.</strong></p>`,
    price: 429.99, comparePrice: 500,
    images: [
      `${BASE10}/gorsel_2025-11-01_123919344.png`,
      `${BASE10}/gorsel_2025-10-03_012356868.png`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Kars Gravyer Peyniri', slug: 'kars-gravyer-peyniri',
    shortDescription: 'Peynirlerin kralı olarak da bilinen Gravyer Peyniri, Kars\'ın eşsiz doğasında üretilmektedir.',
    description: `<p>Peynirlerin kralı olarak da bilinen Gravyer Peyniri 1800'lü yıllarda İsviçrelilerin Kafkasya Bölgesine geldiklerinde Zavot adı verilen sığır türünün sütünden yapmış oldukları bir peynir çeşididir. <strong>Kars gravyeri yağlı sütten yapılmaktadır, dolayısı ile besin değeri yüksek bir peynirdir.</strong> Raf ömrü toplam 36 aydır.</p>`,
    price: 999.99, comparePrice: 1099.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_123617869.png`,
      `${BASE10}/Gravyer-kucuk.png`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Kars Göğermiş Çeçil Peyniri', slug: 'kars-gogermis-cecil-peyniri',
    shortDescription: 'Kars Göğermiş Peyniri, peynir yapısındaki küften dolayı vücutta penisilinin üstlendiği işlevi yerine getirmektedir.',
    description: `<p>Taze civil peyniri tuzlandıktan sonra bir gün acı suyunu atması için dinlendirilir. Daha sonra lor peyniri ile karıştırılarak tahta kaplara doldurulur. Soğuk hava depolerında yedi ay kadar bekletildikten sonra tüketime hazır hale gelir. <strong>Hiçbir katkı maddesi kullanılmaz.</strong></p>`,
    price: 374.99, comparePrice: 420,
    images: [
      `${BASE10}/gorsel_2025-11-01_130712928.png`,
      `${BASE10}/gorsel_2025-10-03_012711167.png`,
      `${BASE10}/gorsel_2025-10-03_012659647.png`,
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Kars Taze Çeçil Peyniri', slug: 'kars-taze-cecil-peyniri',
    shortDescription: 'Taze inek sütü filtrelendikten sonra belirli sıcaklıklara kadar ısıtılır ve sonrasında mayalanır.',
    description: `<p>Taze inek sütü filtrelendikten sonra belirli sıcaklıklara kadar ısıtılır ve sonrasında mayalanır. Acı suyunu attıktan sonra haşlanır ve el ile çekilerek tel tel olması sağlanır. Sonrasında örülür ve tuzlanarak salamura edilir. <strong>Hiçbir katkı maddesi kullanılmaz.</strong></p>`,
    price: 349.99, comparePrice: 400,
    images: [`${BASE10}/gorsel_2025-10-03_012818656.png`],
  })

  await upsertProduct({
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
  console.log('\n🍯 Bal & Pekmez...')

  await upsertProduct({
    categoryId: catBal.id, name: 'Ardahan Petek Çiçek Balı', slug: 'ardahan-petek-cicek-bali',
    shortDescription: 'Petek bal, doğanın bizlere sunduğu en saf ve en doğal ürünlerden biridir.',
    description: `<p>Kars/Ardahan balı, Kars'ın kendi coğrafyasına has bin bir çeşit bitki çiçeklerinin özütünden Kafkas arılarının yaptığı bir baldır. Kafkas ırkı arı sadece Kars yöresinde bulunur ve Kars balına lezzetini Kafkas arısı verir.</p>`,
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

  await upsertProduct({
    categoryId: catBal.id, name: 'İspir Dut Pekmezi (1.4Kg)', slug: 'ispir-dut-pekmezi',
    shortDescription: 'Taze olarak ağaçtan toplanan dutlar ayıklandıktan sonra odun ateşinde kaynatılarak hazırlanır.',
    description: `<p>Taze olarak ağaçtan toplanan dutlar ayıklandıktan sonra genişçe bir kazana boşaltılır. Hiç bir ilave yapılmadan kazan odun ateşi üzerine bırakılır. <strong>Bu işlemler esnasından hiçbir şekilde şeker ilavesi yapılmaz, işlemler tamamlanınca şekersiz hakiki İspir dut pekmezi tüketime hazır hale gelir.</strong></p>`,
    price: 429.99, comparePrice: 470,
    images: [
      `${BASE9}/gorsel_2025-11-01_125955510.png`,
      `${BASE9}/Dut-Pekmezi-1.png`,
    ],
  })

  await upsertProduct({
    categoryId: catBal.id, name: 'Erzurum Ballı Keçi Boynuzu Özü Pekmezi', slug: 'erzurum-balli-keci-boynuzu-pekmezi',
    shortDescription: 'Şifa kaynağı olan keçiboynuzu pekmezi, besin değerleri bakımından oldukça zengindir.',
    description: `<h2>Keçi Boynuzunun Doğal ve Besleyici Özellikleri</h2><p>Keçi boynuzu, doğanın bize sunduğu mucizevi bir lezzettir. Zengin vitamin ve mineral içeriği sayesinde günlük enerji ihtiyacınızı karşılamaya yardımcı olurken, doğal bir tatlı aromasıyla diğer tatlardan ayrılır. Gluten içermediğinden, gluten hassasiyeti olan bireyler için de mükemmel bir seçenektir.</p>`,
    price: 349.99, comparePrice: 400, stock: 640,
    images: [
      `${BASE9}/gorsel_2025-11-01_124035897.png`,
      `${BASE9}/Keci-boynuzu.png`,
    ],
  })

  await upsertProduct({
    categoryId: catBal.id, name: 'Karakovan Balı', slug: 'karakovan-bali',
    description: `<p><strong>Kars/Ardahan balı, Kars'ın kendi coğrafyasına has bin bir çeşit bitki çiçeklerinin özütünden Kafkas arılarının yaptığı bir baldır.</strong> Kars balının diğer bir özelliği de kristalize olması ve krema şeklinde olmasıdır. Beyaz ile amber renginde olur. Boğazı yakmaz.</p>`,
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

  await upsertProduct({
    categoryId: catBal.id, name: 'Ateşoğlu Ardahan Süzme Çiçek Balı', slug: 'atesoglu-ardahan-suzme-cicek-bali',
    description: `<p><strong>Çiçek Balımızı diğer ballardan ayıran en büyük özellik 2.100 rakımlı yaylalarımızda bulunan 1.400'den fazla çiçek türüyle kaplı bitki florasıdır.</strong> Ardahan Balı tamamen organiktir ve Kafkas Arı ırkı tarafından üretilmektedir.</p>`,
    price: 1099.99, comparePrice: 1200,
    images: [
      `${BASE10}/gorsel_2025-11-01_125440137.png`,
      `${BASE10}/gorsel_2025-10-03_010117554.png`,
    ],
  })

  await upsertProduct({
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
  console.log('\n🌿 Doğal Ürünler...')

  await upsertProduct({
    categoryId: catDogal.id, name: 'Cevizli Sucuk', slug: 'cevizli-sucuk',
    shortDescription: 'Cevizli sucuk veya orcik veya köme, genellikle doğu yörelerinde üzüm ya da dut şırası ve ceviz kullanılarak yapılan tatlıdır.',
    description: `<h2>Doğal ve Geleneksel Lezzet: Cevizli Sucuk</h2><p>Cevizli sucuk, geleneksel Türk mutfağından günümüze taşınmış doğal ve sağlıklı bir tatlı atıştırmalıktır. Üzüm pekmezi ve ceviz gibi tamamen doğal malzemelerle hazırlanan bu enfes lezzet, damaklarda eşsiz bir tat bırakır.</p>`,
    price: 349.99, comparePrice: 379.99,
    images: [`${BASE9}/Cevizli-Sucuk.png`],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Siyah Erik Kurusu', slug: 'siyah-erik-kurusu',
    description: `<p>Artvin, Yusufeli ilçesinde yetişen eriklerden doğal yöntemlerle kurutulup, katkı ve koruyucu madde eklenmeden doğal olarak tüketiciye sunulmuştur. Enerji ve doğal besin kaynağıdır.</p>`,
    price: 319.99, comparePrice: 350,
    images: [
      `${BASE10}/gorsel_2025-10-03_005306839.png`,
      `${BASE10}/gorsel_2025-10-03_005323294.png`,
    ],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Kuru Kızılcık', slug: 'kuru-kizilcik',
    description: `<p>Ekşi vişne benzeri özelliklere sahip olan kızılcık genellikle komposto, jöle, reçel yapımında kullanılmaktadır. Genellikle Ağustos sonu ve Eylül aylarında ortaya çıkar.</p>`,
    price: 279.99, comparePrice: 300,
    images: [`${BASE10}/gorsel_2025-10-03_005410072.png`],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Kuru Kayısı (Aşma)', slug: 'kuru-kayisi-asma',
    description: `<p>Erzurum kayısı kurusu mevsiminde köylü eliyle açılarak güneşte kurutulmuştur. Tamamen doğal olan Erzurum kayısı kurusu ekşimsi tadıyla hoşaflık olarak tüketilmektedir. Herhangi bir kükürt, istim olmaması nedeniyle naturel ve serttir.</p>`,
    price: 299.99, comparePrice: 350,
    images: [`${BASE10}/gorsel_2025-10-03_005554759.png`],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Kızılcık Ekşisi', slug: 'kizilcik-eksisi',
    description: `<p>Kızılcık ekşisi, bölgemizde kiren ekşisi olarak bilinir. <strong>Kızılcıkta bol miktarda c vitamini, flavanoid, karotinoid ve müthiş bir antioksidan olan melatonin bulunur.</strong> Marmelat olarak tüketilebildiği gibi, sulandırılarak surup olarak da içilir.</p>`,
    price: 599.99, comparePrice: 699.99,
    images: [`${BASE10}/gorsel_2025-10-03_005639367.png`],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Iğdır Dut Kurusu', slug: 'igdir-dut-kurusu',
    description: `<p>Yaz mevsiminde Erzurum'un İspir ilçesinde toplanan dutlar güneş altına serilerek kurutulur. <strong>Kuruyemiş gibi tüketilebilir (cevizle önerilir). Hoşafı yapılıp içilebilir.</strong></p>`,
    price: 399.99, comparePrice: 450,
    images: [`${BASE10}/gorsel_2025-10-03_005735750.png`],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Kars Kaz Eti', slug: 'kars-kaz-eti',
    shortDescription: 'Yeni yıl sofralarının vazgeçilmez trendlerinden biri de kaz yemeğidir.',
    description: `<p>İlkbahar mevsiminde meralarda otlatılarak büyütülen kazlar, Kars/Ardahan'da kar yağışlarının başlaması ile kesime alınır, tuzlanıp kuru ayazda kurutulmaya bırakılır. Kazlarımız 2.300 gram ve 3.000 gram arasında değişiklik göstermektedir.</p>`,
    price: 3999.99,
    images: [
      `${BASE10}/WhatsApp-Gorsel-2025-11-17-saat-19.31.38_ea2d6ddb.jpg`,
      `${BASE10}/WhatsApp-Gorsel-2025-11-17-saat-19.31.39_dae173f9-1.jpg`,
    ],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Çekirdeksiz Siyah Erik Kurusu', slug: 'cekirdeksiz-siyah-erik-kurusu',
    description: `<p>Artvin, Yusufeli ilçesinde yetişen eriklerden doğal yöntemlerle kurutulup, katkı ve koruyucu madde eklenmeden doğal olarak tüketiciye sunulmuştur. Enerji ve doğal besin kaynağıdır.</p>`,
    price: 349.99, comparePrice: 370,
    images: [
      `${BASE10}/gorsel_2025-10-03_005306839.png`,
      `${BASE10}/gorsel_2025-10-03_005323294.png`,
    ],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Sarı Erik', slug: 'sari-erik',
    price: 319.99,
    images: [`${BASE10}/Sari-Erik-1.png`],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Cevizli Dut Pestili', slug: 'cevizli-dut-pestili',
    price: 319.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_132727215.png`,
      `${BASE10}/Cevizli-Dut-Pestili.png`,
    ],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Erik Ekşisi', slug: 'erik-eksisi',
    price: 349.99,
    images: [`${BASE10}/erik-eksisi-1.png`],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Sade Dut Pestili', slug: 'sade-dut-pestili',
    price: 299.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_123411096.png`,
      `${BASE10}/sade-dut-pestili.png`,
    ],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Siyah Special İri Zeytin', slug: 'siyah-special-iri-zeytin',
    price: 499.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_130831408.png`,
      `${BASE10}/Siyah-Special-Iri-Zeytin.png`,
    ],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Üçel Helva', slug: 'ucel-helva',
    price: 379.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_131913652.png`,
      `${BASE10}/DSC05893-scaled.jpg`,
    ],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Kars Kavurması', slug: 'kars-kavurmasi',
    price: 1449.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_125248415.png`,
      `${BASE10}/DSC05880-scaled.jpg`,
    ],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Sucuk', slug: 'sucuk',
    price: 1250,
    images: [
      `${BASE10}/gorsel_2025-11-01_123523247.png`,
      `${BASE10}/DSC05908-scaled.jpg`,
    ],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Evin Helva', slug: 'evin-helva',
    price: 299.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_123737620.png`,
      `${BASE10}/DSC05896-scaled.jpg`,
    ],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Elma Kurusu', slug: 'elma-kurusu',
    price: 319.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_123159228.png`,
      `${BASE10}/elma-kurusu.png`,
    ],
  })

  await upsertProduct({
    categoryId: catDogal.id, name: 'Adıyaman Akide Şekeri', slug: 'adiyaman-akide-sekeri',
    price: 129.99,
    images: [
      `${BASE10}/gorsel_2025-11-01_131046636.png`,
      `${BASE10}/Akide-Sekeri.png`,
    ],
  })

  console.log('\n✅ Tamamlandı! Mevcut ürünler atlandı, eksik olanlar eklendi.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
