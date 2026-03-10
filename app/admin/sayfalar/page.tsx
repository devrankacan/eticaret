import Link from 'next/link'

const pages = [
  { title: 'Ana Sayfa', url: '/', desc: 'Sitenin ana sayfası' },
  { title: 'Tüm Ürünler', url: '/urunler', desc: 'Ürün listeleme sayfası' },
  { title: 'Hakkımızda', url: '/hakkimizda', desc: 'Firma tanıtım ve hakkımızda içeriği' },
  { title: 'İletişim', url: '/iletisim', desc: 'İletişim formu ve bilgileri' },
  { title: 'Sepetim', url: '/sepet', desc: 'Müşteri alışveriş sepeti' },
  { title: 'Ödeme', url: '/odeme', desc: 'Sipariş tamamlama ve ödeme sayfası' },
  { title: 'Hesabım', url: '/hesabim', desc: 'Müşteri hesap yönetimi' },
  { title: 'Favoriler', url: '/favoriler', desc: 'Beğenilen ürünler listesi' },
]

export default function SayfalarPage() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Sayfalar</h1>
        <p className="text-sm text-gray-500 mt-1">Sitedeki mevcut sayfalar</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Sayfa Adı</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">URL</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Açıklama</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pages.map((page) => (
              <tr key={page.url} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3.5 font-medium text-gray-800">{page.title}</td>
                <td className="px-5 py-3.5">
                  <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{page.url}</code>
                </td>
                <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell">{page.desc}</td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={page.url}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Görüntüle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
