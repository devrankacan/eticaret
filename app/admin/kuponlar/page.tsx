'use client'

import { useState, useEffect } from 'react'

interface Coupon {
  id: string
  code: string
  type: string
  value: number
  minOrderAmount: number
  maxUses: number | null
  usedCount: number
  isActive: boolean
  startsAt: string | null
  expiresAt: string | null
}

const empty = { code: '', type: 'percentage', value: '', minOrderAmount: '', maxUses: '', isActive: true, startsAt: '', expiresAt: '' }

export default function KuponlarPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetch_ = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/coupons')
    setCoupons(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setShowForm(false)
    fetch_()
  }

  const del = async (id: string) => {
    if (!confirm('Bu kupon silinsin mi?')) return
    await fetch('/api/admin/coupons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetch_()
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Kuponlar</h1>
        <button onClick={() => { setForm(empty); setShowForm(true) }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Kupon
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Henüz kupon oluşturulmamış</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b bg-gray-50">
                <th className="p-4 text-left font-semibold">Kod</th>
                <th className="p-4 text-left font-semibold">İndirim</th>
                <th className="p-4 text-right font-semibold">Min. Tutar</th>
                <th className="p-4 text-center font-semibold">Kullanım</th>
                <th className="p-4 text-center font-semibold">Durum</th>
                <th className="p-4 text-right font-semibold">Son Tarih</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{c.code}</span>
                  </td>
                  <td className="p-4 font-semibold">
                    {c.type === 'percentage' ? `%${c.value}` : `${c.value} ₺`}
                  </td>
                  <td className="p-4 text-right text-gray-500">
                    {c.minOrderAmount > 0 ? `${c.minOrderAmount} ₺` : '—'}
                  </td>
                  <td className="p-4 text-center text-gray-500">
                    {c.usedCount} / {c.maxUses ?? '∞'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="p-4 text-right text-gray-400 text-xs">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('tr-TR') : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => del(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">Yeni Kupon</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Kupon Kodu <span className="text-red-500">*</span></label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="YENI10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Tür</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="percentage">Yüzde (%)</option>
                    <option value="fixed">Sabit (₺)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Değer <span className="text-red-500">*</span></label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percentage' ? '10' : '50'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Min. Sipariş (₺)</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Maks. Kullanım</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Sınırsız" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Başlangıç</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Bitiş</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-gray-700">Aktif</span>
              </label>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">İptal</button>
              <button onClick={save} disabled={saving || !form.code || !form.value} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
                {saving ? 'Oluşturuluyor...' : 'Kupon Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
