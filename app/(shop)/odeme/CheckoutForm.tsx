'use client'

import { useState } from 'react'
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
    stock: number
    images: { imagePath: string }[]
  }
}

interface Props {
  items: CartItem[]
  bankInfo: { bank_name: string; bank_iban: string; bank_account_holder: string; bank_branch: string }
  paymentEnabled: boolean
  userName: string
}

export default function CheckoutForm({ items, bankInfo, paymentEnabled, userName }: Props) {
  const { refreshCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [discount, setDiscount] = useState(0)
  const [cardForm, setCardForm] = useState({ holderName: '', ccNo: '', expiryMonth: '', expiryYear: '', cvv: '' })

  const [form, setForm] = useState({
    shippingName: userName,
    shippingPhone: '',
    shippingCity: '',
    shippingDistrict: '',
    shippingAddress: '',
    shippingPostalCode: '',
    paymentMethod: 'bank_transfer',
    customerNote: '',
  })

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shippingCost = subtotal >= 3500 ? 0 : 39.9
  const total = subtotal + shippingCost - discount
  const deliveryDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })
  })()

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

    // Sipariş oluştur
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

    // Havale / Kapıda Ödeme → başarı sayfasına git
    if (form.paymentMethod !== 'credit_card') {
      await refreshCart()
      window.location.href = `/siparis-basarili?no=${data.orderNumber}`
      return
    }

    // Kredi kartı → HalkÖde 3D Secure
    const payRes = await fetch('/api/payment/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: data.orderId,
        ccHolderName: cardForm.holderName,
        ccNo: cardForm.ccNo.replace(/\s/g, ''),
        expiryMonth: cardForm.expiryMonth,
        expiryYear: cardForm.expiryYear,
        cvv: cardForm.cvv,
      }),
    })
    const payData = await payRes.json()

    if (payRes.ok && payData.formHtml) {
      refreshCart()
      document.open()
      document.write(payData.formHtml)
      document.close()
      return
    }

    if (payRes.ok && payData.redirectUrl) {
      await refreshCart()
      window.location.href = payData.redirectUrl
      return
    }

    setError(payData.error || 'Ödeme başlatılamadı. Lütfen tekrar deneyin veya farklı ödeme yöntemi seçin.')
    setSubmitting(false)
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
                  ...(paymentEnabled ? [{ value: 'credit_card', label: 'Kredi / Banka Kartı', desc: 'Visa, Mastercard veya Maestro ile güvenli ödeme yapın' }] : []),
                  { value: 'bank_transfer', label: 'Havale / EFT', desc: 'Banka hesabımıza havale yaparak ödeme yapın' },
                  { value: 'cash_on_delivery', label: 'Kapıda Ödeme', desc: 'Teslimat sırasında nakit veya kart ile ödeyin' },
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
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Kredi Kartı Formu */}
              {form.paymentMethod === 'credit_card' && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Kart Numarası</label>
                    <input
                      type="text" inputMode="numeric" maxLength={19} placeholder="0000 0000 0000 0000"
                      value={cardForm.ccNo}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
                        setCardForm(c => ({ ...c, ccNo: raw.replace(/(.{4})/g, '$1 ').trim() }))
                      }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300"
                      autoComplete="cc-number" required={form.paymentMethod === 'credit_card'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Kart Üzerindeki İsim</label>
                    <input
                      type="text" placeholder="AD SOYAD"
                      value={cardForm.holderName}
                      onChange={e => setCardForm(c => ({ ...c, holderName: e.target.value.toUpperCase() }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      autoComplete="cc-name" required={form.paymentMethod === 'credit_card'}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Son Kullanma (AA/YY)</label>
                      <input
                        type="text" inputMode="numeric" maxLength={5} placeholder="AA/YY"
                        value={cardForm.expiryMonth && cardForm.expiryYear ? `${cardForm.expiryMonth}/${cardForm.expiryYear}` : cardForm.expiryMonth}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setCardForm(c => ({ ...c, expiryMonth: raw.slice(0, 2), expiryYear: raw.slice(2, 4) }))
                        }}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300"
                        autoComplete="cc-exp" required={form.paymentMethod === 'credit_card'}
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                      <input
                        type="password" inputMode="numeric" maxLength={4} placeholder="•••"
                        value={cardForm.cvv}
                        onChange={e => setCardForm(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300"
                        autoComplete="cc-csc" required={form.paymentMethod === 'credit_card'}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                    256-bit SSL ile şifrelenmiş güvenli bağlantı. HalkÖde 3D Secure ile korumalı.
                  </div>
                </div>
              )}

              {/* Havale Bilgileri */}
              {form.paymentMethod === 'bank_transfer' && bankInfo.bank_iban && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-semibold text-blue-800 mb-3">Havale / EFT Bilgileri</p>
                  <div className="space-y-1.5 text-xs text-blue-800">
                    {bankInfo.bank_name && (
                      <div className="flex gap-2">
                        <span className="text-blue-500 w-24 flex-shrink-0">Banka:</span>
                        <span className="font-medium">{bankInfo.bank_name}{bankInfo.bank_branch ? ` - ${bankInfo.bank_branch}` : ''}</span>
                      </div>
                    )}
                    {bankInfo.bank_account_holder && (
                      <div className="flex gap-2">
                        <span className="text-blue-500 w-24 flex-shrink-0">Hesap Adı:</span>
                        <span className="font-medium">{bankInfo.bank_account_holder}</span>
                      </div>
                    )}
                    <div className="flex gap-2 items-center">
                      <span className="text-blue-500 w-24 flex-shrink-0">IBAN:</span>
                      <span className="font-mono font-bold tracking-wide">{bankInfo.bank_iban}</span>
                    </div>
                    <p className="mt-2 text-blue-600 border-t border-blue-200 pt-2">
                      Açıklama kısmına sipariş numaranızı yazmayı unutmayın.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sipariş Notu */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-3">
                Sipariş Notu <span className="text-gray-400 font-normal text-sm">(isteğe bağlı)</span>
              </h2>
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
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Sepet ({items.length} ürün)</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map(item => {
                  const img = item.product.images[0]
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      {img ? (
                        <Image
                          src={img.imagePath.startsWith('http') ? img.imagePath : `/${img.imagePath}`}
                          alt={item.product.name} width={48} height={48}
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
                  type="text" value={couponCode}
                  onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); if (!e.target.value) setDiscount(0) }}
                  placeholder="Kupon kodunu girin"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                />
                <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-xl text-sm transition disabled:opacity-50">
                  {couponLoading ? '...' : 'Uygula'}
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
              {discount > 0 && <p className="text-green-600 text-xs mt-1 font-medium">-{discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL indirim!</p>}
            </div>

            {/* Fiyat Özeti + Sipariş Butonu */}
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

              <div className="mt-3 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2.5">
                Tahmini Teslimat: <strong>{deliveryDate}</strong>
              </div>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={submitting}
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
