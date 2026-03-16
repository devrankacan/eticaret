'use client'

import { useState, useEffect } from 'react'

interface NavItem { label: string; href: string }

export default function HeaderAyarlariPage() {
  const [announcementText, setAnnouncementText] = useState('')
  const [announcementEnabled, setAnnouncementEnabled] = useState(true)
  const [freeShippingText, setFreeShippingText] = useState('')
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('')
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setAnnouncementText(data.announcement_text || 'Aynı Gün İçerisinde Kargoların Gönderimi Yapılmaktadır.')
        setAnnouncementEnabled(data.announcement_enabled !== '0')
        setFreeShippingText(data.free_shipping_text || 'Ücretsiz Kargo')
        setFreeShippingThreshold(data.free_shipping_threshold || '3500')
        try {
          const items = JSON.parse(data.nav_extra_items || '[]')
          setNavItems(Array.isArray(items) ? items : [])
        } catch { setNavItems([]) }
        setLoading(false)
      })
  }, [])

  const addNavItem = () => setNavItems(prev => [...prev, { label: '', href: '' }])
  const removeNavItem = (i: number) => setNavItems(prev => prev.filter((_, idx) => idx !== i))
  const updateNavItem = (i: number, key: keyof NavItem, value: string) => {
    setNavItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item))
  }

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        announcement_text: announcementText,
        announcement_enabled: announcementEnabled ? '1' : '0',
        free_shipping_text: freeShippingText,
        free_shipping_threshold: freeShippingThreshold,
        nav_extra_items: JSON.stringify(navItems.filter(n => n.label && n.href)),
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="p-6 text-center text-gray-400">Yükleniyor...</div>

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Header Ayarları</h1>
          <p className="text-sm text-gray-500 mt-0.5">Üst bant, navigasyon ve ücretsiz kargo bilgisi</p>
        </div>
        <button onClick={save} disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      <div className="space-y-5">
        {/* Duyuru Bandı */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Duyuru Bandı (Üst Kırmızı Şerit)</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-5 rounded-full transition-colors ${announcementEnabled ? 'bg-primary-500' : 'bg-gray-200'} flex-shrink-0 relative`}
              onClick={() => setAnnouncementEnabled(v => !v)}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${announcementEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-700">{announcementEnabled ? 'Görünür' : 'Gizli'}</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duyuru Metni</label>
            <input
              type="text"
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="Aynı Gün Kargo..."
            />
            <p className="text-xs text-gray-400 mt-1">Sitenin en üstündeki koyu renk şeritte gösterilir</p>
          </div>
        </div>

        {/* Ücretsiz Kargo */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Ücretsiz Kargo Bilgisi</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
            <input
              type="text"
              value={freeShippingText}
              onChange={e => setFreeShippingText(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="Ücretsiz Kargo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Tutar (TL)</label>
            <input
              type="number"
              value={freeShippingThreshold}
              onChange={e => setFreeShippingThreshold(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="500"
            />
            <p className="text-xs text-gray-400 mt-1">Header'da "500 TL ve Üzeri Alışverişlerde" şeklinde gösterilir</p>
          </div>
        </div>

        {/* Ekstra Nav Linkleri */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Ekstra Menü Linkleri</h2>
              <p className="text-xs text-gray-400 mt-0.5">Anasayfa, Kategoriler ve İletişim'e ek olarak gösterilecek linkler</p>
            </div>
            <button onClick={addNavItem}
              className="text-sm bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Link Ekle
            </button>
          </div>

          {navItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Henüz ekstra link eklenmedi</p>
          ) : (
            <div className="space-y-3">
              {navItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => updateNavItem(i, 'label', e.target.value)}
                    placeholder="Menü adı"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  <input
                    type="text"
                    value={item.href}
                    onChange={e => updateNavItem(i, 'href', e.target.value)}
                    placeholder="/link-adresi"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono"
                  />
                  <button onClick={() => removeNavItem(i)}
                    className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400">Not: "Menü'de göster" seçili sayfalar da otomatik olarak üst menüye eklenir</p>
        </div>
      </div>
    </div>
  )
}
