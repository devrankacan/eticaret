import { prisma } from '@/lib/prisma'
import { formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import Link from 'next/link'

async function getDashboardData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const [
    todayOrders, monthlyOrders, pendingCount, lowStockCount,
    recentOrders, lowStockItems, pendingTransfers,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: today }, status: { notIn: ['cancelled', 'refunded'] } },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: monthStart }, status: { notIn: ['cancelled', 'refunded'] } },
    }),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.product.count({ where: { OR: [{ stock: 0 }, { stock: { lte: 5 } }] } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { items: true },
    }),
    prisma.product.findMany({
      where: { OR: [{ stock: 0 }, { stock: { lte: 5 } }] },
      include: { category: true },
      orderBy: { stock: 'asc' },
      take: 8,
    }),
    prisma.order.findMany({
      where: { paymentMethod: 'bank_transfer', paymentStatus: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return {
    todaySales: todayOrders.reduce((a, o) => a + o.total, 0),
    todayCount: todayOrders.length,
    monthlySales: monthlyOrders.reduce((a, o) => a + o.total, 0),
    monthlyCount: monthlyOrders.length,
    pendingCount,
    lowStockCount,
    recentOrders,
    lowStockItems,
    pendingTransfers,
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Dashboard</h1>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'BUGÜNKÜ SATIŞ', value: formatPrice(data.todaySales), sub: `${data.todayCount} sipariş`, color: 'border-primary-500' },
          { label: 'BU AY', value: formatPrice(data.monthlySales), sub: `${data.monthlyCount} sipariş`, color: 'border-blue-500' },
          { label: 'BEKLEYENLer', value: data.pendingCount.toString(), sub: 'sipariş', color: 'border-yellow-500' },
          { label: 'DÜŞÜK STOK', value: data.lowStockCount.toString(), sub: 'ürün', color: 'border-red-400' },
        ].map(card => (
          <div key={card.label} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${card.color}`}>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Son Siparişler */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Son Siparişler</h2>
            <Link href="/admin/siparisler" className="text-primary-600 text-sm hover:underline">Tümü →</Link>
          </div>
          <div className="space-y-2">
            {data.recentOrders.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">Henüz sipariş yok</p>
            )}
            {data.recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <Link href={`/admin/siparisler/${order.id}`}
                    className="font-semibold text-sm text-gray-800 hover:text-primary-600">
                    #{order.orderNumber}
                  </Link>
                  <p className="text-xs text-gray-400">{order.shippingName}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <p className="font-semibold text-sm text-gray-900 min-w-[80px] text-right">{formatPrice(order.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stok Uyarıları */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Stok Uyarıları</h2>
            <Link href="/admin/urunler?filter=low" className="text-primary-600 text-sm hover:underline">Tümü →</Link>
          </div>
          <div className="space-y-2">
            {data.lowStockItems.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600 py-6 justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium">Tüm stoklar yeterli</p>
              </div>
            ) : data.lowStockItems.map(product => (
              <div key={product.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/urunler/${product.id}`}
                    className="font-medium text-sm text-gray-800 hover:text-primary-600 truncate block">
                    {product.name}
                  </Link>
                  <p className="text-xs text-gray-400">{product.category.name}</p>
                </div>
                <span className={`ml-3 text-xs px-2 py-0.5 rounded-full font-medium ${
                  product.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {product.stock === 0 ? 'Tükendi' : `Son ${product.stock}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Havale Bekleyenler */}
        {data.pendingTransfers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="font-bold text-gray-900">Havale Onayı Bekleyenler</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b">
                    <th className="pb-2 text-left font-semibold">Sipariş No</th>
                    <th className="pb-2 text-left font-semibold">Müşteri</th>
                    <th className="pb-2 text-right font-semibold">Tutar</th>
                    <th className="pb-2 text-left font-semibold pl-4">Tarih</th>
                    <th className="pb-2 text-right font-semibold">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.pendingTransfers.map(order => (
                    <tr key={order.id}>
                      <td className="py-3">
                        <Link href={`/admin/siparisler/${order.id}`}
                          className="font-semibold text-primary-600 hover:underline">
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 text-gray-700">{order.shippingName}</td>
                      <td className="py-3 font-bold text-right">{formatPrice(order.total)}</td>
                      <td className="py-3 text-gray-400 pl-4">
                        {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 text-right">
                        <ApproveButton orderId={order.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ApproveButton({ orderId }: { orderId: string }) {
  return (
    <form action={`/api/admin/orders/${orderId}`} method="PATCH">
      <Link
        href={`/admin/siparisler/${orderId}`}
        className="inline-block bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium"
      >
        İncele & Onayla
      </Link>
    </form>
  )
}
