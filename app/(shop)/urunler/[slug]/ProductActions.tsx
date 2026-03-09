'use client'

import { useState } from 'react'
import { useCart, useToast } from '@/components/providers'
import { formatPrice } from '@/lib/utils'

interface Variation {
  id: string
  name: string
  price: number
  comparePrice?: number | null
  stock: number
}

interface Props {
  productId: string
  productName: string
  maxStock: number
  isOutOfStock: boolean
  // Varyasyon yoksa (simple ürün) bunlar kullanılmaz
  variations?: Variation[]
  basePrice?: number
  baseComparePrice?: number | null
}

export function ProductActions({
  productId,
  productName,
  maxStock,
  isOutOfStock,
  variations = [],
  basePrice,
  baseComparePrice,
}: Props) {
  const hasVariations = variations.length > 0
  const defaultVariation = variations.find(v => v.stock > 0) ?? variations[0]

  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(
    hasVariations ? (defaultVariation ?? null) : null
  )
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const { refreshCart } = useCart()
  const { addToast } = useToast()

  // Aktif fiyat/stok (varyasyonlu ya da düz ürün)
  const activePrice        = selectedVariation ? selectedVariation.price        : (basePrice ?? 0)
  const activeComparePrice = selectedVariation ? selectedVariation.comparePrice : baseComparePrice
  const activeStock        = selectedVariation ? selectedVariation.stock        : maxStock
  const activeOutOfStock   = hasVariations
    ? (selectedVariation ? selectedVariation.stock <= 0 : true)
    : isOutOfStock

  const discountPercent = activeComparePrice && activeComparePrice > activePrice
    ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100)
    : null

  async function addToCart() {
    if (activeOutOfStock || loading) return
    if (hasVariations && !selectedVariation) {
      addToast('Lütfen bir seçenek seçin.', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity,
          variationId: selectedVariation?.id ?? null,
        }),
      })
      if (res.ok) {
        const label = selectedVariation ? `"${productName} - ${selectedVariation.name}"` : `"${productName}"`
        addToast(`${label} sepete eklendi!`)
        refreshCart()
      } else {
        addToast('Ürün eklenemedi.', 'error')
      }
    } catch {
      addToast('Bir hata oluştu.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-4">

      {/* Varyasyon seçici */}
      {hasVariations && (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Seçenek</label>
          <div className="flex flex-wrap gap-2">
            {variations.map(v => {
              const isSelected = selectedVariation?.id === v.id
              const isUnavailable = v.stock <= 0
              return (
                <button
                  key={v.id}
                  onClick={() => { if (!isUnavailable) { setSelectedVariation(v); setQuantity(1) } }}
                  disabled={isUnavailable}
                  className={`
                    px-4 py-2 rounded-lg border-2 text-sm font-semibold transition select-none
                    ${isSelected
                      ? 'border-[#3d1f08] bg-[#3d1f08] text-white shadow-sm'
                      : isUnavailable
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                        : 'border-gray-300 text-gray-700 hover:border-[#3d1f08] hover:text-[#3d1f08] cursor-pointer'
                    }
                  `}
                >
                  {v.name}
                </button>
              )
            })}
          </div>
          {selectedVariation && (
            <button
              onClick={() => setSelectedVariation(null)}
              className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 transition underline"
            >
              Temizle
            </button>
          )}
        </div>
      )}

      {/* Dinamik fiyat (varyasyon değişince güncellenir) */}
      {hasVariations && selectedVariation && (
        <div className="flex items-end gap-3">
          <span className="price font-bold text-3xl">{formatPrice(activePrice)}</span>
          {activeComparePrice && (
            <>
              <span className="text-gray-400 text-lg line-through">{formatPrice(activeComparePrice)}</span>
              {discountPercent && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-1">
                  %{discountPercent}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Stok durumu */}
      {hasVariations && selectedVariation && (
        <div>
          {activeOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-sm font-medium px-3 py-1.5 rounded-full">
              Stokta Yok
            </span>
          ) : activeStock <= 5 ? (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full">
              Son {activeStock} adet
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
      )}

      {/* Sepete ekle butonu */}
      {activeOutOfStock ? (
        <div className="w-full bg-gray-200 text-gray-500 font-bold py-4 rounded-2xl text-center text-base">
          Stokta Yok
        </div>
      ) : (
        <>
          {/* Miktar seçici */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Adet</label>
            <div className="flex items-center border border-gray-200 rounded-xl w-fit overflow-hidden">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition text-xl font-medium"
              >
                −
              </button>
              <span className="w-12 text-center font-semibold text-gray-900 text-lg select-none">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(activeStock, q + 1))}
                className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition text-xl font-medium"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={addToCart}
            disabled={loading || (hasVariations && !selectedVariation)}
            className="w-full bg-primary-600 hover:bg-primary-700 active:scale-[0.98] disabled:opacity-60
              text-white font-bold py-4 rounded-2xl transition text-base flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {loading ? 'Ekleniyor...' : hasVariations && !selectedVariation ? 'Seçenek Seçin' : 'Sepete Ekle'}
          </button>
        </>
      )}
    </div>
  )
}
