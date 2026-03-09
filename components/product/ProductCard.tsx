'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { useCart, useToast } from '@/components/providers'
import { useFavorites } from '@/hooks/useFavorites'

interface ProductImage {
  id: string
  imagePath: string
  isPrimary: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  comparePrice: number | null
  stock: number
  lowStockThreshold: number
  images: ProductImage[]
}

interface Props {
  product: Product
  className?: string
}

export function ProductCard({ product, className = '' }: Props) {
  const [adding, setAdding] = useState(false)
  const { refreshCart } = useCart()
  const { addToast } = useToast()
  const { toggle, isFavorite } = useFavorites()
  const favorited = isFavorite(product.id)

  const image = product.images.find(i => i.isPrimary) ?? product.images[0]
  const isOutOfStock = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold
  const discountPercent = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  async function addToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (isOutOfStock || adding) return
    setAdding(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      })
      if (res.ok) {
        addToast(`"${product.name}" sepete eklendi!`)
        refreshCart()
      } else {
        addToast('Ürün eklenemedi.', 'error')
      }
    } catch {
      addToast('Bir hata oluştu.', 'error')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className={`product-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group ${className}`}>
      {/* Görsel */}
      <Link href={`/urunler/${product.slug}`} className="block relative">
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          {image ? (
            <Image
              src={image.imagePath.startsWith('data:') || image.imagePath.startsWith('http') ? image.imagePath : `/${image.imagePath}`}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 33vw, 20vw"
              unoptimized={image.imagePath.startsWith('data:')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* İndirim rozeti */}
        {discountPercent && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            %{discountPercent}
          </span>
        )}

        {/* Favori butonu */}
        <button
          onClick={e => { e.preventDefault(); toggle(product.id) }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:scale-110 transition"
          aria-label={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <svg className={`w-4 h-4 transition ${favorited ? 'fill-red-500 text-red-500' : 'fill-none text-gray-400'}`} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Desktop hover - Sepete Ekle */}
        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {isOutOfStock ? (
            <div className="bg-black/75 text-white text-center py-2.5 text-xs font-bold tracking-wider">
              TÜKENDİ
            </div>
          ) : (
            <button
              onClick={addToCart}
              disabled={adding}
              className="w-full bg-primary-600/90 hover:bg-primary-700 text-white py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {adding ? 'Ekleniyor...' : 'Sepete Ekle'}
            </button>
          )}
        </div>
      </Link>

      {/* Bilgi */}
      <div className="p-2.5">
        <Link href={`/urunler/${product.slug}`}>
          <p className="text-gray-700 text-xs leading-snug line-clamp-2 min-h-[2.5rem] hover:text-primary-700 transition">
            {product.name}
          </p>
        </Link>

        <div className="mt-2">
          <p className="price font-bold text-sm">
            {formatPrice(product.price)}
          </p>
          <p className="text-gray-400 text-xs line-through min-h-[1.125rem]">
            {product.comparePrice ? formatPrice(product.comparePrice) : ''}
          </p>
        </div>

        {/* Sepete Ekle butonu - her zaman aynı yerde */}
        {isOutOfStock ? (
          <div className="mt-1 w-full bg-gray-100 text-gray-500 py-2 rounded-xl text-xs font-semibold text-center">
            Tükendi
          </div>
        ) : (
          <button
            onClick={addToCart}
            disabled={adding}
            className="mt-1 w-full bg-primary-600 hover:bg-primary-700 active:scale-95 disabled:opacity-60 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {adding ? '...' : 'Sepete Ekle'}
          </button>
        )}
      </div>
    </div>
  )
}
