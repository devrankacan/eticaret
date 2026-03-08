'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ProfilPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  })

  if (status === 'unauthenticated') {
    router.push('/')
    return null
  }

  if (status === 'loading') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center text-gray-400">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
      </div>
    )
  }

  const user = session?.user as any

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.newPassword && form.newPassword !== form.newPasswordConfirm) {
      setError('Yeni şifreler eşleşmiyor')
      return
    }

    setSaving(true)

    const payload: any = {}
    if (form.name) payload.name = form.name
    if (form.phone !== undefined) payload.phone = form.phone
    if (form.newPassword) {
      payload.currentPassword = form.currentPassword
      payload.newPassword = form.newPassword
    }

    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Güncelleme başarısız')
    } else {
      setSuccess('Profiliniz başarıyla güncellendi.')
      if (form.name) await update({ name: form.name })
      setForm({ name: '', phone: '', currentPassword: '', newPassword: '', newPasswordConfirm: '' })
    }

    setSaving(false)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link href="/" className="hover:text-primary-600 transition">Ana Sayfa</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Profil Ayarları</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900 mb-5">Profil Ayarları</h1>

      {/* Hesap Bilgileri */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Ad Soyad</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={user?.name || ''}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Telefon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder={user?.phone || '05XX XXX XX XX'}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <hr className="my-2" />
          <p className="text-sm font-semibold text-gray-700">Şifre Değiştir</p>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Mevcut Şifre</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })}
              placeholder="Mevcut şifrenizi girin"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Yeni Şifre</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              placeholder="En az 8 karakter"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Yeni Şifre Tekrar</label>
            <input
              type="password"
              value={form.newPasswordConfirm}
              onChange={e => setForm({ ...form, newPasswordConfirm: e.target.value })}
              placeholder="Yeni şifrenizi tekrar girin"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm font-medium">{success}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition"
          >
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </form>
      </div>

      {/* Hızlı linkler */}
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        <Link href="/hesabim/siparisler" className="flex items-center gap-3 p-4 hover:bg-gray-50 transition rounded-t-2xl">
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-sm text-gray-700 font-medium">Siparişlerim</span>
          <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link href="/hesabim/adresler" className="flex items-center gap-3 p-4 hover:bg-gray-50 transition">
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm text-gray-700 font-medium">Adreslerim</span>
          <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition rounded-b-2xl text-left"
        >
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-sm text-red-500 font-medium">Çıkış Yap</span>
        </button>
      </div>
    </div>
  )
}
