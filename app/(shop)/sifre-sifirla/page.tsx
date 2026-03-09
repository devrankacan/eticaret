'use client'

import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react'
import Link from 'next/link'

type Step = 'email' | 'code' | 'success'

export default function SifreSifirlaPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // ─── Adım 1: E-posta gönder ───────────────────────────────────────────────
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/sifremi-unuttum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setStep('code')
      startResendTimer()
    } catch {
      setError('Bir hata oluştu, lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  function startResendTimer() {
    setResendCountdown(60)
    const interval = setInterval(() => {
      setResendCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleResend() {
    if (resendCountdown > 0) return
    setError('')
    setLoading(true)
    try {
      await fetch('/api/auth/sifremi-unuttum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      startResendTimer()
    } finally {
      setLoading(false)
    }
  }

  // ─── Kod input yönetimi ────────────────────────────────────────────────────
  function handleDigitChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = cleaned
    setDigits(next)
    if (cleaned && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleDigitKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...digits]
    pasted.split('').forEach((ch, i) => { if (i < 6) next[i] = ch })
    setDigits(next)
    const lastFilled = Math.min(pasted.length, 5)
    inputRefs.current[lastFilled]?.focus()
  }

  // ─── Adım 2: Kodu doğrula + şifre güncelle ────────────────────────────────
  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const code = digits.join('')
    if (code.length < 6) { setError('Lütfen 6 haneli kodu eksiksiz girin.'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return }
    if (password !== passwordConfirm) { setError('Şifreler eşleşmiyor.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/sifre-sifirla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setStep('success')
    } catch {
      setError('Bir hata oluştu, lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        {/* Progress bar */}
        {step !== 'success' && (
          <div className="flex">
            {['email', 'code'].map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 transition-colors duration-300 ${
                  (step === 'email' && i === 0) || step === 'code'
                    ? 'bg-primary-500'
                    : 'bg-gray-100'
                }`}
              />
            ))}
          </div>
        )}

        <div className="p-8">

          {/* ── Adım 1: E-posta ── */}
          {step === 'email' && (
            <>
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Şifremi Unuttum</h1>
              <p className="text-gray-500 text-sm mb-6">
                Kayıtlı e-posta adresinize 6 haneli doğrulama kodu göndereceğiz.
              </p>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta Adresi</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="ornek@mail.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition"
                >
                  {loading ? 'Gönderiliyor…' : 'Doğrulama Kodu Gönder'}
                </button>
              </form>

              <Link href="/" className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-5 transition">
                Ana Sayfaya Dön
              </Link>
            </>
          )}

          {/* ── Adım 2: Kod + Yeni Şifre ── */}
          {step === 'code' && (
            <>
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Doğrulama Kodu</h1>
              <p className="text-gray-500 text-sm mb-6">
                <span className="font-medium text-gray-700">{email}</span> adresine gönderilen
                6 haneli kodu ve yeni şifrenizi girin.
              </p>

              <form onSubmit={handleReset} className="space-y-5">

                {/* 6 kutulu kod girişi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Doğrulama Kodu</label>
                  <div className="flex gap-2 justify-between">
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={el => { inputRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleDigitChange(i, e.target.value)}
                        onKeyDown={e => handleDigitKeyDown(i, e)}
                        onPaste={handlePaste}
                        className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-colors ${
                          d
                            ? 'border-primary-400 bg-primary-50 text-primary-700'
                            : 'border-gray-200 bg-white text-gray-900 focus:border-primary-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">Kod 15 dakika geçerlidir</p>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCountdown > 0 || loading}
                      className="text-xs text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-default transition"
                    >
                      {resendCountdown > 0 ? `Tekrar gönder (${resendCountdown}s)` : 'Tekrar Gönder'}
                    </button>
                  </div>
                </div>

                {/* Yeni şifre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Yeni Şifre</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="En az 6 karakter"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Şifre tekrar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Yeni Şifre (Tekrar)</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    required
                    placeholder="Şifrenizi tekrar girin"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition"
                >
                  {loading ? 'Güncelleniyor…' : 'Şifremi Güncelle'}
                </button>
              </form>

              <button
                onClick={() => { setStep('email'); setError(''); setDigits(['','','','','','']) }}
                className="block w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-5 transition"
              >
                ← Farklı e-posta kullan
              </button>
            </>
          )}

          {/* ── Adım 3: Başarı ── */}
          {step === 'success' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Şifre Güncellendi!</h1>
              <p className="text-gray-500 text-sm mb-8">
                Şifreniz başarıyla güncellendi. Artık yeni şifrenizle giriş yapabilirsiniz.
              </p>
              <Link
                href="/"
                className="inline-block w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition"
              >
                Giriş Yap
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
