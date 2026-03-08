'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  comparePrice: number | null
  stock: number
  isActive: boolean
  isFeatured: boolean
  category: { name: string }
  images: { imagePath: string }[]
}

interface Category {
  id: string
  name: string
}

export default function UrunlerPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const emptyForm = { name: '', categoryId: '', price: '', comparePrice: '', stock: '0', weight: '', shortDescription: '', isActive: true, isFeatured: false, images: [{ url: '', uploading: false }] }
  const [form, setForm] = useState(emptyForm)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/products?page=${page}&q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setProducts(data.products)
    setTotal(data.total)
    setPages(data.pages)
    setLoading(false)
  }, [page, q])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(data => setCategories(data.filter((c: any) => !c.parentId || true)))
  }, [])

  const openNew = () => {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`)
    const p = await res.json()
    setForm({
      name: p.name, categoryId: p.categoryId, price: p.price.toString(),
      comparePrice: p.comparePrice?.toString() || '', stock: p.stock.toString(),
      weight: p.weight?.toString() || '', shortDescription: p.shortDescription || '',
      isActive: p.isActive, isFeatured: p.isFeatured,
      images: p.images.length ? p.images.map((i: any) => ({ url: i.imagePath, uploading: false })) : [{ url: '', uploading: false }],
    })
    setEditId(id)
    setShowForm(true)
  }

  const save = async () => {
    setSaving(true)
    const payload = { ...form, images: form.images.filter(i => i.url) }
    if (editId) {
      await fetch(`/api/admin/products/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setSaving(false)
    setShowForm(false)
    fetchProducts()
  }

  const del = async (id: string) => {
    if (!confirm('Bu ürün silinsin mi?')) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    fetchProducts()
  }

  const addImageRow = () => setForm(f => ({ ...f, images: [...f.images, { url: '', uploading: false }] }))
  const removeImageRow = (i: number) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))
  const setImageUrl = (i: number, url: string) => setForm(f => ({ ...f, images: f.images.map((img, idx) => idx === i ? { ...img, url } : img) }))

  function handleImageFile(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Görsel 5MB\'den küçük olmalıdır.'); return }
    setForm(f => ({ ...f, images: f.images.map((img, idx) => idx === i ? { ...img, uploading: true } : img) }))
    const reader = new FileReader()
    reader.onload = ev => {
      setForm(f => ({ ...f, images: f.images.map((img, idx) => idx === i ? { url: ev.target?.result as string, uploading: false } : img) }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-sm text-gray-400">{total} ürün</p>
        </div>
        <button onClick={openNew} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Ürün
        </button>
      </div>

      {/* Arama */}
      <div className="bg-white rounded-xl shadow-sm p-3 mb-4">
        <input
          className="w-full text-sm focus:outline-none"
          placeholder="Ürün adı ile ara..."
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }}
        />
      </div>

      {/* Tablo */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Ürün bulunamadı</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b bg-gray-50">
                  <th className="p-4 text-left font-semibold">Ürün</th>
                  <th className="p-4 text-left font-semibold">Kategori</th>
                  <th className="p-4 text-right font-semibold">Fiyat</th>
                  <th className="p-4 text-right font-semibold">Stok</th>
                  <th className="p-4 text-center font-semibold">Durum</th>
                  <th className="p-4 text-right font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                          {p.images[0] ? (
                            <Image src={p.images[0].imagePath} alt={p.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">{p.name}</p>
                          {p.isFeatured && <span className="text-xs text-yellow-600">⭐ Öne Çıkan</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{p.category.name}</td>
                    <td className="p-4 text-right">
                      <p className="font-semibold">{p.price.toFixed(2)} ₺</p>
                      {p.comparePrice && <p className="text-xs text-gray-400 line-through">{p.comparePrice.toFixed(2)} ₺</p>}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-medium ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-gray-900'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p.id)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <Link href={`/urunler/${p.slug}`} target="_blank" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                        <button onClick={() => del(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Sayfalama */}
          {pages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-400">{total} sonuç</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">← Önceki</button>
                <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">Sonraki →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">{editId ? 'Ürün Düzenle' : 'Yeni Ürün'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Ürün Adı <span className="text-red-500">*</span></label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Kategori <span className="text-red-500">*</span></label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">Seçin</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Stok</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Satış Fiyatı (₺) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Eski Fiyat (₺)</label>
                  <input type="number" step="0.01" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="Üzeri çizili" value={form.comparePrice} onChange={e => setForm(f => ({ ...f, comparePrice: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Kısa Açıklama</label>
                  <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Ürün Görselleri</label>
                  <div className="space-y-3">
                    {form.images.map((img, i) => (
                      <div key={i} className="flex gap-2">
                        {/* Önizleme / Yükle alanı */}
                        <div
                          onClick={() => fileInputRefs.current[i]?.click()}
                          className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-primary-400 transition overflow-hidden relative"
                        >
                          {img.uploading ? (
                            <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                          ) : img.url ? (
                            <Image src={img.url} alt="" fill className="object-cover" unoptimized sizes="64px"/>
                          ) : (
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                            </svg>
                          )}
                        </div>
                        <input
                          ref={el => { fileInputRefs.current[i] = el }}
                          type="file" accept="image/*" className="hidden"
                          onChange={e => handleImageFile(i, e)}
                        />
                        {/* URL girişi */}
                        <div className="flex-1 flex flex-col gap-1.5">
                          <input
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                            placeholder={i === 0 ? 'URL yapıştır veya soldaki kutuya tıkla' : `Görsel ${i + 1} URL veya yükle`}
                            value={img.url.startsWith('data:') ? '' : img.url}
                            onChange={e => setImageUrl(i, e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => fileInputRefs.current[i]?.click()} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                              </svg>
                              Bilgisayardan yükle
                            </button>
                            {img.url && <button type="button" onClick={() => setImageUrl(i, '')} className="text-xs text-red-400 hover:text-red-600">Temizle</button>}
                          </div>
                        </div>
                        {form.images.length > 1 && (
                          <button type="button" onClick={() => removeImageRow(i)} className="p-2 text-gray-300 hover:text-red-500 self-start">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addImageRow} className="text-sm text-primary-600 hover:underline">+ Görsel Ekle</button>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
                    <span className="text-sm text-gray-700">Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 accent-yellow-500" />
                    <span className="text-sm text-gray-700">⭐ Öne Çıkan</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">İptal</button>
              <button onClick={save} disabled={saving || !form.name || !form.categoryId || !form.price} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
