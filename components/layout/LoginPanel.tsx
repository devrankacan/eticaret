'use client'

import { useEffect, useRef, useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import type { Session } from 'next-auth'

interface Props {
  isOpen: boolean
  onClose: () => void
  session: Session | null
}

export function LoginPanel({ isOpen, onClose, session }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // ESC ile kapat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Body scroll kilitle
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const res = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('E-posta veya şifre hatalı.')
    } else {
      onClose()
      window.location.reload()
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        phone: form.get('phone'),
        password: form.get('password'),
        passwordConfirm: form.get('passwordConfirm'),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Kayıt olunamadı.')
      setLoading(false)
      return
    }
    // Başarılı kayıt → otomatik giriş
    await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    })
    setLoading(false)
    onClose()
    window.location.reload()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[60]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-[70] shadow-2xl
          flex flex-col overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {session ? (
          /* ====== GİRİŞ YAPILMIŞSA ====== */
          <div className="p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{session.user?.name}</p>
                  <p className="text-xs text-gray-400">Hesabım</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-1">
              {[
                { href: '/hesabim/siparisler', label: 'Siparişlerim', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                { href: '/hesabim/adresler', label: 'Adreslerim', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
                { href: '/hesabim/profil', label: 'Profil Ayarları', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 transition"
                >
                  <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}
              {(session.user as any)?.role === 'admin' && (
                <Link href="/admin" onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-primary-700 font-medium transition">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                  </svg>
                  Admin Paneli
                </Link>
              )}
              <button
                onClick={() => { signOut(); onClose() }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-600 transition text-left"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış Yap
              </button>
            </nav>
          </div>
        ) : (
          /* ====== GİRİŞ YAPILMAMIŞSA ====== */
          <div className="p-5 flex-1 flex flex-col">
            {/* Başlık */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="font-bold text-lg text-gray-900">Hesabım</span>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab */}
            <div className="flex border-b border-gray-200 mb-5">
              <button
                onClick={() => { setTab('login'); setError('') }}
                className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition ${
                  tab === 'login' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400'
                }`}
              >
                ÜYE GİRİŞİ
              </button>
              <button
                onClick={() => { setTab('register'); setError('') }}
                className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition ${
                  tab === 'register' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400'
                }`}
              >
                KAYIT OL
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                {error}
              </div>
            )}

            {/* GİRİŞ FORMU */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">E-Posta</label>
                  <input
                    name="email" type="email" required
                    placeholder="E-posta adresinizi giriniz"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 font-medium">Şifre</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Şifrenizi giriniz"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" name="remember" className="rounded border-gray-300 text-primary-600" />
                    Beni Hatırla
                  </label>
                  <Link href="/sifre-sifirla" onClick={onClose} className="text-sm text-primary-600 hover:underline">
                    Şifremi Unuttum
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition"
                >
                  {loading ? 'Giriş yapılıyor...' : 'GİRİŞ YAP'}
                </button>
              </form>
            )}

            {/* KAYIT FORMU */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                {[
                  { name: 'name', label: 'Ad Soyad', type: 'text', placeholder: 'Adınızı giriniz', required: true },
                  { name: 'email', label: 'E-Posta', type: 'email', placeholder: 'E-posta adresinizi giriniz', required: true },
                  { name: 'phone', label: 'Telefon', type: 'tel', placeholder: '05XX XXX XX XX', required: false },
                  { name: 'password', label: 'Şifre', type: 'password', placeholder: 'En az 8 karakter', required: true },
                  { name: 'passwordConfirm', label: 'Şifre Tekrar', type: 'password', placeholder: 'Şifrenizi tekrar girin', required: true },
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-sm text-gray-600 mb-1.5 font-medium">{field.label}</label>
                    <input
                      name={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition"
                >
                  {loading ? 'Kayıt yapılıyor...' : 'KAYIT OL'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  )
}
