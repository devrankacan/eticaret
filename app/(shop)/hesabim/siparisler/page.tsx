'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface OrderItem {
  productName: string
  productImage?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  subtotal: number
  shippingCost: number
  discountAmount: number
  total: number
  createdAt: string
  cargoCompany?: string
  cargoTrackingNumber?: string
  cargoTrackingUrl?: string
  items: OrderItem[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoya Verildi',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
  refunded: 'İade Edildi',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
}

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: 'Havale / EFT',
  cash_on_delivery: 'Kapıda Ödeme',
  credit_card: 'Kredi Kartı',
}

export default function SiparislerimPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/orders')
        .then(r => r.json())
        .then(data => {
          setOrders(data.orders || [])
          setLoading(false)
        })
    }
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
        Yükleniyor...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <Link href="/" className="hover:text-primary-600 transition">Ana Sayfa</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Siparişlerim</span>
      </nav>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Siparişlerim</h1>
        <p className="text-sm text-gray-400">{orders.length} sipariş</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium mb-1">Henüz siparişiniz yok</p>
          <p className="text-gray-400 text-sm mb-5">İlk siparişinizi vermek için alışverişe başlayın.</p>
          <Link href="/urunler" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-xl transition">
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Başlık */}
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div>
                    <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-gray-900">
                    {order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Detay */}
              {expanded === order.id && (
                <div className="border-t border-gray-100 p-4">
                  {/* Ürünler */}
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.productImage ? (
                          <Image
                            src={item.productImage.startsWith('http') ? item.productImage : `/${item.productImage}`}
                            alt={item.productName}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium line-clamp-1">{item.productName}</p>
                          <p className="text-xs text-gray-400">{item.quantity} adet × {item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-800 flex-shrink-0">
                          {item.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Fiyat özeti */}
                  <div className="border-t pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Ara Toplam</span>
                      <span>{order.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>İndirim</span>
                        <span>-{order.discountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-500">
                      <span>Kargo</span>
                      <span>{order.shippingCost > 0 ? `${order.shippingCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : 'Ücretsiz'}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 border-t pt-2 mt-1">
                      <span>Toplam</span>
                      <span>{order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    </div>
                  </div>

                  {/* Ödeme + Kargo */}
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Ödeme: <span className="font-medium text-gray-700">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span></span>
                    <span>Ödeme Durumu: <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{order.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'}</span></span>
                    {order.cargoCompany && <span>Kargo: <span className="font-medium text-gray-700">{order.cargoCompany}</span></span>}
                    {order.cargoTrackingNumber && order.cargoTrackingUrl && (
                      <a
                        href={order.cargoTrackingUrl.replace('{tracking_number}', order.cargoTrackingNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline font-medium"
                      >
                        Kargo Takip: {order.cargoTrackingNumber}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
