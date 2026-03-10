'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/components/providers'
import { LoginPanel } from './LoginPanel'
import { MobileMenu } from './MobileMenu'
import { CartPanel } from './CartPanel'

interface Category {
  id: string
  name: string
  slug: string
  children: { id: string; name: string; slug: string }[]
}

interface NavPage { id: string; slug: string; title: string; navLabel?: string | null }

interface HeaderProps {
  categories: Category[]
  siteName: string
  siteLogo?: string
  whatsapp?: string
  socialLinks?: { instagram?: string; facebook?: string; youtube?: string }
  announcementText?: string
  announcementEnabled?: boolean
  freeShippingText?: string
  freeShippingThreshold?: string
  navPages?: NavPage[]
  navExtraItems?: { label: string; href: string }[]
}

export function Header({ categories, siteName, siteLogo, whatsapp, socialLinks, announcementText, announcementEnabled = true, freeShippingText, freeShippingThreshold, navPages = [], navExtraItems = [] }: HeaderProps) {
  const { data: session } = useSession()
  const { cartCount } = useCart()
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/urunler?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const logo = siteLogo ? (
    <Image src={siteLogo} alt={siteName} width={130} height={44} className="h-11 w-auto object-contain" />
  ) : (
    <span className="text-[#3d1f08] font-bold text-xl tracking-wide">{siteName}</span>
  )

  const searchBar = (
    <form onSubmit={handleSearch} className="flex items-center w-full border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-primary-300 transition">
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Ürün aramaya başla"
        className="flex-1 px-4 py-2.5 text-sm focus:outline-none bg-transparent"
        autoComplete="off"
      />
      <button type="submit" className="px-4 py-2.5 text-gray-400 hover:text-primary-600 transition border-l border-gray-200">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  )

  return (
    <>
      <div className={`sticky top-0 z-50 transition-shadow ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>

        {/* ══════════════ DUYURU BANDI ══════════════ */}
        {announcementEnabled !== false && <div className="bg-[#3d1f08] text-white text-xs py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center">
            <p className="flex-1 text-center">
              {announcementText || 'Aynı Gün İçerisinde Kargoların Gönderimi Yapılmaktadır.'}
            </p>
            {/* Desktop: sosyal medya */}
            {(whatsapp || socialLinks?.instagram || socialLinks?.facebook || socialLinks?.youtube) && (
              <div className="hidden lg:flex items-center gap-2 text-white/80 flex-shrink-0">
{socialLinks?.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="Instagram">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {socialLinks?.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="Facebook">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                )}
                {socialLinks?.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="YouTube">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                )}
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="WhatsApp">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>}

        {/* ══════════════ ANA HEADER ══════════════ */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">

            {/* Mobile: hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-[#3d1f08] hover:bg-primary-50 transition flex-shrink-0"
              aria-label="Menüyü aç"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              {logo}
            </Link>

            {/* Desktop: arama */}
            <div className="hidden lg:flex flex-1 mx-4">
              {searchBar}
            </div>

            {/* Desktop: ücretsiz kargo bilgisi */}
            <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0 mr-2">
              <svg className="w-9 h-9 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              <div className="leading-tight">
                <p className="font-semibold text-gray-800 text-xs">{freeShippingText || 'Ücretsiz Kargo'}</p>
                <p className="text-gray-400 text-[11px]">{freeShippingThreshold || '500'} TL ve Üzeri Alışverişlerde</p>
              </div>
            </div>

            {/* İkonlar */}
            <div className="ml-auto lg:ml-0 flex items-center gap-0.5">

              {/* Favoriler */}
              <Link
                href="/favoriler"
                className="p-2 text-[#3d1f08] hover:bg-primary-50 rounded-lg transition"
                aria-label="Favoriler"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              {/* Kullanıcı */}
              <button
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-1.5 px-2 py-2 text-[#3d1f08] hover:bg-primary-50 rounded-lg transition"
                aria-label="Hesabım"
              >
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden lg:inline text-sm font-medium whitespace-nowrap">Üye Girişi</span>
              </button>

              {/* Sepet */}
              <button
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-1.5 px-2 py-2 text-[#3d1f08] hover:bg-primary-50 rounded-lg transition"
                aria-label="Sepet"
              >
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-0.5 leading-none">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline text-sm font-medium">Sepet</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════ MOBİL ARAMA ══════════════ */}
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-2.5">
          {searchBar}
        </div>

        {/* ══════════════ DESKTOP KATEGORİ NAV ══════════════ */}
        <nav className="hidden lg:block bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-7 h-10 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <Link
                href="/"
                className="text-sm font-medium text-[#3d1f08] hover:text-primary-600 transition whitespace-nowrap flex-shrink-0"
              >
                Anasayfa
              </Link>
              <Link
                href="/urunler"
                className="text-sm font-medium text-[#3d1f08] hover:text-primary-600 transition whitespace-nowrap flex-shrink-0"
              >
                Tüm Ürünler
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/kategori/${cat.slug}`}
                  className="text-sm font-medium text-[#3d1f08] hover:text-primary-600 transition whitespace-nowrap flex-shrink-0"
                >
                  {cat.name}
                </Link>
              ))}
              {navExtraItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-[#3d1f08] hover:text-primary-600 transition whitespace-nowrap flex-shrink-0"
                >
                  {item.label}
                </Link>
              ))}
              {navPages.map(pg => (
                <Link
                  key={pg.id}
                  href={`/sayfa/${pg.slug}`}
                  className="text-sm font-medium text-[#3d1f08] hover:text-primary-600 transition whitespace-nowrap flex-shrink-0"
                >
                  {pg.navLabel || pg.title}
                </Link>
              ))}
              <Link
                href="/iletisim"
                className="text-sm font-medium text-[#3d1f08] hover:text-primary-600 transition whitespace-nowrap flex-shrink-0"
              >
                İletişim
              </Link>
            </div>
          </div>
        </nav>

      </div>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
        session={session}
        onLoginClick={() => { setMenuOpen(false); setLoginOpen(true) }}
        onSignOut={() => signOut()}
      />

      <LoginPanel
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        session={session}
      />

      <CartPanel
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  )
}
