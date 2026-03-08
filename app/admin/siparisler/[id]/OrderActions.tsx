'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ORDER_STATUS_LABELS } from '@/lib/utils'

interface CargoCompany {
  id: string
  name: string
  code: string
  trackingUrl: string | null
}

interface Order {
  id: string
  status: string
  paymentMethod: string
  paymentStatus: string
  cargoCompany: string | null
  cargoTrackingNumber: string | null
  cargoTrackingUrl: string | null
  adminNote: string | null
}

export function OrderActions({ order, cargoCompanies }: { order: Order; cargoCompanies: CargoCompany[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cargoCompany, setCargoCompany] = useState(order.cargoCompany ?? cargoCompanies[0]?.name ?? '')
  const [trackingNumber, setTrackingNumber] = useState(order.cargoTrackingNumber ?? '')
  const [status, setStatus] = useState(order.status)
  const [note, setNote] = useState('')
  const [adminNote, setAdminNote] = useState(order.adminNote ?? '')

  async function update(data: Record<string, any>) {
    setLoading(true)
    try {
      await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  function getTrackingUrl(): string {
    const company = cargoCompanies.find(c => c.name === cargoCompany)
    if (!company?.trackingUrl || !trackingNumber) return ''
    return company.trackingUrl.replace('{tracking_number}', trackingNumber)
  }

  return (
    <div className="space-y-4">
      {/* Kargo bilgisi */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Kargo Bilgisi</h2>

        {order.cargoTrackingNumber && (
          <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-blue-800">{order.cargoCompany}</p>
              <p className="text-blue-600 font-mono text-sm mt-0.5">{order.cargoTrackingNumber}</p>
            </div>
            {order.cargoTrackingUrl && (
              <a href={order.cargoTrackingUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex-shrink-0">
                Takip Et
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kargo Firması</label>
            <select
              value={cargoCompany}
              onChange={e => setCargoCompany(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            >
              {cargoCompanies.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Takip Numarası</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              placeholder="Kargo takip numarası"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <button
          onClick={() => update({ cargoCompany, cargoTrackingNumber: trackingNumber, cargoTrackingUrl: getTrackingUrl() })}
          disabled={loading || !trackingNumber}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          Kargoya Ver & Kaydet
        </button>
      </div>

      {/* Durum güncelle */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Durum Güncelle</h2>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:border-primary-500"
        >
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Not ekle (isteğe bağlı)"
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:border-primary-500 resize-none"
        />
        <button
          onClick={() => update({ status, note })}
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition"
        >
          Durumu Güncelle
        </button>

        {/* Havale onay butonu */}
        {order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'paid' && (
          <button
            onClick={() => update({ approvePayment: true })}
            disabled={loading}
            className="w-full mt-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition"
          >
            ✓ Havale Ödemesini Onayla
          </button>
        )}
      </div>

      {/* Admin notu */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-3">Admin Notu</h2>
        <textarea
          value={adminNote}
          onChange={e => setAdminNote(e.target.value)}
          rows={3}
          placeholder="Dahili not (müşteri göremez)..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:border-primary-500 resize-none"
        />
        <button
          onClick={() => update({ adminNote })}
          disabled={loading}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm transition"
        >
          Notu Kaydet
        </button>
      </div>
    </div>
  )
}
