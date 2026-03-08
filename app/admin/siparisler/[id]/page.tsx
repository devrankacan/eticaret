import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_LABELS } from '@/lib/utils'
import { OrderActions } from './OrderActions'

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      history: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!order) notFound()

  const cargoCompanies = await prisma.cargoCompany.findMany({
    where: { isActive: true },
    orderBy: { isDefault: 'desc' },
  })

  return (
    <div className="p-4 sm:p-6">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <Link href="/admin/siparisler"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">#{order.orderNumber}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
        <p className="text-gray-400 text-sm">
          {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl">

        {/* Sol - Ürünler + Kargo */}
        <div className="lg:col-span-2 space-y-4">

          {/* Sipariş kalemleri */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Sipariş İçeriği</h2>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  {item.productImage ? (
                    <Image
                      src={item.productImage.startsWith('http') ? item.productImage : `/${item.productImage}`}
                      alt={item.productName}
                      width={56}
                      height={56}
                      className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm font-medium line-clamp-2">{item.productName}</p>
                    {item.productSku && <p className="text-gray-400 text-xs">SKU: {item.productSku}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-gray-400 text-xs">{item.quantity} × {formatPrice(item.unitPrice)}</p>
                    <p className="font-bold text-gray-900 text-sm">{formatPrice(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fiyat özeti */}
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Ara Toplam</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>İndirim</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Kargo</span>
                <span>{order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Ücretsiz'}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2 mt-2">
                <span>TOPLAM</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Kargo + Durum güncelle (client component) */}
          <OrderActions order={order} cargoCompanies={cargoCompanies} />

          {/* Sipariş geçmişi */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Sipariş Geçmişi</h2>
            {order.history.length === 0 ? (
              <p className="text-gray-400 text-sm">Henüz geçmiş yok.</p>
            ) : (
              <div className="space-y-3">
                {order.history.map(h => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-400 mt-1.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{h.status}</p>
                      {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(h.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ - Müşteri, Adres, Ödeme */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">Teslimat Adresi</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">{order.shippingName}</p>
              <p>{order.shippingPhone}</p>
              <p className="mt-2">{order.shippingAddress}</p>
              <p>{order.shippingDistrict}, {order.shippingCity}</p>
              {order.shippingPostalCode && <p>{order.shippingPostalCode}</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">Ödeme Bilgisi</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Yöntem</span>
                <span className="font-medium">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Durum</span>
                <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'}
                </span>
              </div>
            </div>
          </div>

          {order.customerNote && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <h3 className="font-semibold text-yellow-800 text-sm mb-1">Müşteri Notu</h3>
              <p className="text-yellow-700 text-sm">{order.customerNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
