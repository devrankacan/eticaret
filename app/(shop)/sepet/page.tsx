'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/providers'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    comparePrice?: number
    stock: number
    hasVariations: boolean
    images: { imagePath: string; altText?: string }[]
  }
  variation?: {
    id: string
    name: string
    price: number
    comparePrice?: number
    stock: number
  } | null
}

export default function SepetPage() {
  const { refreshCart } = useCart()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [discount, setDiscount] = useState(0)

  const fetchCart = useCallback(async () => {
    const res = await fetch('/api/cart')
    const data = await res.json()
    setItems(data.items || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  async function updateQty(id: string, quantity: number) {
    if (quantity < 1) return removeItem(id)
    setUpdating(id)
    await fetch(`/api/cart/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
    await fetchCart()
    await refreshCart()
    setUpdating(null)
  }

  async function removeItem(id: string) {
    setUpdating(id)
    await fetch(`/api/cart/${id}`, { method: 'DELETE' })
    await fetchCart()
    await refreshCart()
    setUpdating(null)
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, subtotal }),
    })
    const data = await res.json()
    if (!res.ok) {
      setCouponError(data.error || 'Geçersiz kupon kodu')
      setDiscount(0)
    } else {
      setDiscount(data.discount)
    }
    setCouponLoading(false)
  }

  const getItemPrice = (item: CartItem) => item.variation ? item.variation.price : item.product.price
  const subtotal = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)
  const shippingCost = subtotal >= 500 ? 0 : 250
  const total = subtotal - discount + shippingCost

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
        Sepet yükleniyor...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sepetiniz boş</h2>
        <p className="text-gray-400 mb-6">Ürünleri keşfetmek için alışverişe başlayın.</p>
        <Link href="/urunler"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition">
          Alışverişe Başla
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link href="/" className="hover:text-primary-600 transition">Ana Sayfa</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Sepetim</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900 mb-5">Sepetim ({items.length} ürün)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Ürün listesi */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => {
            const img = item.product.images[0]
            const isUpdating = updating === item.id
            return (
              <div key={item.id} className={`bg-white rounded-2xl shadow-sm p-4 flex gap-4 transition ${isUpdating ? 'opacity-50' : ''}`}>
                {img ? (
                  <Image
                    src={img.imagePath.startsWith('http') ? img.imagePath : `/${img.imagePath}`}
                    alt={img.altText || item.product.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <Link href={`/urunler/${item.product.slug}`}
                    className="text-gray-800 font-medium text-sm hover:text-primary-600 transition line-clamp-2">
                    {item.product.name}
                  </Link>
                  {item.variation && (
                    <span className="inline-block mt-0.5 text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-md">
                      {item.variation.name}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-primary-700 font-bold">
                      {getItemPrice(item).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </span>
                    {(item.variation?.comparePrice || item.product.comparePrice) && (
                      <span className="text-gray-400 line-through text-xs">
                        {(item.variation?.comparePrice ?? item.product.comparePrice)!.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded-xl">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-gray-500 hover:text-primary-600 transition disabled:opacity-40"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="px-3 text-sm font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        disabled={isUpdating || item.quantity >= item.product.stock}
                        className="px-3 py-1.5 text-gray-500 hover:text-primary-600 transition disabled:opacity-40"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">
                        {(item.product.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={isUpdating}
                        className="text-gray-300 hover:text-red-500 transition disabled:opacity-40"
                        title="Sil"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          <Link href="/urunler" className="flex items-center gap-2 text-primary-600 text-sm hover:underline mt-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Alışverişe Devam Et
          </Link>
        </div>

        {/* Sipariş özeti */}
        <div className="space-y-4">
          {/* Kupon */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Kupon Kodu</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); if (!e.target.value) setDiscount(0) }}
                placeholder="Kupon kodunu girin"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={applyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm transition disabled:opacity-50"
              >
                {couponLoading ? '...' : 'Uygula'}
              </button>
            </div>
            {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
            {discount > 0 && (
              <p className="text-green-600 text-xs mt-1 font-medium">
                -{discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL indirim uygulandı!
              </p>
            )}
          </div>

          {/* Özet */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Sipariş Özeti</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Ara Toplam</span>
                <span>{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>İndirim</span>
                  <span>-{discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Kargo</span>
                <span>{shippingCost > 0 ? `${shippingCost.toFixed(2)} TL` : 'Ücretsiz'}</span>
              </div>
              {shippingCost > 0 && (
                <p className="text-xs text-primary-600">
                  {(500 - subtotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL daha ekleyin, kargo ücretsiz!
                </p>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-3 mt-1">
                <span>Toplam</span>
                <span>{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
            </div>

            <Link
              href="/odeme"
              className="mt-5 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              Siparişi Tamamla
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Güvenlik */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Güvenli ödeme' },
              { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'Havale & Kapıda ödeme' },
              { icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', label: 'Kolay iade garantisi' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
