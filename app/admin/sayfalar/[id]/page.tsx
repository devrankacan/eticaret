'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface PageForm {
  title: string
  slug: string
  content: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  isActive: boolean
  showInNav: boolean
  navLabel: string
  sortOrder: number
}

const empty: PageForm = {
  title: '', slug: '', content: '', excerpt: '',
  metaTitle: '', metaDescription: '',
  isActive: true, showInNav: false, navLabel: '', sortOrder: 0,
}

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function PageEditorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isNew = id === 'yeni'

  const [form, setForm] = useState<PageForm>(empty)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [autoSlug, setAutoSlug] = useState(isNew)

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/pages/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          excerpt: data.excerpt || '',
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
          isActive: data.isActive ?? true,
          showInNav: data.showInNav ?? false,
          navLabel: data.navLabel || '',
          sortOrder: data.sortOrder ?? 0,
        })
        setLoading(false)
      })
  }, [id, isNew])

  const set = (key: keyof PageForm, value: any) => {
    setForm(f => {
      const updated = { ...f, [key]: value }
      if (key === 'title' && autoSlug) {
        updated.slug = toSlug(value)
      }
      return updated
    })
  }

  const save = async () => {
    if (!form.title.trim()) { setError('Başlık zorunludur'); return }
    if (!form.slug.trim()) { setError('URL (slug) zorunludur'); return }
    setSaving(true)
    setError('')

    const res = await fetch(isNew ? '/api/admin/pages' : `/api/admin/pages/${id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      router.push('/admin/sayfalar')
    } else {
      const d = await res.json()
      setError(d.error || 'Kayıt sırasında hata oluştu')
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-400">Yükleniyor...</div>

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isNew ? 'Yeni Sayfa' : 'Sayfayı Düzenle'}</h1>
          {!isNew && (
            <a href={`/sayfa/${form.slug}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:underline mt-0.5 inline-block">
              ↗ /sayfa/{form.slug}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/admin/sayfalar')}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
            İptal
          </button>
          <button onClick={save} disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : isNew ? 'Oluştur' : 'Kaydet'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sol - Ana içerik */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sayfa Başlığı *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Örn: Hakkımızda"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL (slug) *
                {autoSlug && <span className="text-xs text-gray-400 ml-2">(başlıktan otomatik)</span>}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 whitespace-nowrap">/sayfa/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => { setAutoSlug(false); set('slug', e.target.value) }}
                  placeholder="hakkimizda"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kısa Açıklama (özet)</label>
              <textarea
                value={form.excerpt}
                onChange={e => set('excerpt', e.target.value)}
                rows={2}
                placeholder="Sayfa özeti (isteğe bağlı)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              />
            </div>
          </div>

          {/* İçerik */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Sayfa İçeriği (HTML desteklenir)</label>
              <span className="text-xs text-gray-400">Kalın: &lt;b&gt;, İtalik: &lt;i&gt;, Link: &lt;a href="..."&gt;, Paragraf: &lt;p&gt;</span>
            </div>
            <textarea
              value={form.content}
              onChange={e => set('content', e.target.value)}
              rows={16}
              placeholder="<h2>Biz Kimiz?</h2>&#10;<p>Şirketimiz hakkında bilgi...</p>"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-y font-mono"
            />
          </div>
        </div>

        {/* Sağ - Ayarlar */}
        <div className="space-y-4">
          {/* Yayın durumu */}
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Yayın Ayarları</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-primary-500' : 'bg-gray-200'} flex-shrink-0 relative`}
                onClick={() => set('isActive', !form.isActive)}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-700">{form.isActive ? 'Yayında' : 'Gizli'}</span>
            </label>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sıralama</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => set('sortOrder', parseInt(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>

          {/* Navigasyon */}
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Üst Menü</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-5 rounded-full transition-colors ${form.showInNav ? 'bg-primary-500' : 'bg-gray-200'} flex-shrink-0 relative`}
                onClick={() => set('showInNav', !form.showInNav)}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.showInNav ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-700">Üst menüde göster</span>
            </label>
            {form.showInNav && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Menüde görünen ad (boş = sayfa başlığı)</label>
                <input
                  type="text"
                  value={form.navLabel}
                  onChange={e => set('navLabel', e.target.value)}
                  placeholder={form.title || 'Sayfa Adı'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">SEO Ayarları</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Başlık</label>
              <input
                type="text"
                value={form.metaTitle}
                onChange={e => set('metaTitle', e.target.value)}
                placeholder={form.title}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Açıklama</label>
              <textarea
                value={form.metaDescription}
                onChange={e => set('metaDescription', e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
