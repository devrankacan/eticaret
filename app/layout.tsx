import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { getAllSettings } from '@/lib/utils'
import { getCartCount } from '@/lib/cart'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAllSettings()
  return {
    title: { default: settings.site_name || 'Mağaza', template: `%s | ${settings.site_name || 'Mağaza'}` },
    description: settings.meta_description || '',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
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
