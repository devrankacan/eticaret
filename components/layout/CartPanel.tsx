'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/providers'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    discountedPrice: number | null
    images: { imagePath: string }[]
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function CartPanel({ isOpen, onClose }: Props) {
  const { refreshCart } = useCart()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cart')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) fetchCart()
  }, [isOpen, fetchCart])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  async function updateQty(itemId: string, quantity: number) {
    await fetch(`/api/cart/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
    fetchCart()
    refreshCart()
  }

  async function removeItem(itemId: string) {
    await fetch(`/api/cart/${itemId}`, { method: 'DELETE' })
    fetchCart()
    refreshCart()
  }

  const total = items.reduce((sum, item) => {
    const price = item.product.discountedPrice ?? item.product.price
    return sum + price * item.quantity
  }, 0)

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-[60]" onClick={onClose} aria-hidden="true" />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-[70] shadow-2xl
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-bold text-lg text-gray-900">Sepetim</span>
            {items.length > 0 && (
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {items.length} ürün
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <svg className="w-8 h-8 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 gap-3 text-gray-400">
              <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-medium">Sepetiniz boş</p>
              <button onClick={onClose} className="text-primary-600 text-sm font-semibold hover:underline">
                Alışverişe Başla
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 px-4 py-2">
              {items.map(item => {
                const price = item.product.discountedPrice ?? item.product.price
                const rawPath = item.product.images[0]?.imagePath
                const imgUrl = rawPath ? (rawPath.startsWith('http') ? rawPath : `/${rawPath}`) : null
                return (
                  <li key={item.id} className="py-4 flex gap-3">
                    {/* Görsel */}
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                      {imgUrl ? (
                        <Image src={imgUrl} alt={item.product.name} fill className="object-cover" sizes="64px" unoptimized />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>

                    {/* Bilgiler */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-primary-600 font-bold text-sm mt-0.5">
                        {(price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </p>
                      {/* Miktar */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => item.quantity > 1 ? updateQty(item.id, item.quantity - 1) : removeItem(item.id)}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary-400 hover:text-primary-600 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary-400 hover:text-primary-600 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Sil */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition self-start"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Alt - Toplam ve buton */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Tahmini Teslimat: <strong>{(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }) })()}</strong></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Toplam</span>
              <span className="text-lg font-bold text-gray-900">
                {total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
            </div>
            <a
              href="/sepet"
              onClick={onClose}
              className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl text-center transition"
            >
              Siparişi Tamamla
            </a>
            <button
              onClick={onClose}
              className="block w-full text-sm text-gray-500 hover:text-gray-700 text-center py-1"
            >
              Alışverişe Devam
            </button>
          </div>
        )}
      </div>
    </>
  )
}
