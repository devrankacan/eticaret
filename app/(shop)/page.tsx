export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { BannerSlider } from '@/components/product/BannerSlider'
import { ProductCard } from '@/components/product/ProductCard'
import { InstagramFeed } from '@/components/InstagramFeed'
import Image from 'next/image'
import Link from 'next/link'

async function getData() {
  const now = new Date()

  const [banners, categories, featuredProducts, instaSettings] = await Promise.all([
    // Aktif bannerlar
    prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { sortOrder: 'asc' },
    }),

    // Ana kategoriler + alt kategoriler
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          take: 5,
        },
        products: {
          where: { isActive: true },
          include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: 8,
        },
      },
    }),

    // Öne çıkan ürünler
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    // Instagram ayarları
    prisma.setting.findMany({
      where: { key: { in: ['instagram_username', 'instagram_embed_code'] } },
    }),
  ])

  const instaMap = Object.fromEntries(instaSettings.map(s => [s.key, s.value ?? '']))

  return {
    banners,
    categories,
    featuredProducts,
    instaUsername: instaMap.instagram_username || '',
    instaEmbedCode: instaMap.instagram_embed_code || '',
  }
}

export default async function HomePage() {
  const { banners, categories, featuredProducts, instaUsername, instaEmbedCode } = await getData()

  return (
    <div className="space-y-3">

      {/* ====== BANNER SLİDER ====== */}
      <BannerSlider banners={banners} />

      {/* ====== KATEGORİ KARTLARI - Arifoğlu tarzı yatay scroll ====== */}
      {categories.length > 0 && (
        <div className="bg-white py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-4 scroll-x pb-2 lg:grid lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {categories.map(cat => (
                <div key={cat.id} className="flex-shrink-0 w-40 sm:w-48 lg:w-auto">
                  <Link href={`/kategori/${cat.slug}`}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow text-center">
                      {/* Kategori görseli */}
                      <div className="flex justify-center mb-3">
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            width={96}
                            height={96}
                            className="w-24 h-24 object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {/* Kategori adı */}
                      <h3 className="text-primary-700 font-bold text-xs sm:text-sm mb-2 uppercase leading-tight">
                        {cat.name}
                      </h3>
                      {/* Alt kategoriler */}
                      {cat.children.length > 0 && (
                        <ul className="space-y-1">
                          {cat.children.map(child => (
                            <li key={child.id} className="text-xs text-gray-500 hover:text-primary-600 transition truncate">
                              {child.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====== KATEGORİ BAZLI ÜRÜNLER ====== */}
      {categories.map(cat => {
        if (cat.products.length === 0) return null
        return (
          <div key={cat.id} className="bg-white py-5">
            <div className="max-w-7xl mx-auto px-4">
              {/* Başlık */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-primary-600 rounded-full" />
                  <h2 className="font-bold text-base sm:text-lg text-gray-900 uppercase">
                    {cat.name}
                  </h2>
                </div>
                <Link
                  href={`/kategori/${cat.slug}`}
                  className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1"
                >
                  Tümü
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Ürünler - mobilde yatay scroll, masaüstünde grid */}
              <div className="flex gap-3 scroll-x pb-2 lg:grid lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {cat.products.map(product => (
                  <div key={product.id} className="flex-shrink-0 w-40 sm:w-48 lg:w-auto">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}

      {/* ====== ÖNE ÇIKAN ÜRÜNLER ====== */}
      {featuredProducts.length > 0 && (
        <div className="bg-white py-5">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h2 className="font-bold text-base sm:text-lg text-gray-900 uppercase">
                Öne Çıkan Ürünler
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====== INSTAGRAM FEED ====== */}
      {(instaUsername || instaEmbedCode) && (
        <InstagramFeed username={instaUsername} embedCode={instaEmbedCode} />
      )}

    </div>
  )
}
