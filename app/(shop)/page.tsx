export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { BannerSlider } from '@/components/product/BannerSlider'
import { ProductCard } from '@/components/product/ProductCard'
import { InstagramFeed } from '@/components/InstagramFeed'
import { CategoryProductSection } from '@/components/home/CategoryProductSection'

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
          include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, variations: { select: { stock: true } } },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: 8,
        },
      },
    }),

    // Öne çıkan ürünler
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { images: { where: { isPrimary: true }, take: 1 }, variations: { select: { stock: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    // Instagram ve anasayfa ayarları
    prisma.setting.findMany({
      where: { key: { in: ['instagram_username', 'instagram_embed_code', 'homepage_featured_title', 'homepage_featured_visible', 'homepage_categories_visible', 'homepage_instagram_visible', 'homepage_hero_enabled', 'homepage_hero_title', 'homepage_hero_subtitle', 'homepage_hero_button_text', 'homepage_hero_button_href', 'homepage_hero_bg_color'] } },
    }),
  ])

  const settingMap = Object.fromEntries(instaSettings.map(s => [s.key, s.value ?? '']))

  return {
    banners,
    categories,
    featuredProducts,
    instaUsername: settingMap.instagram_username || '',
    instaEmbedCode: settingMap.instagram_embed_code || '',
    featuredTitle: settingMap.homepage_featured_title || 'Öne Çıkan Ürünler',
    showFeatured: settingMap.homepage_featured_visible !== '0',
    showCategories: settingMap.homepage_categories_visible !== '0',
    showInstagram: settingMap.homepage_instagram_visible !== '0',
    heroEnabled: settingMap.homepage_hero_enabled === '1',
    heroTitle: settingMap.homepage_hero_title || 'Hoş Geldiniz',
    heroSubtitle: settingMap.homepage_hero_subtitle || '',
    heroBtnText: settingMap.homepage_hero_button_text || 'Alışverişe Başla',
    heroBtnHref: settingMap.homepage_hero_button_href || '/urunler',
    heroBgColor: settingMap.homepage_hero_bg_color || '#3d1f08',
  }
}

export default async function HomePage() {
  const { banners, categories, featuredProducts, instaUsername, instaEmbedCode, featuredTitle, showFeatured, showCategories, showInstagram, heroEnabled, heroTitle, heroSubtitle, heroBtnText, heroBtnHref, heroBgColor } = await getData()

  return (
    <div className="space-y-3">

      {/* ====== HERO BANNER (Admin'den yönetilir) ====== */}
      {heroEnabled && (
        <div className="w-full py-16 px-4 flex items-center justify-center" style={{ backgroundColor: heroBgColor }}>
          <div className="text-center text-white max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{heroTitle}</h1>
            {heroSubtitle && <p className="text-lg text-white/80 mb-6">{heroSubtitle}</p>}
            <a href={heroBtnHref} className="inline-block bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition">
              {heroBtnText}
            </a>
          </div>
        </div>
      )}

      {/* ====== BANNER SLİDER ====== */}
      <BannerSlider banners={banners} />

      {/* ====== KATEGORİ + ÜRÜNLER ====== */}
      {showCategories && categories.length > 0 && (
        <CategoryProductSection categories={categories} />
      )}

      {/* ====== ÖNE ÇIKAN ÜRÜNLER ====== */}
      {showFeatured && featuredProducts.length > 0 && (
        <div className="bg-white py-5">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h2 className="font-bold text-base sm:text-lg text-gray-900 uppercase">
                {featuredTitle}
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
      {showInstagram && (instaUsername || instaEmbedCode) && (
        <InstagramFeed username={instaUsername} embedCode={instaEmbedCode} />
      )}

    </div>
  )
}
