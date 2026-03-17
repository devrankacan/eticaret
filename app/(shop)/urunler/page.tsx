export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { ProductCard } from '@/components/product/ProductCard'
import { SortSelect } from '@/components/product/SortSelect'

interface Props {
  searchParams: { sayfa?: string; siralama?: string; q?: string; kategori?: string }
}

export const metadata = {
  title: 'Tüm Ürünler | Ateşoğlu Süt Ürünleri',
  description: 'Tüm ürünlerimizi keşfedin.',
}

const LIMIT = 24

export default async function UrunlerPage({ searchParams }: Props) {
  const page = parseInt(searchParams.sayfa || '1')
  const siralama = searchParams.siralama || 'yeni'
  const q = searchParams.q || ''
  const kategoriSlug = searchParams.kategori || ''

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: 'asc' },
  })

  const selectedCategory = kategoriSlug
    ? await prisma.category.findUnique({ where: { slug: kategoriSlug } })
    : null

  const categoryIds = selectedCategory
    ? [selectedCategory.id, ...(await prisma.category.findMany({ where: { parentId: selectedCategory.id }, select: { id: true } })).map(c => c.id)]
    : undefined

  const where: any = { isActive: true }
  if (categoryIds) where.categoryId = { in: categoryIds }
  if (q) where.name = { contains: q }

  const orderBy: any =
    siralama === 'fiyat-artan' ? { price: 'asc' } :
    siralama === 'fiyat-azalan' ? { price: 'desc' } :
    siralama === 'populer' ? { views: 'desc' } :
    { createdAt: 'desc' }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { where: { isPrimary: true }, take: 1 }, category: true, variations: { select: { stock: true } } },
      orderBy,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    prisma.product.count({ where }),
  ])

  const pages = Math.ceil(total / LIMIT)

  const buildUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams()
    const merged = { siralama, q, kategori: kategoriSlug, ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
    return `/urunler?${params.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-primary-600 transition">Ana Sayfa</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Tüm Ürünler</span>
      </nav>

      <div className="flex items-start gap-6">
        {/* Sol: Kategoriler */}
        <aside className="hidden sm:block w-48 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Kategoriler</p>
            <ul className="space-y-1">
              <li>
                <Link href="/urunler"
                  className={`block text-sm px-2 py-1.5 rounded-lg transition ${!kategoriSlug ? 'text-primary-600 font-semibold bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>
                  Tüm Ürünler
                </Link>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link href={buildUrl({ kategori: cat.slug, sayfa: '1' })}
                    className={`block text-sm px-2 py-1.5 rounded-lg transition ${kategoriSlug === cat.slug ? 'text-primary-600 font-semibold bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Arama + Sıralama */}
          <div className="bg-white rounded-2xl shadow-sm p-3 mb-4 flex gap-2 items-center flex-wrap">
            <form action="/urunler" className="flex-1 flex gap-2 min-w-0">
              <input
                name="q"
                defaultValue={q}
                placeholder="Ürün ara..."
                className="flex-1 text-sm focus:outline-none min-w-0"
              />
              {kategoriSlug && <input type="hidden" name="kategori" value={kategoriSlug} />}
              <button type="submit" className="text-primary-600 hover:text-primary-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>
            </form>
            <Suspense>
              <SortSelect current={siralama} />
            </Suspense>
          </div>

          {/* Mobil kategoriler */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 sm:hidden scroll-x">
            <Link href="/urunler"
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition ${!kategoriSlug ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              Tümü
            </Link>
            {categories.map(cat => (
              <Link key={cat.id} href={buildUrl({ kategori: cat.slug, sayfa: '1' })}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition ${kategoriSlug === cat.slug ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {cat.name}
              </Link>
            ))}
          </div>

          <p className="text-sm text-gray-400 mb-3">{total} ürün</p>

          {products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="font-medium">Ürün bulunamadı</p>
              <Link href="/urunler" className="text-primary-600 text-sm hover:underline mt-2 inline-block">Filtreleri temizle</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map(product => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {page > 1 && (
                <Link href={buildUrl({ sayfa: String(page - 1) })}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                  ← Önceki
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-gray-500">{page} / {pages}</span>
              {page < pages && (
                <Link href={buildUrl({ sayfa: String(page + 1) })}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                  Sonraki →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
