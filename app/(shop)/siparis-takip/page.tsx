'use client'

import { useState } from 'react'
import Link from 'next/link'

interface TrackingResult {
  orderNumber: string
  status: string
  statusLabel: string
  statusStep: number
  paymentMethod: string
  paymentStatus: string
  city: string
  total: number
  createdAt: string
  shippedAt: string | null
  deliveredAt: string | null
  cargo: {
    company: string
    trackingNumber: string | null
    trackingUrl: string | null
  } | null
}

const STEPS = [
  { label: 'Sipariş Alındı', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Onaylandı', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Hazırlanıyor', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Kargoda', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1' },
  { label: 'Teslim Edildi', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
]

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: 'Havale / EFT',
  cash_on_delivery: 'Kapıda Ödeme',
  credit_card: 'Kredi Kartı',
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function SiparisTakipPage() {
  const [orderNo, setOrderNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [error, setError] = useState('')

  const track = async (e: React.FormEvent) => {
    e.preventDefault()
    const no = orderNo.trim().toUpperCase()
    if (!no) return
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch(`/api/orders/track?no=${encodeURIComponent(no)}`)
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Sipariş bulunamadı')
    } else {
      setResult(data)
    }
  }

  const isCancelled = result?.status === 'cancelled' || result?.status === 'refunded'

  return (
    <div className="min-h-[60vh] bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary-600 transition">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Sipariş Takip</span>
        </nav>

        {/* Başlık */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sipariş Takip</h1>
          <p className="text-gray-500 mt-1">Sipariş numaranızı girerek siparişinizi takip edin</p>
        </div>

        {/* Arama formu */}
        <form onSubmit={track} className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sipariş Numarası</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={orderNo}
              onChange={e => setOrderNo(e.target.value)}
              placeholder="Örn: SP20260310XXXX"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono uppercase"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !orderNo.trim()}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Sorgula
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Sipariş numaranız, sipariş onay e-postanızda yer almaktadır</p>
        </form>

        {/* Hata */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3 mb-6">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-red-700 text-sm">{error}</p>
              <p className="text-xs text-red-500 mt-1">Sipariş numaranızı kontrol edin veya müşteri hizmetlerimizle iletişime geçin</p>
            </div>
          </div>
        )}

        {/* Sonuç */}
        {result && (
          <div className="space-y-4 animate-fade-in">

            {/* Özet kart */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Sipariş No</p>
                  <p className="font-bold text-gray-900 font-mono text-lg">{result.orderNumber}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                  isCancelled
                    ? 'bg-red-100 text-red-700'
                    : result.status === 'delivered'
                    ? 'bg-green-100 text-green-700'
                    : result.status === 'shipped'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {result.statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">Sipariş Tarihi</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{fmt(result.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Ödeme</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{PAYMENT_LABELS[result.paymentMethod] || result.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Teslimat Şehri</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{result.city}</p>
                </div>
              </div>
            </div>

            {/* İptal/İade durumu */}
            {isCancelled ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                <svg className="w-10 h-10 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold text-red-700 mb-1">
                  {result.status === 'cancelled' ? 'Sipariş İptal Edildi' : 'İade Edildi'}
                </p>
                <p className="text-sm text-red-500">Detaylar için müşteri hizmetlerimizle iletişime geçin</p>
              </div>
            ) : (
              /* İlerleme çubuğu */
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-5">Sipariş Durumu</h3>
                <div className="relative">
                  {/* Bağlantı çizgisi */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 hidden sm:block" />
                  <div
                    className="absolute top-5 left-5 h-0.5 bg-primary-500 hidden sm:block transition-all duration-700"
                    style={{ width: `calc((100% - 40px) * ${Math.min(result.statusStep, 4)} / 4)` }}
                  />
                  <div className="grid grid-cols-5 gap-1 relative">
                    {STEPS.map((step, i) => {
                      const done = i < result.statusStep
                      const active = i === result.statusStep
                      return (
                        <div key={i} className="flex flex-col items-center text-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                            done ? 'bg-primary-500 text-white' :
                            active ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {done ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.icon} />
                              </svg>
                            )}
                          </div>
                          <p className={`text-[10px] sm:text-xs mt-2 leading-tight font-medium ${active ? 'text-primary-700' : done ? 'text-primary-500' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tarihler */}
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Sipariş oluşturuldu: <b>{fmt(result.createdAt)}</b></span>
                  </div>
                  {result.shippedAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Kargoya verildi: <b>{fmt(result.shippedAt)}</b></span>
                    </div>
                  )}
                  {result.deliveredAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Teslim edildi: <b>{fmt(result.deliveredAt)}</b></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Kargo bilgisi */}
            {result.cargo && !isCancelled && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Kargo Bilgisi
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Kargo Firması</span>
                    <span className="font-semibold text-gray-800">{result.cargo.company}</span>
                  </div>
                  {result.cargo.trackingNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Takip No</span>
                      <span className="font-mono font-semibold text-gray-800">{result.cargo.trackingNumber}</span>
                    </div>
                  )}
                </div>
                {result.cargo.trackingUrl && (
                  <a
                    href={result.cargo.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {result.cargo.company} Sitesinde Takip Et
                  </a>
                )}
              </div>
            )}

            {/* Tekrar sorgula */}
            <button
              onClick={() => { setResult(null); setOrderNo('') }}
              className="w-full text-center text-sm text-gray-400 hover:text-primary-600 transition py-2"
            >
              Başka bir sipariş sorgula →
            </button>
          </div>
        )}

        {/* Yardım notu */}
        {!result && !error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-amber-700">
              <p className="font-semibold mb-1">Sipariş numaranızı nereden bulursunuz?</p>
              <ul className="text-amber-600 space-y-0.5 text-xs">
                <li>• Sipariş onay e-postanızda</li>
                <li>• <Link href="/hesabim/siparisler" className="underline hover:text-amber-800">Hesabım → Siparişlerim</Link> sayfasında</li>
                <li>• SP ile başlayıp tarih ve rakamlarla devam eder (Örn: SP20260310XXXX)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
