import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { ProductActions } from './ProductActions'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product) return {}
  return {
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.shortDescription ?? '',
  }
}

export default async function ProductPage({ params }: Props) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      category: { include: { parent: true } },
      images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
      reviews: { where: { isApproved: true }, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!product) notFound()

  // Görüntülenme sayısı artır
  await prisma.product.update({
    where: { id: product.id },
    data: { views: { increment: 1 } },
  })

  // Benzer ürünler
  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isActive: true,
      id: { not: product.id },
    },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    take: 6,
  })

  const discountPercent = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  const isOutOfStock = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold

  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length
    : 0

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-4 py-0 sm:py-6">
      {/* Breadcrumb */}
      <nav className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-primary-600 transition">Ana Sayfa</Link>
        <span>/</span>
        <Link href={`/kategori/${product.category.slug}`} className="hover:text-primary-600 transition">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-gray-700 truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="bg-white sm:rounded-2xl sm:shadow-sm overflow-hidden">
        <div className="lg:flex">

          {/* ====== ÜRÜN GÖRSELLERİ ====== */}
          <ProductImages images={product.images} name={product.name} discount={discountPercent} />

          {/* ====== ÜRÜN BİLGİLERİ ====== */}
          <div className="lg:w-1/2 p-4 sm:p-6 flex flex-col">
            <Link href={`/kategori/${product.category.slug}`}
              className="text-primary-600 text-sm font-medium hover:underline self-start">
              {product.category.name}
            </Link>

            <h1 className="text-gray-900 font-bold text-xl sm:text-2xl mt-1 leading-snug">
              {product.name}
            </h1>

            {product.sku && (
              <p className="text-gray-400 text-xs mt-1">Ürün Kodu: {product.sku}</p>
            )}

            {/* Rating */}
            {product.reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} className={`w-4 h-4 ${i <= avgRating ? 'text-yellow-400' : 'text-gray-200'}`}
                      fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500">({product.reviews.length} yorum)</span>
              </div>
            )}

            {/* Fiyat */}
            <div className="mt-4 flex items-end gap-3">
              <span className="price font-bold text-3xl">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-gray-400 text-lg line-through">{formatPrice(product.comparePrice)}</span>
              )}
            </div>
            <p className="text-gray-400 text-xs mt-0.5">KDV dahildir</p>

            {/* Stok durumu */}
            <div className="mt-3">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-sm font-medium px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Stokta Yok
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full">
                  Son {product.stock} adet
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Stokta Var
                </span>
              )}
            </div>

            {/* Kısa açıklama */}
            {product.shortDescription && (
              <p className="text-gray-600 text-sm mt-4 leading-relaxed">{product.shortDescription}</p>
            )}

            {/* Sepet işlemleri (client component) */}
            <ProductActions
              productId={product.id}
              productName={product.name}
              maxStock={product.stock}
              isOutOfStock={isOutOfStock}
            />

            {/* Güven rozetleri */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-t pt-4">
              {[
                { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Güvenli Alışveriş' },
                { icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', label: 'Hızlı Kargo' },
                { icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6', label: 'Kolay İade' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <svg className="w-6 h-6 text-primary-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Açıklama */}
        {product.description && (
          <div className="border-t px-4 sm:px-6 py-6">
            <h2 className="font-bold text-lg mb-4">Ürün Açıklaması</h2>
            <div
              className="text-gray-600 text-sm leading-relaxed prose max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {/* Yorumlar */}
        {product.reviews.length > 0 && (
          <div className="border-t px-4 sm:px-6 py-6">
            <h2 className="font-bold text-lg mb-4">
              Müşteri Yorumları
              <span className="text-gray-400 font-normal text-base ml-2">({product.reviews.length})</span>
            </h2>
            <div className="space-y-4">
              {product.reviews.map(review => (
                <div key={review.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{review.name}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <svg key={i} className={`w-4 h-4 ${i <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                          fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
                  <p className="text-gray-400 text-xs mt-2">{new Date(review.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Benzer ürünler */}
      {related.length > 0 && (
        <div className="mt-4 bg-white sm:rounded-2xl sm:shadow-sm py-5 px-4 sm:px-6">
          <h2 className="font-bold text-lg mb-4">Benzer Ürünler</h2>
          <div className="flex gap-3 scroll-x pb-2">
            {related.map(p => (
              <div key={p.id} className="flex-shrink-0 w-40 sm:w-48">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Görsel galerisi (client component olması gerekmediği için server'da render)
function ProductImages({ images, name, discount }: {
  images: { id: string; imagePath: string }[]
  name: string
  discount: number | null
}) {
  if (images.length === 0) {
    return (
      <div className="lg:w-1/2 aspect-square bg-gray-100 flex items-center justify-center">
        <svg className="w-24 h-24 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }
  return (
    <div className="lg:w-1/2">
      <div className="aspect-square relative overflow-hidden bg-gray-50">
        <Image
          src={images[0].imagePath.startsWith('http') ? images[0].imagePath : `/${images[0].imagePath}`}
          alt={name}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {discount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white font-bold text-sm px-3 py-1 rounded-full">
            %{discount} İndirim
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 p-3 scroll-x">
          {images.map((img) => (
            <div key={img.id} className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200">
              <Image
                src={img.imagePath.startsWith('http') ? img.imagePath : `/${img.imagePath}`}
                alt={name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
