import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAllSettings } from '@/lib/utils'
import CheckoutForm from './CheckoutForm'

export default async function OdemePage() {
  const session = await getServerSession(authOptions)
  const cookieStore = cookies()

  // Sepeti DB'den doğrudan çek
  // Önce userId ile dene, boşsa sessionId ile dene (giriş öncesi eklenen ürünler için)
  const userId = (session?.user as any)?.id as string | undefined
  const sessionId = cookieStore.get('cart_session')?.value ?? ''

  const include = {
    product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
  } as const

  let cartItems = userId
    ? await prisma.cartItem.findMany({ where: { userId }, include, orderBy: { createdAt: 'asc' } })
    : []

  if (cartItems.length === 0 && sessionId) {
    cartItems = await prisma.cartItem.findMany({ where: { sessionId }, include, orderBy: { createdAt: 'asc' } })
  }

  console.log('[ODEME]', { userId, sessionId, cartCount: cartItems.length })

  if (cartItems.length === 0) {
    redirect('/sepet')
  }

  // Ayarları çek
  const settings = await getAllSettings()
  const bankInfo = {
    bank_name: settings.bank_name || '',
    bank_iban: settings.bank_iban || '',
    bank_account_holder: settings.bank_account_holder || '',
    bank_branch: settings.bank_branch || '',
  }
  const paymentEnabled = settings.payment_enabled === '1' && !!settings.payment_provider
  const freeShippingThreshold = parseFloat(settings.free_shipping_threshold || '0') || 0
  const minOrderAmount = parseFloat(settings.min_order_amount || '0') || 0

  // Serileştirilebilir veri hazırla
  const items = cartItems.map(item => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      stock: item.product.stock,
      images: item.product.images.map(img => ({ imagePath: img.imagePath })),
    },
  }))

  return (
    <CheckoutForm
      items={items}
      bankInfo={bankInfo}
      paymentEnabled={paymentEnabled}
      userName={(session?.user as any)?.name || ''}
      freeShippingThreshold={freeShippingThreshold}
      minOrderAmount={minOrderAmount}
    />
  )
}
