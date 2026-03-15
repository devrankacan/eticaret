/**
 * Güvenli ürün ekleme scripti
 * Mevcut siparişleri, kullanıcıları ve diğer verileri SİLMEZ.
 * Sadece ürünleri upsert (ekle/güncelle) yapar.
 *
 * Çalıştırmak için: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/add-products.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BASE = 'https://linen-frog-157147.hostingersite.com/wp-content/uploads/2025/08'

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
    description: `<h2>Doğallık ve Lezzetin Buluştuğu Göbek Kaşarı</h2><p>Göbek kaşarı, peynir severlerin ilk tercihi olmaya aday, tam yağlı inek sütünden üretilmiş özel bir kaşar peyniridir.</p>`,
    price: 249.99, isFeatured: true,
    images: [`${BASE}/Gobek-Kasar-1.png`],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Yağlı Çeçil', slug: 'yagli-cecil',
    shortDescription: 'Yağlı çeçil peyniri, geleneksel yöntemlerle üretilen, damak tadınıza uygun eşsiz bir peynir çeşididir.',
    description: `<p>Yağlı çeçil peyniri, geleneksel yöntemlerle üretilen, damak tadınıza uygun eşsiz bir peynir çeşididir.</p>`,
    price: 499.99,
    images: [`${BASE}/Yagli-Cecil.png`],
    variations: [
      { name: '1 Kg',   price: 499.99, isDefault: true, sortOrder: 0 },
      { name: '1.5 Kg', price: 749.99, sortOrder: 1 },
    ],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Obruk Peyniri', slug: 'obruk-peyniri',
    price: 229.99,
    images: [`${BASE}/Obruk-Peyniri.png`],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Çökelek Peyniri', slug: 'cokelek-peyniri',
    price: 239.99,
    images: [`${BASE}/Cokelek.png`],
  })

  await upsertProduct({
    categoryId: catPeynir.id, name: 'Çörek Otlu Peynir', slug: 'corek-otlu-peynir',
    shortDescription: 'Çörek otunun aromatik lezzetiyle zenginleştirilmiş, doğal ve taze peynir.',
    price: 199.99,
    images: [`${BASE}/Corek-otlu-peynir.png`],
  })

  // ═══════════════════════════════════════════════════════════
  //  BAL & PEKMEZ
  // ═══════════════════════════════════════════════════════════
  console.log('\n🍯 Bal & Pekmez...')

  await upsertProduct({
    categoryId: catBal.id, name: 'Süzme Bal', slug: 'suzme-bal',
    price: 399.00, isFeatured: true,
    images: [`${BASE}/Suzme-Bal.png`],
  })

  await upsertProduct({
    categoryId: catBal.id, name: 'Petek Bal', slug: 'petek-bal',
    shortDescription: 'Petek bal, doğanın bizlere sunduğu en saf ve en doğal ürünlerden biridir.',
    price: 499.99,
    images: [`${BASE}/Petek-Bal.png`],
  })

  await upsertProduct({
    categoryId: catBal.id, name: 'Dut Pekmezi', slug: 'dut-pekmezi',
    price: 249.99,
    images: [`${BASE}/Dut-Pekmezi.png`],
  })

  await upsertProduct({
    categoryId: catBal.id, name: 'Keçi Boynuzu', slug: 'keci-boynuzu',
    price: 249.99,
    images: [`${BASE}/Keci-boynuzu.png`],
  })

  // ═══════════════════════════════════════════════════════════
  //  TEREYAĞI
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧈 Tereyağı...')

  await upsertProduct({
    categoryId: catTereyag.id, name: 'Tereyağı', slug: 'tereyagi-urun',
    price: 399.00, isFeatured: true,
    images: [`${BASE}/tereyag.png`],
  })

  await upsertProduct({
    categoryId: catTereyag.id, name: 'Eritilmiş Tereyağı', slug: 'eritilmis-tereyagi',
    price: 299.99,
    images: [`${BASE}/Erilitmis-Tereyag.png`],
  })

  // ═══════════════════════════════════════════════════════════
  //  DOĞAL ÜRÜNLER
  // ═══════════════════════════════════════════════════════════
  console.log('\n🌿 Doğal Ürünler...')

  await upsertProduct({
    categoryId: catDogal.id, name: 'Cevizli Sucuk', slug: 'cevizli-sucuk',
    price: 149.99,
    images: [`${BASE}/Cevizli-Sucuk.png`],
  })

  console.log('\n✅ Tamamlandı! Mevcut ürünler atlandı, eksik olanlar eklendi.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
