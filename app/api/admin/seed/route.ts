import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {

  const results: string[] = []

  try {
    // Admin kullanıcısı
    const hashedPassword = await bcrypt.hash('Atesoglu.79', 10)
    const existingAdmin = await prisma.user.findFirst({
      where: { OR: [{ email: 'admin@site.com' }, { email: 'info@atesoglusut.com' }, { role: 'admin' }] }
    })
    if (existingAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { email: 'info@atesoglusut.com', password: hashedPassword, role: 'admin' }
      })
    } else {
      await prisma.user.create({
        data: { name: 'Admin', email: 'info@atesoglusut.com', password: hashedPassword, role: 'admin' }
      })
    }
    results.push('✅ Admin kullanıcısı')

    // Site ayarları
    const contactBranches = JSON.stringify([
      { id: '1', name: 'Esenyurt Şubesi', address: 'Saadetdere, Fevzi Çakmak Cd. No:9 D:11B, 34899 Esenyurt/İstanbul', phone: '02126905036', hours: '09:00-21:00' },
      { id: '2', name: 'Avcılar Şubesi',  address: 'Üniversite, Uran Cd. No:11, 34320 Avcılar/İstanbul',               phone: '02126905036', hours: '09:00-21:00' },
    ])
    const settings = [
      { key: 'site_name',                value: 'Ateşoğlu Süt ve Süt Ürünleri', group: 'general' },
      { key: 'site_logo',                value: '',                              group: 'general' },
      { key: 'site_phone',               value: '0537 779 0489',                group: 'contact' },
      { key: 'site_email',               value: 'info@atesoglusut.com',          group: 'contact' },
      { key: 'site_whatsapp',            value: '905385735075',                  group: 'contact' },
      { key: 'site_address',             value: 'Kubilaybey Mahallesi, Kars caddesi No:4, 75700 Göle/Ardahan', group: 'contact' },
      { key: 'contact_center_hours',     value: '09:00-21:00',                  group: 'contact' },
      { key: 'contact_branches',         value: contactBranches,                group: 'contact' },
      { key: 'about_text',               value: 'Ateşoğlu Süt ve Süt Ürünleri olarak Göle/Ardahan\'dan sofralarınıza en kaliteli ve doğal ürünleri ulaştırıyoruz. Geleneksel yöntemlerle üretilen peynirlerimiz, tereyağlarımız ve doğal ürünlerimizle her zaman yanınızdayız.', group: 'general' },
      { key: 'social_instagram',         value: 'https://www.instagram.com/atesoglu.sut/', group: 'social' },
      { key: 'social_facebook',          value: 'https://www.facebook.com/profile.php?id=61574833545804&locale=tr_TR', group: 'social' },
      { key: 'seo_title',                value: 'Ateşoğlu Süt ve Süt Ürünleri', group: 'seo' },
      { key: 'seo_description',          value: 'En kaliteli doğal bal, peynir, tereyağı ve organik gıda ürünleri.', group: 'seo' },
      { key: 'meta_description',         value: 'En kaliteli doğal bal, peynir, tereyağı ve organik gıda ürünleri.', group: 'seo' },
      { key: 'free_shipping_threshold',  value: '3500', group: 'shipping' },
      { key: 'min_order_amount',         value: '999',  group: 'shipping' },
      { key: 'bank_transfer_enabled',    value: '1',    group: 'payment' },
      { key: 'cash_on_delivery_enabled', value: '1',    group: 'payment' },
      { key: 'cash_on_delivery_fee',     value: '0',    group: 'payment' },
      { key: 'iyzico_enabled',           value: '0',    group: 'payment' },
      { key: 'iyzico_api_key',           value: '',     group: 'payment' },
      { key: 'iyzico_secret_key',        value: '',     group: 'payment' },
      { key: 'iyzico_base_url',          value: 'https://sandbox-api.iyzipay.com', group: 'payment' },
    ]
    for (const s of settings) {
      await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
    }
    results.push('✅ Site ayarları')


    return NextResponse.json({ success: true, results, message: 'Seed tamamlandı! Şimdi /admin adresine gidin.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, results }, { status: 500 })
  }
}
