'use client'

import { useState, useEffect } from 'react'

interface Branch {
  id: string
  name: string
  address: string
  phone: string
  hours: string
}

export default function AdminIletisimPage() {
  const [centerAddress, setCenterAddress] = useState('')
  const [centerPhone, setCenterPhone] = useState('')
  const [centerEmail, setCenterEmail] = useState('')
  const [centerHours, setCenterHours] = useState('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '', hours: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setCenterAddress(data.site_address || '')
        setCenterPhone(data.site_phone || '')
        setCenterEmail(data.site_email || '')
        setCenterHours(data.contact_center_hours || '')
        try {
          setBranches(JSON.parse(data.contact_branches || '[]'))
        } catch {
          setBranches([])
        }
        setLoading(false)
      })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_address: centerAddress,
        site_phone: centerPhone,
        site_email: centerEmail,
        contact_center_hours: centerHours,
        contact_branches: JSON.stringify(branches),
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function addBranch() {
    if (!newBranch.name.trim() || !newBranch.address.trim()) return
    setBranches(prev => [...prev, { ...newBranch, id: Date.now().toString() }])
    setNewBranch({ name: '', address: '', phone: '', hours: '' })
  }

  function deleteBranch(id: string) {
    setBranches(prev => prev.filter(b => b.id !== id))
  }

  function startEdit(branch: Branch) {
    setEditingId(branch.id)
    setEditBranch({ ...branch })
  }

  function saveEdit() {
    if (!editBranch) return
    setBranches(prev => prev.map(b => b.id === editingId ? editBranch : b))
    setEditingId(null)
    setEditBranch(null)
  }

  if (loading) return <div className="p-6 text-center text-gray-400">Yükleniyor...</div>

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">İletişim Yönetimi</h1>
        <button
          onClick={save}
          disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      <div className="space-y-5">
        {/* Merkez Bilgileri */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Merkez Bilgileri</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Adres</label>
              <textarea
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                value={centerAddress}
                onChange={e => setCenterAddress(e.target.value)}
                placeholder="Merkez adres..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Telefon</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  value={centerPhone}
                  onChange={e => setCenterPhone(e.target.value)}
                  placeholder="0555 123 45 67"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">E-posta</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  value={centerEmail}
                  onChange={e => setCenterEmail(e.target.value)}
                  placeholder="info@site.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Çalışma Saatleri</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                value={centerHours}
                onChange={e => setCenterHours(e.target.value)}
                placeholder="Pzt-Cum 09:00–18:00"
              />
            </div>
          </div>
        </div>

        {/* Şubeler */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Şubeler</h2>

          {/* Mevcut şubeler */}
          {branches.length > 0 && (
            <div className="space-y-3 mb-5">
              {branches.map(branch => (
                <div key={branch.id} className="border border-gray-200 rounded-xl p-4">
                  {editingId === branch.id && editBranch ? (
                    <div className="space-y-2">
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                        value={editBranch.name}
                        onChange={e => setEditBranch({ ...editBranch, name: e.target.value })}
                        placeholder="Şube adı"
                      />
                      <textarea
                        rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                        value={editBranch.address}
                        onChange={e => setEditBranch({ ...editBranch, address: e.target.value })}
                        placeholder="Adres"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                          value={editBranch.phone}
                          onChange={e => setEditBranch({ ...editBranch, phone: e.target.value })}
                          placeholder="Telefon"
                        />
                        <input
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                          value={editBranch.hours}
                          onChange={e => setEditBranch({ ...editBranch, hours: e.target.value })}
                          placeholder="Çalışma saatleri"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg text-sm transition">Kaydet</button>
                        <button onClick={() => { setEditingId(null); setEditBranch(null) }} className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg text-sm transition hover:bg-gray-50">İptal</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{branch.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{branch.address}</p>
                        {branch.phone && <p className="text-sm text-gray-500">{branch.phone}</p>}
                        {branch.hours && <p className="text-xs text-gray-400 mt-0.5">{branch.hours}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => startEdit(branch)}
                          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => deleteBranch(branch.id)}
                          className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Yeni şube ekle */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Yeni Şube Ekle</p>
            <div className="space-y-2">
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                value={newBranch.name}
                onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                placeholder="Şube adı (örn. Kadıköy Şubesi)"
              />
              <textarea
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                value={newBranch.address}
                onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                placeholder="Şube adresi"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  value={newBranch.phone}
                  onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                  placeholder="Telefon"
                />
                <input
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  value={newBranch.hours}
                  onChange={e => setNewBranch({ ...newBranch, hours: e.target.value })}
                  placeholder="Çalışma saatleri"
                />
              </div>
              <button
                onClick={addBranch}
                disabled={!newBranch.name.trim() || !newBranch.address.trim()}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-medium transition"
              >
                + Şube Ekle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi!' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}
