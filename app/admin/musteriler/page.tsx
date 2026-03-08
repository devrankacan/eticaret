'use client'

import { useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
  _count: { orders: number }
}

export default function MusterilerPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [q, setQ] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/customers?page=${page}&q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setUsers(data.users)
    setTotal(data.total)
    setPages(data.pages)
    setLoading(false)
  }, [page, q])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Müşteriler</h1>
          <p className="text-sm text-gray-400">{total} kayıtlı müşteri</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-3 mb-4">
        <input className="w-full text-sm focus:outline-none" placeholder="İsim veya e-posta ile ara..." value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Müşteri bulunamadı</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b bg-gray-50">
                  <th className="p-4 text-left font-semibold">Müşteri</th>
                  <th className="p-4 text-left font-semibold">Telefon</th>
                  <th className="p-4 text-center font-semibold">Sipariş</th>
                  <th className="p-4 text-center font-semibold">Rol</th>
                  <th className="p-4 text-left font-semibold">Kayıt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="p-4 text-gray-500">{u.phone || '—'}</td>
                    <td className="p-4 text-center">
                      <span className="font-semibold text-gray-900">{u._count.orders}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Müşteri'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-400">{total} müşteri</p>
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
