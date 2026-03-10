import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { prisma } from './prisma'
import { unstable_cache } from 'next/cache'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' TL'
}

export function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `SP${dateStr}${random}`
}

export function getCargoTrackingUrl(trackingUrl: string, trackingNumber: string): string {
  return trackingUrl.replace('{tracking_number}', trackingNumber)
}

// Site ayarlarını 5 dakika önbellekte tut (Neon traffic azaltır)
export const getAllSettings = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const settings = await prisma.setting.findMany()
    return Object.fromEntries(settings.map(s => [s.key, s.value ?? '']))
  },
  ['all-settings'],
  { revalidate: 300 } // 5 dakika
)

// Tek ayar getir (cache'den)
export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const settings = await getAllSettings().catch(() => ({} as Record<string, string>))
  return settings[key] ?? defaultValue
}

// Ayar önbelleğini temizle (admin panelden ayar kaydedilince çağrılır)
export async function revalidateSettings() {
  const { revalidateTag } = await import('next/cache')
  revalidateTag('all-settings')
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:    'Beklemede',
  confirmed:  'Onaylandı',
  processing: 'Hazırlanıyor',
  shipped:    'Kargoya Verildi',
  delivered:  'Teslim Edildi',
  cancelled:  'İptal Edildi',
  refunded:   'İade Edildi',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-orange-100 text-orange-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
  refunded:   'bg-gray-100 text-gray-700',
}

export const PAYMENT_LABELS: Record<string, string> = {
  credit_card:      'Kredi Kartı',
  bank_transfer:    'Havale/EFT',
  cash_on_delivery: 'Kapıda Ödeme',
}
