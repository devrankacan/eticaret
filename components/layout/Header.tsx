'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/components/providers'
import { LoginPanel } from './LoginPanel'
import { MobileMenu } from './MobileMenu'

interface Category {
  id: string
  name: string
  slug: string
  children: { id: string; name: string; slug: string }[]
}

interface HeaderProps {
  categories: Category[]
  siteName: string
  siteLogo?: string
}

export function Header({ categories, siteName, siteLogo }: HeaderProps) {
  const { data: session } = useSession()
  const { cartCount } = useCart()
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* ====== HEADER ====== */}
      <header className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>

        {/* Üst bar - koyu yeşil */}
        <div className="bg-[#1a2e1a]">
          <div className="max-w-7xl mx-auto px-3 h-14 flex items-center justify-between relative">

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition"
              aria-label="Menüyü aç"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo - ortada */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center">
              {siteLogo ? (
                <Image src={siteLogo} alt={siteName} width={120} height={40} className="h-10 w-auto object-contain" />
              ) : (
                <span className="text-white font-bold text-xl tracking-wide">{siteName}</span>
              )}
            </Link>

            {/* Sağ ikonlar */}
            <div className="flex items-center gap-0.5">
              {/* Kullanıcı */}
              <button
                onClick={() => setLoginOpen(true)}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition"
                aria-label="Hesabım"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Sepet */}
              <Link
                href="/sepet"
                className="p-2 rounded-lg text-white hover:bg-white/10 transition relative"
                aria-label="Sepet"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Arama Çubuğu */}
        <div className="bg-white px-3 py-2.5 border-b border-gray-100">
          <form
            action="/urunler"
            method="GET"
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              window.location.href = `/urunler?q=${encodeURIComponent(searchQuery)}`
            }}
          >
            <input
              type="text"
              name="q"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Aradığınız ürün, kategori veya markayı yazınız..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition flex items-center"
              aria-label="Ara"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      {/* Mobil Menü */}
      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
        session={session}
        onLoginClick={() => { setMenuOpen(false); setLoginOpen(true) }}
        onSignOut={() => signOut()}
      />

      {/* Login / Hesap Paneli */}
      <LoginPanel
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        session={session}
      />
    </>
  )
}
