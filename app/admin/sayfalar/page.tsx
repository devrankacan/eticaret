'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Page {
  id: string
  title: string
  slug: string
  isActive: boolean
  showInNav: boolean
  sortOrder: number
  createdAt: string
}

export default function SayfalarPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = () => {
    fetch('/api/admin/pages')
      .then(r => r.json())
      .then(data => { setPages(data); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const deletePage = async (id: string, title: string) => {
    if (!confirm(`"${title}" sayfasını silmek istediğinize emin misiniz?`)) return
    setDeleting(id)
    await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const toggleActive = async (page: Page) => {
    await fetch(`/api/admin/pages/${page.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...page, isActive: !page.isActive }),
    })
    load()
  }

  if (loading) return <div className="p-6 text-center text-gray-400">Yükleniyor...</div>

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sayfalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Özel içerik sayfaları ekle, düzenle, sil</p>
        </div>
        <Link
          href="/admin/sayfalar/yeni"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Sayfa
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400 mb-4">Henüz sayfa oluşturulmamış</p>
          <Link href="/admin/sayfalar/yeni" className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition">
            İlk Sayfayı Oluştur
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Başlık</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">URL</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Navda Göster</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pages.map(page => (
                <tr key={page.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900 text-sm">{page.title}</div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <a
                      href={`/sayfa/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline font-mono"
                    >
                      /sayfa/{page.slug}
                    </a>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${page.showInNav ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {page.showInNav ? '✓ Evet' : '— Hayır'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleActive(page)}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer transition ${page.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                    >
                      {page.isActive ? '● Yayında' : '○ Gizli'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/sayfalar/${page.id}`}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"
                      >
                        Düzenle
                      </Link>
                      <button
                        onClick={() => deletePage(page.id, page.title)}
                        disabled={deleting === page.id}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {deleting === page.id ? '...' : 'Sil'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
