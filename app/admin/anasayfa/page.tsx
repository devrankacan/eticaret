'use client'

import { useState, useEffect } from 'react'

interface Settings {
  homepage_featured_title: string
  homepage_featured_visible: string
  homepage_categories_visible: string
  homepage_instagram_visible: string
  homepage_hero_enabled: string
  homepage_hero_title: string
  homepage_hero_subtitle: string
  homepage_hero_button_text: string
  homepage_hero_button_href: string
  homepage_hero_bg_color: string
}

const defaults: Settings = {
  homepage_featured_title: 'Öne Çıkan Ürünler',
  homepage_featured_visible: '1',
  homepage_categories_visible: '1',
  homepage_instagram_visible: '1',
  homepage_hero_enabled: '0',
  homepage_hero_title: 'Hoş Geldiniz',
  homepage_hero_subtitle: 'En kaliteli ürünler kapınıza kadar',
  homepage_hero_button_text: 'Alışverişe Başla',
  homepage_hero_button_href: '/urunler',
  homepage_hero_bg_color: '#3d1f08',
}

export default function AnasayfaAyarlariPage() {
  const [settings, setSettings] = useState<Settings>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setSettings({ ...defaults, ...Object.fromEntries(Object.keys(defaults).map(k => [k, data[k] ?? (defaults as any)[k]])) })
        setLoading(false)
      })
  }, [])

  const set = (key: keyof Settings, value: string) => setSettings(s => ({ ...s, [key]: value }))
  const toggle = (key: keyof Settings) => setSettings(s => ({ ...s, [key]: s[key] === '1' ? '0' : '1' }))

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="p-6 text-center text-gray-400">Yükleniyor...</div>

  const Toggle = ({ k, label }: { k: keyof Settings; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${settings[k] === '1' ? 'bg-primary-500' : 'bg-gray-200'}`}
        onClick={() => toggle(k)}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings[k] === '1' ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Anasayfa Düzeni</h1>
          <p className="text-sm text-gray-500 mt-0.5">Anasayfa bölümlerini ve içerikleri yönet</p>
        </div>
        <button onClick={save} disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      <div className="space-y-5">
        {/* Hero Banner */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Hero Banner (Tam Genişlik)</h2>
            <Toggle k="homepage_hero_enabled" label={settings.homepage_hero_enabled === '1' ? 'Açık' : 'Kapalı'} />
          </div>
          {settings.homepage_hero_enabled === '1' && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Başlık</label>
                <input type="text" value={settings.homepage_hero_title}
                  onChange={e => set('homepage_hero_title', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Alt Başlık</label>
                <input type="text" value={settings.homepage_hero_subtitle}
                  onChange={e => set('homepage_hero_subtitle', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Buton Metni</label>
                  <input type="text" value={settings.homepage_hero_button_text}
                    onChange={e => set('homepage_hero_button_text', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Buton Linki</label>
                  <input type="text" value={settings.homepage_hero_button_href}
                    onChange={e => set('homepage_hero_button_href', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Arka Plan Rengi</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.homepage_hero_bg_color}
                    onChange={e => set('homepage_hero_bg_color', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  <input type="text" value={settings.homepage_hero_bg_color}
                    onChange={e => set('homepage_hero_bg_color', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono" />
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400">Not: Slider bannerlar ayrıca Bannerlar menüsünden yönetilir</p>
        </div>

        {/* Bölüm Görünürlükleri */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Bölüm Görünürlükleri</h2>
          <Toggle k="homepage_categories_visible" label="Kategori kartları bölümü" />
          <Toggle k="homepage_featured_visible" label="Öne Çıkan Ürünler bölümü" />
          <Toggle k="homepage_instagram_visible" label="Instagram feed bölümü" />
        </div>

        {/* Başlık Metinleri */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Bölüm Başlıkları</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Öne Çıkan Ürünler Başlığı</label>
            <input type="text" value={settings.homepage_featured_title}
              onChange={e => set('homepage_featured_title', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="Öne Çıkan Ürünler" />
          </div>
        </div>
      </div>
    </div>
  )
}
