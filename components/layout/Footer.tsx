import Link from 'next/link'
import Image from 'next/image'

interface FooterProps {
  siteName: string
  siteLogo?: string
  phone?: string
  email?: string
  whatsapp?: string
}

export function Footer({ siteName, siteLogo, phone, email, whatsapp }: FooterProps) {
  return (
    <footer className="bg-[#fdf8f3] border-t border-[#e8cba8] mt-8">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Logo & Hakkında */}
          <div>
            {siteLogo ? (
              <Image src={siteLogo} alt={siteName} width={140} height={48} className="h-12 w-auto object-contain mb-3" unoptimized />
            ) : (
              <h3 className="font-bold text-lg mb-3 text-[#3d1f08]">{siteName}</h3>
            )}
            <p className="text-gray-500 text-sm leading-relaxed">
              Kaliteli ürünleri uygun fiyatlarla kapınıza kadar getiriyoruz.
            </p>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp&apos;tan Yaz
              </a>
            )}
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h4 className="font-semibold mb-4 text-[#3d1f08]">Hızlı Linkler</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              {[
                { href: '/', label: 'Ana Sayfa' },
                { href: '/urunler', label: 'Tüm Ürünler' },
                { href: '/sepet', label: 'Sepetim' },
                { href: '/hesabim/siparisler', label: 'Siparişlerim' },
                { href: '/siparis-takip', label: 'Sipariş Takip' },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-[#3d1f08] transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h4 className="font-semibold mb-4 text-[#3d1f08]">İletişim</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              {phone && (
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${phone}`} className="hover:text-[#3d1f08] transition">{phone}</a>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${email}`} className="hover:text-[#3d1f08] transition">{email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#e8cba8] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-gray-400 text-sm">
          <span>© {new Date().getFullYear()} {siteName}. Tüm hakları saklıdır.</span>
          <span>
            Created By{' '}
            <a
              href="https://devrankacan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8b5e3c] hover:text-[#3d1f08] font-medium transition"
            >
              Devran Kaçan
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
