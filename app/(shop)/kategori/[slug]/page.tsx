import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { ProductCard } from '@/components/product/ProductCard'
import { SortSelect } from '@/components/product/SortSelect'

interface Props {
  params: { slug: string }
  searchParams: { sayfa?: string; siralama?: string }
}

export async function generateMetadata({ params }: Props) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } })
  if (!category) return {}
  return {
    title: `${category.name} | Doğal Lezzet`,
    description: category.description ?? `${category.name} kategorisindeki ürünler`,
  }
}

const LIMIT = 24

export default async function KategoriPage({ params, searchParams }: Props) {
  const page = parseInt(searchParams.sayfa || '1')
  const siralama = searchParams.siralama || 'yeni'

  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      parent: true,
      children: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!category) notFound()

  // Bu kategorideki ve alt kategorilerdeki ürünler
  const categoryIds = [category.id, ...category.children.map(c => c.id)]

  const orderBy: any =
    siralama === 'fiyat-artan' ? { price: 'asc' } :
    siralama === 'fiyat-azalan' ? { price: 'desc' } :
    siralama === 'populer' ? { views: 'desc' } :
    { createdAt: 'desc' }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: { in: categoryIds }, isActive: true },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: true,
      },
      orderBy,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    prisma.product.count({
      where: { categoryId: { in: categoryIds }, isActive: true },
    }),
  ])

  const pages = Math.ceil(total / LIMIT)

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-primary-600 transition">Ana Sayfa</Link>
        <span>/</span>
        {category.parent && (
          <>
            <Link href={`/kategori/${category.parent.slug}`} className="hover:text-primary-600 transition">
              {category.parent.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-700 font-medium">{category.name}</span>
      </nav>

      <div className="flex items-start gap-6">
        {/* Sol: Alt kategoriler (varsa) */}
        {category.children.length > 0 && (
          <aside className="hidden sm:block w-48 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Alt Kategoriler</p>
              <ul className="space-y-1">
                <li>
                  <Link href={`/kategori/${category.slug}`}
                    className="block text-sm text-primary-600 font-semibold px-2 py-1.5 rounded-lg bg-primary-50">
                    Tümü ({total})
                  </Link>
                </li>
                {category.children.map(child => (
                  <li key={child.id}>
                    <Link href={`/kategori/${child.slug}`}
                      className="block text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition">
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        {/* Sağ: Ürünler */}
        <div className="flex-1 min-w-0">
          {/* Başlık + Sıralama */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-sm text-gray-400">{total} ürün</p>
            </div>
            <Suspense>
              <SortSelect current={siralama} />
            </Suspense>
          </div>

          {/* Mobil alt kategoriler */}
          {category.children.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 sm:hidden scroll-x">
              <Link href={`/kategori/${category.slug}`}
                className="flex-shrink-0 text-xs font-semibold bg-primary-600 text-white px-3 py-1.5 rounded-full">
                Tümü
              </Link>
              {category.children.map(child => (
                <Link key={child.id} href={`/kategori/${child.slug}`}
                  className="flex-shrink-0 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition">
                  {child.name}
                </Link>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="font-medium">Bu kategoride ürün bulunamadı</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map(product => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          )}

          {/* Sayfalama */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {page > 1 && (
                <Link href={`/kategori/${params.slug}?sayfa=${page - 1}&siralama=${siralama}`}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                  ← Önceki
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-gray-500">{page} / {pages}</span>
              {page < pages && (
                <Link href={`/kategori/${params.slug}?sayfa=${page + 1}&siralama=${siralama}`}
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
