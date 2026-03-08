'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface Banner {
  id: string
  title: string | null
  imageDesktop: string
  imageMobile: string | null
  link: string | null
  sortOrder: number
  isActive: boolean
}

const empty: Omit<Banner, 'id'> = {
  title: '',
  imageDesktop: '',
  imageMobile: '',
  link: '',
  sortOrder: 0,
  isActive: true,
}

export default function BannerlarPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Omit<Banner, 'id'>>(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const fetch_ = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/banners')
    setBanners(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  const openNew = () => { setForm(empty); setEditId(null); setShowForm(true) }
  const openEdit = (b: Banner) => {
    setForm({ title: b.title || '', imageDesktop: b.imageDesktop, imageMobile: b.imageMobile || '', link: b.link || '', sortOrder: b.sortOrder, isActive: b.isActive })
    setEditId(b.id)
    setShowForm(true)
  }

  const save = async () => {
    setSaving(true)
    if (editId) {
      await fetch(`/api/admin/banners/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/admin/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false)
    setShowForm(false)
    fetch_()
  }

  const del = async (id: string) => {
    if (!confirm('Bu banner silinsin mi?')) return
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
    fetch_()
  }

  const toggleActive = async (b: Banner) => {
    await fetch(`/api/admin/banners/${b.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...b, isActive: !b.isActive }),
    })
    fetch_()
  }

  function handleImageFile(field: 'imageDesktop' | 'imageMobile', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert("Görsel 5MB'den küçük olmalıdır."); return }
    const reader = new FileReader()
    reader.onload = ev => {
      setForm(f => ({ ...f, [field]: ev.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Bannerlar</h1>
        <button onClick={openNew} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Banner
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Henüz banner eklenmemiş</div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
              <div className="w-32 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                {b.imageDesktop && (
                  <Image src={b.imageDesktop} alt={b.title || 'banner'} fill className="object-cover" unoptimized />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{b.title || '(Başlıksız)'}</p>
                {b.link && <p className="text-xs text-green-600 truncate">→ {b.link}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(b)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${b.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {b.isActive ? 'Aktif' : 'Pasif'}
                </button>
                <button onClick={() => openEdit(b)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => del(b.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">{editId ? 'Banner Düzenle' : 'Yeni Banner'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Başlık (opsiyonel)</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              {/* Masaüstü Görsel */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Masaüstü Görsel <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1 text-xs">(1920×600px önerilir)</span>
                </label>
                <div className="flex gap-3">
                  <div
                    onClick={() => desktopInputRef.current?.click()}
                    className="flex-shrink-0 w-28 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-primary-400 transition overflow-hidden relative"
                  >
                    {form.imageDesktop ? (
                      <Image src={form.imageDesktop} alt="" fill className="object-cover" unoptimized sizes="112px" />
                    ) : (
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      placeholder="URL yapıştır veya dosya yükle"
                      value={form.imageDesktop.startsWith('data:') ? '' : form.imageDesktop}
                      onChange={e => setForm(f => ({ ...f, imageDesktop: e.target.value }))}
                    />
                    <div className="flex gap-3">
                      <button type="button" onClick={() => desktopInputRef.current?.click()} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Dosyadan yükle
                      </button>
                      {form.imageDesktop && <button type="button" onClick={() => setForm(f => ({ ...f, imageDesktop: '' }))} className="text-xs text-red-400 hover:text-red-600">Temizle</button>}
                    </div>
                  </div>
                </div>
                <input ref={desktopInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageFile('imageDesktop', e)} />
              </div>

              {/* Mobil Görsel */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Mobil Görsel
                  <span className="text-gray-400 font-normal ml-1 text-xs">(750×400px — boşsa masaüstü kullanılır)</span>
                </label>
                <div className="flex gap-3">
                  <div
                    onClick={() => mobileInputRef.current?.click()}
                    className="flex-shrink-0 w-28 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-primary-400 transition overflow-hidden relative"
                  >
                    {form.imageMobile ? (
                      <Image src={form.imageMobile} alt="" fill className="object-cover" unoptimized sizes="112px" />
                    ) : (
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      placeholder="URL yapıştır veya dosya yükle"
                      value={form.imageMobile ? (form.imageMobile.startsWith('data:') ? '' : form.imageMobile) : ''}
                      onChange={e => setForm(f => ({ ...f, imageMobile: e.target.value }))}
                    />
                    <div className="flex gap-3">
                      <button type="button" onClick={() => mobileInputRef.current?.click()} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Dosyadan yükle
                      </button>
                      {form.imageMobile && <button type="button" onClick={() => setForm(f => ({ ...f, imageMobile: '' }))} className="text-xs text-red-400 hover:text-red-600">Temizle</button>}
                    </div>
                  </div>
                </div>
                <input ref={mobileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageFile('imageMobile', e)} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Link (opsiyonel)</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="/kategori/bal-pekmez" value={form.link || ''} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Sıra</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="flex-1 flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
                    <span className="text-sm text-gray-700">Aktif</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">İptal</button>
              <button onClick={save} disabled={saving || !form.imageDesktop} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
