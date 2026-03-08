'use client'

import { useState, useEffect } from 'react'

interface CargoCompany {
  id: string
  name: string
  code: string
  apiUrl: string | null
  apiUser: string | null
  customerNumber: string | null
  trackingUrl: string | null
  freeShippingThreshold: number | null
  baseShippingCost: number
  isActive: boolean
  isDefault: boolean
}

export default function CargoSettings() {
  const [companies, setCompanies] = useState<CargoCompany[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/cargo')
      .then(r => r.json())
      .then(d => setCompanies(d.companies ?? []))
  }, [])

  async function save(company: CargoCompany, formData: FormData) {
    setSaving(company.id)
    const data = {
      apiUrl: formData.get('apiUrl') as string,
      apiUser: formData.get('apiUser') as string,
      apiPassword: formData.get('apiPassword') as string || undefined,
      customerNumber: formData.get('customerNumber') as string,
      trackingUrl: formData.get('trackingUrl') as string,
      freeShippingThreshold: parseFloat(formData.get('freeShippingThreshold') as string) || null,
      baseShippingCost: parseFloat(formData.get('baseShippingCost') as string) || 0,
      isActive: formData.get('isActive') === 'on',
      isDefault: formData.get('isDefault') === 'on',
    }
    await fetch(`/api/admin/cargo/${company.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(null)
    setSuccess(company.name)
    setTimeout(() => setSuccess(null), 3000)
    // Refresh
    fetch('/api/admin/cargo').then(r => r.json()).then(d => setCompanies(d.companies ?? []))
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Kargo Entegrasyonu</h1>
      <p className="text-gray-500 text-sm mb-6">
        Kargo firması API bilgilerini girin. API olmadan da manuel takip numarası girişi çalışır.
        Takip URL&apos;sindeki <code className="bg-gray-100 px-1 rounded">{'{tracking_number}'}</code> ifadesi otomatik değiştirilir.
      </p>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm">
          ✓ {success} ayarları kaydedildi.
        </div>
      )}

      <div className="space-y-4">
        {companies.map(company => (
          <div key={company.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{company.name}</h3>
                  <div className="flex gap-2 mt-0.5">
                    {company.isActive && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Aktif</span>
                    )}
                    {company.isDefault && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Varsayılan</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={e => { e.preventDefault(); save(company, new FormData(e.currentTarget)) }}
              className="p-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">API URL</label>
                  <input name="apiUrl" type="url" defaultValue={company.apiUrl ?? ''}
                    placeholder="https://api.kargofirmasi.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">API Kullanıcı</label>
                  <input name="apiUser" type="text" defaultValue={company.apiUser ?? ''}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">API Şifre</label>
                  <input name="apiPassword" type="password" placeholder="Boş bırakırsanız değişmez"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Müşteri Hesap No</label>
                  <input name="customerNumber" type="text" defaultValue={company.customerNumber ?? ''}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Takip URL&apos;si <span className="text-gray-400">(takip no için {'{tracking_number}'})</span>
                  </label>
                  <input name="trackingUrl" type="text" defaultValue={company.trackingUrl ?? ''}
                    placeholder="https://kargo.com/takip?no={tracking_number}"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ücretsiz Kargo Limiti (TL)</label>
                  <input name="freeShippingThreshold" type="number" step="0.01" min="0"
                    defaultValue={company.freeShippingThreshold ?? ''}
                    placeholder="500"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kargo Ücreti (TL)</label>
                  <input name="baseShippingCost" type="number" step="0.01" min="0"
                    defaultValue={company.baseShippingCost}
                    placeholder="29.90"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500" />
                </div>
              </div>

              <div className="flex items-center gap-6 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input name="isActive" type="checkbox" defaultChecked={company.isActive}
                    className="rounded border-gray-300 text-primary-600" />
                  <span className="text-sm text-gray-700 font-medium">Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input name="isDefault" type="checkbox" defaultChecked={company.isDefault}
                    className="rounded border-gray-300 text-primary-600" />
                  <span className="text-sm text-gray-700 font-medium">Varsayılan</span>
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button type="submit" disabled={saving === company.id}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition">
                  {saving === company.id ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
