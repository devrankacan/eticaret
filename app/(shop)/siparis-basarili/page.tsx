import Link from 'next/link'
import { Suspense } from 'react'

function OrderSuccessContent({ searchParams }: { searchParams: { no?: string } }) {
  const orderNo = searchParams.no

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Siparişiniz Alındı!</h1>

      {orderNo && (
        <p className="text-gray-500 mb-1">
          Sipariş No: <span className="font-bold text-gray-800">{orderNo}</span>
        </p>
      )}

      <p className="text-gray-500 mb-8">
        Siparişiniz başarıyla oluşturuldu. En kısa sürede hazırlanıp kargoya verilecektir.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-left">
        <p className="text-sm font-semibold text-amber-800 mb-1">Havale / EFT ile ödeme yapacaksanız:</p>
        <p className="text-xs text-amber-700">
          Banka hesap bilgileri e-posta adresinize gönderilecektir. Havale açıklamasına sipariş numaranızı yazmayı unutmayın.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/hesabim/siparisler"
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition">
          Siparişlerimi Görüntüle
        </Link>
        <Link href="/"
          className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl transition">
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}

export default function SiparisBasariliPage({ searchParams }: { searchParams: { no?: string } }) {
  return (
    <Suspense>
      <OrderSuccessContent searchParams={searchParams} />
    </Suspense>
  )
}
