'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  description: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  _count: { products: number }
  children: { id: string; name: string }[]
}

const empty = { name: '', slug: '', image: '', description: '', parentId: '', sortOrder: 0, isActive: true }

export default function KategorilerPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const fetch_ = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/categories')
    setCats(await res.json())
    setLoading(false)
    setSelected(new Set())
  }

  useEffect(() => { fetch_() }, [])

  const openNew = () => { setForm(empty); setEditId(null); setShowForm(true) }
  const openEdit = (c: Category) => {
    setForm({ name: c.name, slug: c.slug, image: c.image || '', description: c.description || '', parentId: c.parentId || '', sortOrder: c.sortOrder, isActive: c.isActive })
    setEditId(c.id)
    setShowForm(true)
  }

  const save = async () => {
    setSaving(true)
    if (editId) {
      await fetch(`/api/admin/categories/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, parentId: form.parentId || null }) })
    } else {
      await fetch('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, parentId: form.parentId || null }) })
    }
    setSaving(false)
    setShowForm(false)
    fetch_()
  }

  const del = async (id: string) => {
    if (!confirm('Bu kategori silinsin mi?')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Silinemedi.')
      return
    }
    fetch_()
  }

  // Çoklu seçim
  const allIds = cats.map(c => c.id)
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleSelectAll = () => setSelected(selected.size === allIds.length ? new Set() : new Set(allIds))
  const allSelected = allIds.length > 0 && selected.size === allIds.length
  const someSelected = selected.size > 0 && !allSelected

  const bulkDelete = async () => {
    if (!confirm(`Seçili ${selected.size} kategori silinsin mi?`)) return
    setBulkLoading(true)
    const res = await fetch('/api/admin/categories/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', ids: Array.from(selected) }),
    })
    setBulkLoading(false)
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Silinemedi.')
      return
    }
    fetch_()
  }

  // Görsel yükleme
  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Görsel 5MB\'den küçük olmalıdır.'); return }
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const mainCats = cats.filter(c => !c.parentId)
  const subCats = cats.filter(c => c.parentId)

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Kategoriler</h1>
        <button onClick={openNew} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Kategori
        </button>
      </div>

      {/* Toplu işlem çubuğu */}
      {selected.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-primary-800">{selected.size} kategori seçildi</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={bulkDelete}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Sil
            </button>
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Tümünü seç */}
      {!loading && cats.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => { if (el) el.indeterminate = someSelected }}
            onChange={toggleSelectAll}
            className="w-4 h-4 accent-primary-600 cursor-pointer"
          />
          <span className="text-xs text-gray-400">Tümünü seç</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : (
        <div className="space-y-2">
          {mainCats.map(cat => (
            <div key={cat.id}>
              {/* Ana kategori */}
              <div className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 transition ${selected.has(cat.id) ? 'ring-2 ring-primary-300' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected.has(cat.id)}
                  onChange={() => toggleSelect(cat.id)}
                  className="w-4 h-4 accent-primary-600 cursor-pointer flex-shrink-0"
                />
                <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{cat.name}</p>
                  <p className="text-xs text-gray-400">/{cat.slug} · {cat._count.products} ürün · {subCats.filter(s => s.parentId === cat.id).length} alt kategori</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                  <button onClick={() => openEdit(cat)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => del(cat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Alt kategoriler */}
              {subCats.filter(s => s.parentId === cat.id).map(sub => (
                <div key={sub.id} className={`bg-gray-50 rounded-xl p-3 ml-8 flex items-center gap-3 mt-1.5 transition ${selected.has(sub.id) ? 'ring-2 ring-primary-200' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selected.has(sub.id)}
                    onChange={() => toggleSelect(sub.id)}
                    className="w-4 h-4 accent-primary-600 cursor-pointer flex-shrink-0"
                  />
                  <div className="w-2 h-2 bg-gray-300 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{sub.name}</p>
                    <p className="text-xs text-gray-400">/{sub.slug} · {sub._count.products} ürün</p>
                  </div>
                  <button onClick={() => openEdit(sub)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => del(sub.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ))}
          {cats.length === 0 && <div className="text-center py-12 text-gray-400">Henüz kategori eklenmemiş</div>}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">{editId ? 'Kategori Düzenle' : 'Yeni Kategori'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Kategori Adı <span className="text-red-500">*</span></label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Slug (URL)</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="Boş bırakılırsa otomatik oluşturulur" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
              </div>

              {/* Görsel alanı */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Görsel</label>
                <div className="flex gap-3 items-start">
                  {/* Önizleme / tıklanabilir yükleme kutusu */}
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-primary-400 transition overflow-hidden relative"
                  >
                    {form.image ? (
                      <Image src={form.image} alt="" fill className="object-cover" unoptimized sizes="80px" />
                    ) : (
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                  </div>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      placeholder="https://... veya soldaki kutuya tıkla"
                      value={form.image.startsWith('data:') ? '' : form.image}
                      onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    />
                    <div className="flex gap-3">
                      <button type="button" onClick={() => imageInputRef.current?.click()} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Bilgisayardan yükle
                      </button>
                      {form.image && <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))} className="text-xs text-red-400 hover:text-red-600">Temizle</button>}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Üst Kategori</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                  <option value="">— Ana Kategori —</option>
                  {mainCats.filter(c => c.id !== editId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Açıklama</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
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
              <button onClick={save} disabled={saving || !form.name} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
