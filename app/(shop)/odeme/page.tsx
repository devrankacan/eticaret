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

  // Sepeti DB'den doğrudan çek — client fetch yok, timing sorunu yok
  const key = (session?.user as any)?.id
    ? { userId: (session!.user as any).id }
    : { sessionId: cookieStore.get('cart_session')?.value ?? '' }

  const cartItems = await prisma.cartItem.findMany({
    where: key,
    include: {
      product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Sepet boşsa yönlendir
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
    />
  )
}
