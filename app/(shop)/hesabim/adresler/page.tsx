'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Address {
  id: string
  title: string
  name: string
  phone: string
  city: string
  district: string
  neighborhood?: string
  address: string
  postalCode?: string
  isDefault: boolean
}

const emptyForm = {
  title: '', name: '', phone: '', city: '', district: '',
  neighborhood: '', address: '', postalCode: '', isDefault: false,
}

export default function AdreslerimPage() {
  const { status } = useSession()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return }
    if (status === 'authenticated') {
      fetch('/api/addresses').then(r => r.json()).then(d => { setAddresses(d.addresses || []); setLoading(false) })
    }
  }, [status, router])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(addr: Address) {
    setEditing(addr)
    setForm({
      title: addr.title, name: addr.name, phone: addr.phone,
      city: addr.city, district: addr.district,
      neighborhood: addr.neighborhood || '', address: addr.address,
      postalCode: addr.postalCode || '', isDefault: addr.isDefault,
    })
    setError('')
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const url = editing ? `/api/addresses/${editing.id}` : '/api/addresses'
    const method = editing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Kayıt sırasında hata oluştu')
      setSaving(false)
      return
    }

    const updated = await fetch('/api/addresses').then(r => r.json())
    setAddresses(updated.addresses || [])
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu adresi silmek istediğinize emin misiniz?')) return
    setDeleting(id)
    await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
    setAddresses(prev => prev.filter(a => a.id !== id))
    setDeleting(null)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link href="/" className="hover:text-primary-600 transition">Ana Sayfa</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Adreslerim</span>
      </nav>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Adreslerim</h1>
        <button
          onClick={openAdd}
          className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Adres
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <h2 className="font-bold text-gray-900 mb-4">{editing ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Adres Başlığı *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ev, İş, vb." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Ad Soyad *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Telefon *</label>
                <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="05XX XXX XX XX" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">İl *</label>
                <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">İlçe *</label>
                <input required value={form.district} onChange={e => setForm({ ...form, district: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Mahalle</label>
                <input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Posta Kodu</label>
                <input value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-medium">Açık Adres *</label>
              <textarea required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                rows={3} placeholder="Sokak, bina no, daire no..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                className="rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-600">Varsayılan adres olarak ayarla</span>
            </label>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-2.5 rounded-xl transition text-sm">
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Henüz kayıtlı adresiniz yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div key={addr.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-800 text-sm">{addr.title}</span>
                  {addr.isDefault && (
                    <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-2 py-0.5 rounded-full">Varsayılan</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{addr.name} — {addr.phone}</p>
                <p className="text-sm text-gray-500 mt-0.5">{addr.address}</p>
                <p className="text-sm text-gray-500">{addr.district}, {addr.city}{addr.postalCode ? ` ${addr.postalCode}` : ''}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(addr)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(addr.id)} disabled={deleting === addr.id}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
