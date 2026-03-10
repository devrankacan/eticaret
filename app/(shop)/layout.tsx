export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'
import { getAllSettings } from '@/lib/utils'
import { unstable_cache } from 'next/cache'

const getCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, slug: true },
        },
      },
    }).catch(() => [])
  },
  ['nav-categories'],
  { revalidate: 300 } // 5 dakika
)

const getNavPages = unstable_cache(
  async () => {
    return prisma.page.findMany({
      where: { isActive: true, showInNav: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, slug: true, navLabel: true },
    }).catch(() => [])
  },
  ['nav-pages'],
  { revalidate: 300 } // 5 dakika
)

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, navPages] = await Promise.all([
    getCategories(),
    getAllSettings().catch(() => ({} as Record<string, string>)),
    getNavPages(),
  ])

  let navExtraItems: { label: string; href: string }[] = []
  try { navExtraItems = JSON.parse(settings.nav_extra_items || '[]') } catch {}

  return (
    <>
      <Header
        categories={categories}
        siteName={settings.site_name || 'Mağaza'}
        siteLogo={settings.site_logo || undefined}
        whatsapp={settings.site_whatsapp || undefined}
        socialLinks={{
          instagram: settings.social_instagram || undefined,
          facebook: settings.social_facebook || undefined,
          youtube: settings.social_youtube || undefined,
        }}
        announcementText={settings.announcement_text || undefined}
        announcementEnabled={settings.announcement_enabled !== '0'}
        freeShippingText={settings.free_shipping_text || undefined}
        freeShippingThreshold={settings.free_shipping_threshold || undefined}
        navPages={navPages}
        navExtraItems={navExtraItems}
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer
        siteName={settings.site_name || 'Mağaza'}
        siteLogo={settings.site_logo || undefined}
        socialLinks={{
          instagram: settings.social_instagram || undefined,
          facebook: settings.social_facebook || undefined,
          youtube: settings.social_youtube || undefined,
        }}
        footerLinks={settings.footer_links}
        footerAbout={settings.footer_about}
        navPages={navPages}
      />
    </>
  )
}
