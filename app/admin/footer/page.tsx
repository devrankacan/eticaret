'use client'

import { useState, useEffect } from 'react'

interface FooterLink { label: string; href: string }

export default function FooterAyarlariPage() {
  const [description, setDescription] = useState('')
  const [extraLinks, setExtraLinks] = useState<FooterLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setDescription(data.footer_description || '')
        try {
          const links = JSON.parse(data.footer_extra_links || '[]')
          setExtraLinks(Array.isArray(links) ? links : [])
        } catch { setExtraLinks([]) }
        setLoading(false)
      })
  }, [])

  const addLink = () => setExtraLinks(prev => [...prev, { label: '', href: '' }])
  const removeLink = (i: number) => setExtraLinks(prev => prev.filter((_, idx) => idx !== i))
  const updateLink = (i: number, key: keyof FooterLink, value: string) => {
    setExtraLinks(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item))
  }

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        footer_description: description,
        footer_extra_links: JSON.stringify(extraLinks.filter(l => l.label && l.href)),
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
          <h1 className="text-xl font-bold text-gray-900">Footer Ayarları</h1>
          <p className="text-sm text-gray-500 mt-0.5">Alt bölüm açıklama metni ve ekstra linkler</p>
        </div>
        <button onClick={save} disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      <div className="space-y-5">
        {/* Açıklama Metni */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Açıklama Metni</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer Açıklaması</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              placeholder="Kaliteli ürünleri uygun fiyatlarla kapınıza kadar getiriyoruz."
            />
            <p className="text-xs text-gray-400 mt-1">Logo/marka adının altında gösterilir</p>
          </div>
        </div>

        {/* Varsayılan Linkler Bilgisi */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">Varsayılan Hızlı Linkler</p>
          <p className="text-xs text-amber-600">Ana Sayfa, Tüm Ürünler, Sepetim, Sipariş Takip ve Siparişlerim linkleri otomatik olarak gösterilir. Aşağıdan ekstra link ekleyebilirsiniz.</p>
        </div>

        {/* Ekstra Linkler */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Ekstra Footer Linkleri</h2>
              <p className="text-xs text-gray-400 mt-0.5">Hızlı Linkler bölümüne eklenecek ek linkler</p>
            </div>
            <button onClick={addLink}
              className="text-sm bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Link Ekle
            </button>
          </div>

          {extraLinks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Henüz ekstra link eklenmedi</p>
          ) : (
            <div className="space-y-3">
              {extraLinks.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => updateLink(i, 'label', e.target.value)}
                    placeholder="Link adı"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  <input
                    type="text"
                    value={item.href}
                    onChange={e => updateLink(i, 'href', e.target.value)}
                    placeholder="/link-adresi"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono"
                  />
                  <button onClick={() => removeLink(i)}
                    className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kredi Notu */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">Geliştirici Kredisi</p>
          <p className="text-xs text-gray-500">
            Footer altında <span className="font-medium text-[#3d1f08]">Created by Devran Kaçan</span> yazısı sabit olarak gösterilir ve{' '}
            <span className="font-mono text-xs">devrankacan.com</span> adresine yönlendirir.
          </p>
        </div>
      </div>
    </div>
  )
}
