'use client'

import { useState, useEffect } from 'react'

interface PaymentSettings {
  payment_provider: string
  payment_api_key: string
  payment_secret_key: string
  payment_merchant_id: string
  payment_mode: string
  payment_enabled: string
  payment_callback_url: string
}

const PROVIDERS = [
  {
    id: 'halkbank',
    name: 'Halkbank Sanal POS',
    logo: '🏛️',
    desc: 'Halkbank 3D Secure Sanal POS entegrasyonu. Mağaza ID, Kullanıcı Adı ve 3D Store Key ile çalışır.',
    fields: [
      { key: 'payment_merchant_id', label: 'Mağaza ID (Client ID)', placeholder: '100000000', type: 'text' },
      { key: 'payment_api_key', label: 'Kullanıcı Adı', placeholder: 'HBAPI', type: 'text' },
      { key: 'payment_secret_key', label: '3D Store Key', placeholder: '3D güvenlik anahtarınız', type: 'password' },
    ],
    docsUrl: 'https://spos.halkbank.com.tr',
    modes: true,
  },
  {
    id: 'iyzico',
    name: 'iyzico',
    logo: '💳',
    desc: "Türkiye'nin en popüler ödeme altyapısı. API Key ve Secret Key ile çalışır.",
    fields: [
      { key: 'payment_api_key', label: 'API Key', placeholder: 'sandbox-xxxxx', type: 'text' },
      { key: 'payment_secret_key', label: 'Secret Key', placeholder: 'sandbox-xxxxx', type: 'password' },
    ],
    docsUrl: 'https://dev.iyzipay.com/',
    modes: true,
  },
  {
    id: 'paytr',
    name: 'PayTR',
    logo: '🏦',
    desc: 'Türk bankaları ile entegre ödeme sistemi.',
    fields: [
      { key: 'payment_merchant_id', label: 'Mağaza ID (Merchant ID)', placeholder: '123456', type: 'text' },
      { key: 'payment_api_key', label: 'Mağaza Parolası (API Key)', placeholder: 'xxxxxx', type: 'text' },
      { key: 'payment_secret_key', label: 'Mağaza Salt (Secret Key)', placeholder: 'xxxxxx', type: 'password' },
    ],
    docsUrl: 'https://dev.paytr.com/',
    modes: false,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    logo: '🌍',
    desc: 'Uluslararası ödeme altyapısı. Publishable Key ve Secret Key ile çalışır.',
    fields: [
      { key: 'payment_api_key', label: 'Publishable Key', placeholder: 'pk_test_...', type: 'text' },
      { key: 'payment_secret_key', label: 'Secret Key', placeholder: 'sk_test_...', type: 'password' },
    ],
    docsUrl: 'https://stripe.com/docs',
    modes: true,
  },
]

const defaults: PaymentSettings = {
  payment_provider: '',
  payment_api_key: '',
  payment_secret_key: '',
  payment_merchant_id: '',
  payment_mode: 'sandbox',
  payment_enabled: '0',
  payment_callback_url: '',
}

export default function OdemeApiPage() {
  const [settings, setSettings] = useState<PaymentSettings>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [siteUrl, setSiteUrl] = useState('')

  useEffect(() => {
    setSiteUrl(window.location.origin)
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setSettings({ ...defaults, ...Object.fromEntries(Object.keys(defaults).map(k => [k, data[k] ?? defaults[k as keyof PaymentSettings]])) })
        setLoading(false)
      })
  }, [])

  const set = (key: keyof PaymentSettings, val: string) => setSettings(s => ({ ...s, [key]: val }))

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...settings,
        payment_callback_url: `${siteUrl}/api/payment/callback`,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const selectedProvider = PROVIDERS.find(p => p.id === settings.payment_provider)
  const isConfigured = settings.payment_api_key && settings.payment_secret_key && settings.payment_provider

  if (loading) return <div className="p-6 text-center text-gray-400">Yükleniyor...</div>

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ödeme API Entegrasyonu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kredi kartı ödeme altyapısı bilgilerini girin</p>
        </div>
        <button onClick={save} disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      {/* Durum göstergesi */}
      <div className={`rounded-2xl p-4 mb-5 flex items-center gap-3 ${isConfigured && settings.payment_enabled === '1' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isConfigured && settings.payment_enabled === '1' ? 'bg-green-500' : 'bg-amber-400'}`} />
        <div>
          <p className={`text-sm font-semibold ${isConfigured && settings.payment_enabled === '1' ? 'text-green-800' : 'text-amber-800'}`}>
            {isConfigured && settings.payment_enabled === '1'
              ? `${selectedProvider?.name || 'Ödeme'} entegrasyonu aktif — Checkout'ta kredi kartı seçeneği görünüyor`
              : !settings.payment_provider
              ? 'Ödeme sağlayıcısı seçilmedi'
              : !isConfigured
              ? 'API bilgileri eksik — Kredi kartı ödeme devre dışı'
              : 'Entegrasyon devre dışı — Aktifleştirmek için aşağıdaki ayarı açın'}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Sağlayıcı Seçimi */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Ödeme Sağlayıcısı Seçin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => set('payment_provider', p.id)}
                className={`border-2 rounded-xl p-4 text-left transition ${settings.payment_provider === p.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="text-2xl mb-2">{p.logo}</div>
                <div className="font-semibold text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* API Bilgileri */}
        {selectedProvider && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">{selectedProvider.name} API Bilgileri</h2>
              <a href={selectedProvider.docsUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                Dokümantasyon ↗
              </a>
            </div>

            {selectedProvider.fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.type === 'password' && !showSecret ? 'password' : 'text'}
                    value={(settings as any)[field.key] || ''}
                    onChange={e => set(field.key as keyof PaymentSettings, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono pr-10"
                    autoComplete="off"
                  />
                  {field.type === 'password' && (
                    <button type="button" onClick={() => setShowSecret(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showSecret
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                        }
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Mod Seçimi */}
            {selectedProvider.modes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ortam</label>
                <div className="flex gap-3">
                  {['sandbox', 'live'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => set('payment_mode', mode)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${settings.payment_mode === mode ? (mode === 'live' ? 'border-green-500 bg-green-50 text-green-700' : 'border-amber-500 bg-amber-50 text-amber-700') : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      {mode === 'sandbox' ? '🧪 Test (Sandbox)' : '🚀 Canlı (Production)'}
                    </button>
                  ))}
                </div>
                {settings.payment_mode === 'sandbox' && (
                  <p className="text-xs text-amber-600 mt-1.5">Test modunda gerçek ödeme alınmaz. Canlıya geçmeden önce testleri tamamlayın.</p>
                )}
                {settings.payment_mode === 'live' && (
                  <p className="text-xs text-green-600 mt-1.5">Canlı modda gerçek ödeme işlemleri yapılır. Canlı API anahtarlarını kullandığınızdan emin olun.</p>
                )}
              </div>
            )}

            {/* Callback URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Callback URL (Ödeme sağlayıcı paneline girin)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 font-mono break-all">
                  {siteUrl}/api/payment/callback
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${siteUrl}/api/payment/callback`)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2.5 rounded-xl transition whitespace-nowrap"
                >
                  Kopyala
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Bu URL'yi {selectedProvider.name} panelinizdeki callback/webhook alanına girin</p>
            </div>
          </div>
        )}

        {/* Aktif/Pasif */}
        {selectedProvider && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Kredi Kartı Ödemeyi Aktifleştir</h3>
                <p className="text-xs text-gray-400 mt-0.5">Açıldığında checkout sayfasında kredi kartı seçeneği görünür</p>
              </div>
              <div
                className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 relative ${settings.payment_enabled === '1' ? 'bg-primary-500' : 'bg-gray-200'}`}
                onClick={() => set('payment_enabled', settings.payment_enabled === '1' ? '0' : '1')}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.payment_enabled === '1' ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </div>
          </div>
        )}

        {/* Güvenlik notu */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">Güvenlik Notu</p>
            <p className="text-xs text-blue-600">API bilgileriniz veritabanında şifrelenmiş olarak saklanır. Secret Key bilginizi kimseyle paylaşmayın.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
