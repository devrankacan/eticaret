'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { Session } from 'next-auth'
import { useState } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  children: { id: string; name: string; slug: string }[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  session: Session | null
  onLoginClick: () => void
  onSignOut: () => void
}

export function MobileMenu({ isOpen, onClose, categories, session, onLoginClick, onSignOut }: Props) {
  const [openCats, setOpenCats] = useState<string[]>([])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const toggleCat = (id: string) => {
    setOpenCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} aria-hidden="true" />
      )}

      {/* Menü */}
      <div className={`fixed left-0 top-0 h-full w-72 bg-white z-[70] shadow-2xl
        flex flex-col overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Başlık */}
        <div className="bg-[#1a2e1a] text-white px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-lg">Menü</span>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Kategoriler */}
        <nav className="flex-1 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3 px-2">Kategoriler</p>
          <div className="space-y-0.5">
            {categories.map(cat => (
              <div key={cat.id}>
                <div className="flex items-center">
                  <Link
                    href={`/kategori/${cat.slug}`}
                    onClick={onClose}
                    className="flex-1 py-2.5 px-3 rounded-xl hover:bg-gray-50 font-medium text-gray-800 transition"
                  >
                    {cat.name}
                  </Link>
                  {cat.children.length > 0 && (
                    <button
                      onClick={() => toggleCat(cat.id)}
                      className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 transition"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${openCats.includes(cat.id) ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
                {cat.children.length > 0 && openCats.includes(cat.id) && (
                  <div className="pl-5 pb-2 space-y-0.5">
                    {cat.children.map(child => (
                      <Link
                        key={child.id}
                        href={`/kategori/${child.slug}`}
                        onClick={onClose}
                        className="block py-2 px-3 text-sm text-gray-600 hover:text-primary-600 rounded-xl hover:bg-gray-50 transition"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <hr className="my-4" />

          {/* Kullanıcı linkleri */}
          {session ? (
            <div className="space-y-0.5">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3 px-2">
                {session.user?.name}
              </p>
              <Link href="/hesabim/siparisler" onClick={onClose}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 text-gray-700 transition">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Siparişlerim
              </Link>
              {(session.user as any)?.role === 'admin' && (
                <Link href="/admin" onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 text-primary-700 font-medium transition">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                  </svg>
                  Admin Paneli
                </Link>
              )}
              <button
                onClick={() => { onSignOut(); onClose() }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-red-50 text-red-600 transition text-left"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış Yap
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 text-gray-700 transition"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Giriş Yap / Üye Ol
            </button>
          )}
        </nav>
      </div>
    </>
  )
}
