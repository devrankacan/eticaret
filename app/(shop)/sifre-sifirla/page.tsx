import Link from 'next/link'

export const metadata = {
  title: 'Şifremi Unuttum',
}

export default function SifreSifirlaPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Şifremi Unuttum</h1>
        <p className="text-gray-500 text-sm mb-6">
          Şifre sıfırlama için lütfen müşteri hizmetlerimizle iletişime geçin. Kayıtlı e-posta adresinizi kullanarak yeni şifre oluşturmanıza yardımcı olacağız.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
          <p className="text-sm font-semibold text-gray-700">İletişim Yöntemleri:</p>
          <Link
            href="/iletisim"
            className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary-600 transition"
          >
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            İletişim Formu
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/iletisim"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition"
          >
            İletişime Geç
          </Link>
          <Link
            href="/"
            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
