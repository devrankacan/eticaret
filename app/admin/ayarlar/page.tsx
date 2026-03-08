'use client'

import { useState, useEffect } from 'react'
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
}

export default function AyarlarPage() {
  const [settings, setSettings] = useState<Settings>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
              <label className="text-sm font-medium text-gray-700 mb-1 block">Logo URL</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={settings.site_logo} onChange={e => set('site_logo', e.target.value)} placeholder="https://..." />
              {settings.site_logo && (
                <div className="mt-2 w-32 h-12 relative bg-gray-800 rounded-lg overflow-hidden">
                  <Image src={settings.site_logo} alt="logo" fill className="object-contain p-1" unoptimized />
                </div>
              )}
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
      </div>

      <div className="mt-5 flex justify-end">
        <button onClick={save} disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition disabled:opacity-50">
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi!' : 'Ayarları Kaydet'}
        </button>
      </div>
    </div>
  )
}
