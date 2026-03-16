import { prisma } from '@/lib/prisma'
import SepetClient from './SepetClient'

export default async function SepetPage() {
  const [shippingSetting, minOrderSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'free_shipping_threshold' } }),
    prisma.setting.findUnique({ where: { key: 'min_order_amount' } }),
  ])
  const freeShippingThreshold = parseFloat(shippingSetting?.value || '3500') || 3500
  const minOrderAmount = parseFloat(minOrderSetting?.value || '0') || 0

  return <SepetClient freeShippingThreshold={freeShippingThreshold} minOrderAmount={minOrderAmount} />
}
