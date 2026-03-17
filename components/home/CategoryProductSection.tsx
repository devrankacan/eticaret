'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ProductCard } from '@/components/product/ProductCard'

type Product = {
  id: string
  name: string
  slug: string
  price: number
  comparePrice: number | null
  stock: number
  lowStockThreshold: number
  hasVariations: boolean
  images: { id: string; imagePath: string; isPrimary: boolean }[]
  variations: { stock: number }[]
}

type Category = {
  id: string
  name: string
  slug: string
  image?: string | null
  products: Product[]
}

// Slug veya isme göre ikon seçimi
function getCategoryIcon(slug: string, name: string, cls = 'w-5 h-5 flex-shrink-0') {
  const key = (slug + ' ' + name).toLowerCase()

  // Bal
  if (/bal|honey/.test(key)) return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )

  // Peynir / Süt ürünleri
  if (/peynir|cheese|süt|dairy/.test(key)) return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19h18l-2-9H5L3 19z" />
      <path d="M5 10L12 3l7 7" />
      <circle cx="9" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  )

  // Yağ / Tereyağı
  if (/yağ|ya[gğ]|butter|oil/.test(key)) return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 0-5 5.5-5 10a5 5 0 0010 0c0-4.5-5-10-5-10z" />
    </svg>
  )

  // Pekmez / Reçel / Şurup
  if (/pekmez|reçel|jam|syrup|şurup/.test(key)) return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8l1 4H7L8 3z" />
      <rect x="5" y="7" width="14" height="13" rx="2" />
      <path d="M9 13c0-1.7 1.5-3 3-1.5S15 13 15 13s-1.5 3-3 1.5S9 13 9 13z" />
    </svg>
  )

  // Paket / Sepet
  if (/paket|package|sepet|basket|set|kutu/.test(key)) return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )

  // Kuru gıda / Tahıl / Kuruyemiş
  if (/kuru|tahıl|grain|nut|kuruyemiş|bakliyat/.test(key)) return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M12 12c0 0-4-3-4-7a4 4 0 018 0c0 4-4 7-4 7z" />
      <path d="M8 16c-1.5.5-3 0-3-2" />
      <path d="M16 16c1.5.5 3 0 3-2" />
    </svg>
  )

  // Baharat / Ot
  if (/baharat|spice|ot|herb/.test(key)) return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 000 20" />
      <path d="M12 2a10 10 0 010 20" />
      <path d="M2 12h20" />
      <path d="M12 2c2 4 2 8 0 20" />
    </svg>
  )

  // Varsayılan: yaprak / doğal ürün
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 19.36A1 1 0 004.64 21c4-2 8-3 12-8 1-1.5 1.5-3.5 1.5-5H17z" />
      <path d="M3.82 19.36C6 14 9 10 17 8" />
    </svg>
  )
}

function AllIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function CategoryIcon({ image, name, slug, active }: { image?: string | null; name: string; slug: string; active: boolean }) {
  if (image) {
    return <Image src={image} alt={name} width={24} height={24} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${active ? 'text-white/90' : 'text-primary-600'}`}>
      {getCategoryIcon(slug, name, 'w-[18px] h-[18px] flex-shrink-0')}
    </span>
  )
}

export function CategoryProductSection({ categories }: { categories: Category[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const allProducts = categories.flatMap(c => c.products)
  const activeCategory = categories.find(c => c.id === activeId)
  const displayProducts = activeId ? (activeCategory?.products ?? []) : allProducts

  return (
    <div className="bg-white py-5">
      <div className="max-w-7xl mx-auto px-4">

        {/* ══ MOBİL & TABLET: Yatay sekme çubugu ══ */}
        <div className="lg:hidden overflow-x-auto pb-3 mb-3" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-2 w-max">
            <button
              onClick={() => setActiveId(null)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition border ${
                activeId === null
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50'
              }`}
            >
              <AllIcon />
              Tüm Ürünler
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveId(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition border ${
                  activeId === cat.id
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50'
                }`}
              >
                {cat.image
                  ? <Image src={cat.image} alt={cat.name} width={18} height={18} className="w-[18px] h-[18px] rounded-full object-cover" />
                  : getCategoryIcon(cat.slug, cat.name, 'w-[18px] h-[18px] flex-shrink-0')
                }
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* ══ DESKTOP: Sol sidebar + sağ ürün grid ══ */}
        <div className="hidden lg:flex gap-0">

          {/* Sol: kategori listesi */}
          <div className="w-48 xl:w-52 flex-shrink-0 pr-4 border-r border-gray-100">
            <button
              onClick={() => setActiveId(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition mb-0.5 ${
                activeId === null
                  ? 'bg-primary-700 text-white'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-800'
              }`}
            >
              <AllIcon />
              Tüm Ürünler
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveId(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition mb-0.5 ${
                  activeId === cat.id
                    ? 'bg-primary-700 text-white'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-800'
                }`}
              >
                <CategoryIcon image={cat.image} name={cat.name} slug={cat.slug} active={activeId === cat.id} />
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sağ: ürün grid */}
          <div className="flex-1 min-w-0 pl-5">
            {displayProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
                  {displayProducts.slice(0, 8).map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {activeId && activeCategory && (
                  <div className="mt-4 text-right">
                    <Link
                      href={`/kategori/${activeCategory.slug}`}
                      className="inline-flex items-center gap-1 text-primary-600 text-sm font-medium hover:underline"
                    >
                      Tümünü gör
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-sm py-8">Bu kategoride ürün bulunamadı.</p>
            )}
          </div>
        </div>

        {/* ══ MOBİL: ürün grid ══ */}
        <div className="lg:hidden">
          {displayProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {displayProducts.slice(0, 6).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {activeId && activeCategory && (
                <div className="mt-4 text-center">
                  <Link
                    href={`/kategori/${activeCategory.slug}`}
                    className="inline-flex items-center gap-1 text-primary-600 text-sm font-semibold border border-primary-200 rounded-full px-5 py-2 hover:bg-primary-50 transition"
                  >
                    Tümünü gör →
                  </Link>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">Bu kategoride ürün bulunamadı.</p>
          )}
        </div>

      </div>
    </div>
  )
}
