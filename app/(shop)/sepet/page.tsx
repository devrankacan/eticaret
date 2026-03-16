import { prisma } from '@/lib/prisma'
import SepetClient from './SepetClient'

export default async function SepetPage() {
  const setting = await prisma.setting.findUnique({ where: { key: 'free_shipping_threshold' } })
  const freeShippingThreshold = parseFloat(setting?.value || '3500') || 3500

  return <SepetClient freeShippingThreshold={freeShippingThreshold} />
}
