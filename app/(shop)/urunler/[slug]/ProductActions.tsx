'use client'

import { useState } from 'react'
import { useCart, useToast } from '@/components/providers'

interface Props {
  productId: string
  productName: string
  maxStock: number
  isOutOfStock: boolean
}

export function ProductActions({ productId, productName, maxStock, isOutOfStock }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const { refreshCart } = useCart()
  const { addToast } = useToast()

  async function addToCart() {
    if (isOutOfStock || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      })
      if (res.ok) {
        addToast(`"${productName}" sepete eklendi!`)
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

  if (isOutOfStock) {
    return (
      <div className="mt-5 w-full bg-gray-200 text-gray-500 font-bold py-4 rounded-2xl text-center text-base">
        Stokta Yok
      </div>
    )
  }

  return (
    <div className="mt-5 space-y-3">
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
            onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
            className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition text-xl font-medium"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={addToCart}
        disabled={loading}
        className="w-full bg-primary-600 hover:bg-primary-700 active:scale-[0.98] disabled:opacity-60
          text-white font-bold py-4 rounded-2xl transition text-base flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {loading ? 'Ekleniyor...' : 'Sepete Ekle'}
      </button>
    </div>
  )
}
