'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface Settings {
  site_name: string
  site_logo: string
  site_phone: string
  site_email: string
  site_whatsapp: string
  site_address: string
  about_text: string
  social_instagram: string
  social_facebook: string
  social_youtube: string
  seo_title: string
  seo_description: string
  free_shipping_threshold: string
  min_order_amount: string
  instagram_username: string
  instagram_embed_code: string
}

const defaults: Settings = {
  site_name: '',
  site_logo: '',
  site_phone: '',
  site_email: '',
  site_whatsapp: '',
  site_address: '',
  about_text: '',
  social_instagram: '',
  social_facebook: '',
  social_youtube: '',
  seo_title: '',
  seo_description: '',
  free_shipping_threshold: '',
  min_order_amount: '',
  instagram_username: '',
  instagram_embed_code: '',
}

export default function AyarlarPage() {
  const [settings, setSettings] = useState<Settings>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo dosyası 2MB\'den küçük olmalıdır.')
      return
    }
    setLogoUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      set('site_logo', ev.target?.result as string)
      setLogoUploading(false)
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => { setSettings({ ...defaults, ...data }); setLoading(false) })
  }, [])

  const set = (key: keyof Settings, value: string) => setSettings(s => ({ ...s, [key]: value }))

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="p-6 text-center text-gray-400">Yükleniyor...</div>

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Site Ayarları</h1>
        <button onClick={save} disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center gap-2">
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      <div className="space-y-5">
        {/* Genel */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Genel Bilgiler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Site Adı</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={settings.site_name} onChange={e => set('site_name', e.target.value)} placeholder="Mağazanızın adı" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Logo</label>
              <div className="flex items-start gap-4">
                {/* Önizleme */}
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="relative flex-shrink-0 w-36 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition overflow-hidden"
                >
                  {logoUploading ? (
                    <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : settings.site_logo ? (
                    <Image src={settings.site_logo} alt="logo" fill className="object-contain p-2" unoptimized sizes="144px" />
                  ) : (
                    <>
                      <svg className="w-7 h-7 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-400">Logo seç</span>
                    </>
                  )}
                </div>

                {/* Sağ taraf: butonlar + açıklama */}
                <div className="flex-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full border border-gray-300 hover:border-primary-400 text-gray-700 hover:text-primary-700 bg-white rounded-xl px-3 py-2 text-sm font-medium transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Görsel Yükle
                  </button>
                  {settings.site_logo && (
                    <button
                      type="button"
                      onClick={() => set('site_logo', '')}
                      className="w-full border border-red-200 hover:border-red-400 text-red-500 bg-white rounded-xl px-3 py-2 text-sm font-medium transition"
                    >
                      Logoyu Kaldır
                    </button>
                  )}
                  <p className="text-xs text-gray-400">PNG, JPG veya SVG. Maks. 2MB.</p>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Telefon</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={settings.site_phone} onChange={e => set('site_phone', e.target.value)} placeholder="0555 123 45 67" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">WhatsApp</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={settings.site_whatsapp} onChange={e => set('site_whatsapp', e.target.value)} placeholder="905551234567 (başında + olmadan)" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">E-posta</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={settings.site_email} onChange={e => set('site_email', e.target.value)} placeholder="info@site.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Adres</label>
              <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" value={settings.site_address} onChange={e => set('site_address', e.target.value)} placeholder="Tam adres" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Hakkımızda Metni</label>
              <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" value={settings.about_text} onChange={e => set('about_text', e.target.value)} placeholder="Firma hakkında kısa tanıtım metni..." />
            </div>
          </div>
        </div>

        {/* Kargo & Sipariş */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Kargo & Sipariş</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Ücretsiz Kargo Limiti (₺)</label>
              <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={settings.free_shipping_threshold} onChange={e => set('free_shipping_threshold', e.target.value)} placeholder="500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Min. Sipariş Tutarı (₺)</label>
              <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={settings.min_order_amount} onChange={e => set('min_order_amount', e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>

        {/* Sosyal Medya */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Sosyal Medya</h2>
          <div className="space-y-3">
            {[
              { key: 'social_instagram' as const, label: 'Instagram', ph: 'https://instagram.com/...' },
              { key: 'social_facebook' as const, label: 'Facebook', ph: 'https://facebook.com/...' },
              { key: 'social_youtube' as const, label: 'YouTube', ph: 'https://youtube.com/...' },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={settings[key]} onChange={e => set(key, e.target.value)} placeholder={ph} />
              </div>
            ))}
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">SEO</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Site Başlığı (Title)</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={settings.seo_title} onChange={e => set('seo_title', e.target.value)} placeholder="Ana sayfa başlığı" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Meta Açıklama</label>
              <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" value={settings.seo_description} onChange={e => set('seo_description', e.target.value)} placeholder="Arama motorları için açıklama (max 160 karakter)" />
            </div>
          </div>
        </div>

        {/* Instagram */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">Instagram Feed</h2>

          {/* Kurulum rehberi */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-800 space-y-1">
            <p className="font-semibold">LightWidget ile otomatik feed kurulumu:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700">
              <li><a href="https://lightwidget.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">lightwidget.com</a> adresine gidin ve ücretsiz hesap açın</li>
              <li>Instagram hesabınızı bağlayın</li>
              <li>Widget tasarımını seçin (Grid / 2 sütun önerilir)</li>
              <li>&ldquo;Get Code&rdquo; butonuna tıklayın → iframe kodunu kopyalayın</li>
              <li>Aşağıdaki alana yapıştırın ve Kaydet&rsquo;e basın</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Instagram Kullanıcı Adı <span className="text-gray-400 font-normal">(Takip Et butonu için)</span></label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-300">
                <span className="px-3 text-gray-400 text-sm bg-gray-50 border-r border-gray-200 py-2.5">@</span>
                <input
                  className="flex-1 px-3 py-2.5 text-sm outline-none"
                  value={settings.instagram_username}
                  onChange={e => set('instagram_username', e.target.value)}
                  placeholder="atesoglusut"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">LightWidget Embed Kodu</label>
              <textarea
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                value={settings.instagram_embed_code}
                onChange={e => set('instagram_embed_code', e.target.value)}
                placeholder={'<iframe src="//lightwidget.com/widgets/XXXXX.html" scrolling="no" allowtransparency="true" class="lightwidget-widget" style="width:100%;overflow:hidden;height:500px;"></iframe>'}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button onClick={save} disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition disabled:opacity-50">
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi!' : 'Ayarları Kaydet'}
        </button>
      </div>
    </div>
  )
}
