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
  originalPrice?: number | null
  isFeatured?: boolean
  images: { imagePath: string; isPrimary?: boolean }[]
  variations: { stock: number }[]
}

type Category = {
  id: string
  name: string
  slug: string
  image?: string | null
  products: Product[]
}

function AllIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function CategoryIcon({ image, name, active }: { image?: string | null; name: string; active: boolean }) {
  if (image) {
    return <Image src={image} alt={name} width={24} height={24} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${active ? 'bg-white/25 text-white' : 'bg-primary-100 text-primary-600'}`}>
      {name.charAt(0)}
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
                {cat.image && (
                  <Image src={cat.image} alt={cat.name} width={18} height={18} className="w-[18px] h-[18px] rounded-full object-cover" />
                )}
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
                <CategoryIcon image={cat.image} name={cat.name} active={activeId === cat.id} />
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
