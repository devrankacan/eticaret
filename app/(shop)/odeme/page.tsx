'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/components/providers'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    stock: number
    images: { imagePath: string }[]
  }
}

export default function OdemePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { refreshCart } = useCart()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [discount, setDiscount] = useState(0)

  const [form, setForm] = useState({
    shippingName: (session?.user?.name) || '',
    shippingPhone: '',
    shippingCity: '',
    shippingDistrict: '',
    shippingAddress: '',
    shippingPostalCode: '',
    paymentMethod: 'bank_transfer',
    customerNote: '',
  })
  const [paymentEnabled, setPaymentEnabled] = useState(false)
  const [paymentProvider, setPaymentProvider] = useState('')
  const [iyzicoCfContent, setIyzicoCfContent] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  const fetchCart = useCallback(async () => {
    const res = await fetch('/api/cart')
    const data = await res.json()
    const cartItems = data.items || []
    if (cartItems.length === 0) {
      router.push('/sepet')
      return
    }
    setItems(cartItems)
    setLoading(false)
  }, [router])

  useEffect(() => { fetchCart() }, [fetchCart])

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setPaymentEnabled(data.payment_enabled === '1')
        setPaymentProvider(data.payment_provider || '')
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (session?.user?.name) {
      setForm(f => ({ ...f, shippingName: f.shippingName || session!.user!.name || '' }))
    }
  }, [session])

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
      setCouponError(data.error || 'Geçersiz kupon')
      setDiscount(0)
    } else {
      setDiscount(data.discount)
    }
    setCouponLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, couponCode: discount > 0 ? couponCode : undefined }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Sipariş oluşturulamadı')
      setSubmitting(false)
      return
    }

    await refreshCart()

    // Kredi kartı seçildiyse ödeme sayfasına yönlendir
    if (form.paymentMethod === 'credit_card' && paymentEnabled) {
      setCreatedOrderId(data.orderId)
      setPaymentLoading(true)
      setSubmitting(false)
      const payRes = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderId }),
      })
      const payData = await payRes.json()
      setPaymentLoading(false)

      if (!payRes.ok) {
        setError(payData.error || 'Ödeme başlatılamadı')
        return
      }

      if (payData.provider === 'iyzico' && payData.checkoutFormContent) {
        setIyzicoCfContent(payData.checkoutFormContent)
        return
      }
      if (payData.redirectUrl) {
        window.location.href = payData.redirectUrl
        return
      }
    }

    router.push(\`/siparis-basarili?no=\${data.orderNumber}\`)
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shippingCost = subtotal >= 500 ? 0 : 39.9
  const total = subtotal + shippingCost - discount

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link href="/" className="hover:text-primary-600 transition">Ana Sayfa</Link>
        <span>/</span>
        <Link href="/sepet" className="hover:text-primary-600 transition">Sepetim</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Ödeme</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900 mb-5">Sipariş Tamamla</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sol - Teslimat + Ödeme */}
          <div className="lg:col-span-2 space-y-4">
            {/* Teslimat Bilgileri */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Teslimat Bilgileri</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">Ad Soyad *</label>
                  <input
                    required
                    value={form.shippingName}
                    onChange={e => setForm({ ...form, shippingName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    placeholder="Ad ve soyadınızı giriniz"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">Telefon *</label>
                  <input
                    required
                    type="tel"
                    value={form.shippingPhone}
                    onChange={e => setForm({ ...form, shippingPhone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    placeholder="05XX XXX XX XX"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">Posta Kodu</label>
                  <input
                    value={form.shippingPostalCode}
                    onChange={e => setForm({ ...form, shippingPostalCode: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    placeholder="34000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">İl *</label>
                  <input
                    required
                    value={form.shippingCity}
                    onChange={e => setForm({ ...form, shippingCity: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    placeholder="İstanbul"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">İlçe *</label>
                  <input
                    required
                    value={form.shippingDistrict}
                    onChange={e => setForm({ ...form, shippingDistrict: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    placeholder="Kadıköy"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">Adres *</label>
                  <textarea
                    required
                    value={form.shippingAddress}
                    onChange={e => setForm({ ...form, shippingAddress: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
                    placeholder="Mahalle, sokak, bina no, daire no..."
                  />
                </div>
              </div>
            </div>

            {/* Ödeme Yöntemi */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Ödeme Yöntemi</h2>
              <div className="space-y-3">
                {[
                  { value: 'bank_transfer', label: 'Havale / EFT', desc: 'Banka hesabımıza havale yaparak ödeme yapın', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                  { value: 'cash_on_delivery', label: 'Kapıda Ödeme', desc: 'Teslimat sırasında nakit veya kart ile ödeyin', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                      form.paymentMethod === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.value}
                      checked={form.paymentMethod === opt.value}
                      onChange={() => setForm({ ...form, paymentMethod: opt.value })}
                      className="mt-0.5 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} />
                        </svg>
                        <span className="font-semibold text-gray-800 text-sm">{opt.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {form.paymentMethod === 'bank_transfer' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-semibold text-blue-800 mb-2">Havale Bilgileri</p>
                  <p className="text-xs text-blue-700">Siparişiniz onaylandıktan sonra banka bilgileri e-posta ile gönderilecektir. Açıklama kısmına sipariş numaranızı yazmayı unutmayın.</p>
                </div>
              )}
            </div>

            {/* Not */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-3">Sipariş Notu <span className="text-gray-400 font-normal text-sm">(isteğe bağlı)</span></h2>
              <textarea
                value={form.customerNote}
                onChange={e => setForm({ ...form, customerNote: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
                placeholder="Sipariş ile ilgili özel notunuz varsa yazabilirsiniz..."
              />
            </div>
          </div>

          {/* Sağ - Özet */}
          <div className="space-y-4">
            {/* Ürünler */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Sepet ({items.length})</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map(item => {
                  const img = item.product.images[0]
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      {img ? (
                        <Image
                          src={img.imagePath.startsWith('http') ? img.imagePath : `/${img.imagePath}`}
                          alt={item.product.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-gray-400">{item.quantity} adet</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-800 flex-shrink-0">
                        {(item.product.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

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
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-xl text-sm transition disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Uygula'}
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
              {discount > 0 && (
                <p className="text-green-600 text-xs mt-1 font-medium">
                  -{discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL indirim!
                </p>
              )}
            </div>

            {/* Fiyat özeti */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
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
                <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-3">
                  <span>Toplam</span>
                  <span>{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                </div>
              </div>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition"
              >
                {submitting ? 'İşleniyor...' : 'Siparişi Onayla'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                Siparişi onaylayarak{' '}
                <Link href="/hakkimizda" className="text-primary-600 hover:underline">kullanım şartlarını</Link>{' '}
                kabul etmiş olursunuz.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
