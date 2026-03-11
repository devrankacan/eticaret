'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_LABELS } from '@/lib/utils'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  shippingName: string
  shippingPhone: string
  shippingCity: string
  shippingDistrict: string
  shippingAddress: string
  total: number
  createdAt: string
  _count: { items: number }
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'pending', label: 'Beklemede' },
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'processing', label: 'Hazırlanıyor' },
  { value: 'shipped', label: 'Kargoya Verildi' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal Edildi' },
  { value: 'refunded', label: 'İade Edildi' },
]

export default function SiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/orders?page=${page}&q=${encodeURIComponent(q)}&status=${status}`)
    const data = await res.json()
    setOrders(data.orders)
    setTotal(data.total)
    setPages(data.pages)
    setLoading(false)
  }, [page, q, status])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Siparişler</h1>
          <p className="text-sm text-gray-400">{total} sipariş</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl shadow-sm p-3 mb-4 flex flex-wrap gap-3">
        <input
          className="flex-1 min-w-[180px] text-sm focus:outline-none"
          placeholder="Sipariş no, isim veya telefon ara..."
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }}
        />
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Sipariş bulunamadı</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b bg-gray-50">
                  <th className="p-4 text-left font-semibold">Sipariş No</th>
                  <th className="p-4 text-left font-semibold">Müşteri</th>
                  <th className="p-4 text-center font-semibold">Ürün</th>
                  <th className="p-4 text-left font-semibold">Durum</th>
                  <th className="p-4 text-left font-semibold">Ödeme</th>
                  <th className="p-4 text-right font-semibold">Toplam</th>
                  <th className="p-4 text-left font-semibold">Tarih</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono text-xs font-semibold text-gray-700">
                      #{order.orderNumber}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{order.shippingName}</p>
                      <p className="text-xs text-gray-400">{order.shippingPhone} · {order.shippingDistrict}/{order.shippingCity}</p>
                      <p className="text-xs text-gray-300 truncate max-w-[180px]">{order.shippingAddress}</p>
                    </td>
                    <td className="p-4 text-center text-gray-500">{order._count.items} ürün</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-gray-500">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
                      <p className={`text-xs font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {order.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'}
                      </p>
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900">{formatPrice(order.total)}</td>
                    <td className="p-4 text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/siparisler/${order.id}`}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
                      >
                        Detay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-400">{total} sipariş</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">← Önceki</button>
                <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">Sonraki →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
