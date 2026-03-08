'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface Props {
  current: string
}

export function SortSelect({ current }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('siralama', e.target.value)
    params.delete('sayfa')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
    >
      <option value="yeni">En Yeni</option>
      <option value="populer">En Popüler</option>
      <option value="fiyat-artan">Fiyat ↑</option>
      <option value="fiyat-azalan">Fiyat ↓</option>
    </select>
  )
}
