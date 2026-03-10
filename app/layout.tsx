import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { getAllSettings } from '@/lib/utils'
import { getCartCount } from '@/lib/cart'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export async function generateMetadata(): Promise<Metadata> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return { title: { default: 'Mağaza', template: '%s | Mağaza' }, description: '' }
  }
  const settings = await getAllSettings().catch(() => ({} as Record<string, string>))
  return {
    title: { default: settings.site_name || 'Mağaza', template: `%s | ${settings.site_name || 'Mağaza'}` },
    description: settings.meta_description || '',
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cartCount = await getCartCount().catch(() => 0)

  return (
    <html lang="tr">
      <body className="min-h-screen flex flex-col">
        <Providers initialCartCount={cartCount}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
