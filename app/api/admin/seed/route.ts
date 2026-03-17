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
    const aboutText = `Ateşoğlu: 1997'den Beri Doğallığın Markası\n1997 yılında başlayan lezzet yolculuğumuzda, ilk günkü tutkumuzla sofralarınıza doğallık katmaya devam ediyoruz. Ateşoğlu Süt Ürünleri olarak, kurulduğumuz günden bu yana misyonumuz; doğanın en saf lezzetlerini, kaliteden ödün vermeden sizlerle buluşturmaktır.\nBaşarımızın sırrı, geleneksel üretim yöntemlerine olan bağlılığımızda ve hijyene verdiğimiz önemde saklıdır. Köy peynirinden mis kokulu tereyağına, sütün en taze tadına kadar uzanan geniş ürün yelpazemizin tamamı, katkısız ve hijyenik koşullarda üretilmektedir. Her bir ürünümüzde, "Ateşoğlu kalitesini" sofralarınıza güvenle taşıyoruz.\nZengin süt ürünleri reyonlarımızın yanı sıra, özenle seçilmiş şarküteri çeşitleri, doğal bal, ev yapımı reçeller ve taze köy yumurtaları gibi yöresel lezzetlerle de damak tadınıza hitap ediyoruz.\nÇeyrek asrı aşan tecrübemizle, geleneksel lezzetleri modern ve sağlıklı bir anlayışla birleştiriyor, sofralarınızın vazgeçilmezi olmak için çalışıyoruz. Doğallıktan ve kaliteden yana olan herkesi Ateşoğlu lezzet dünyasını keşfetmeye davet ediyoruz.`

    const settings = [
      { key: 'site_name',                value: 'Ateşoğlu Süt ve Süt Ürünleri',                                                            group: 'general' },
      { key: 'site_logo',                value: 'https://sablonmarketi.com/wp-content/uploads/2025/09/logo-4.png',                          group: 'general' },
      { key: 'about_text',               value: aboutText,                                                                                   group: 'general' },
      { key: 'site_phone',               value: '0537 779 0489',                                                                            group: 'contact' },
      { key: 'site_email',               value: 'info@atesoglusut.com',                                                                     group: 'contact' },
      { key: 'site_whatsapp',            value: '905385735075',                                                                             group: 'contact' },
      { key: 'site_address',             value: '',                                                                                          group: 'contact' },
      { key: 'contact_center_hours',     value: '09:00-21:00',                                                                              group: 'contact' },
      { key: 'contact_branches',         value: '[]',                                                                                       group: 'contact' },
      { key: 'social_instagram',         value: 'https://www.instagram.com/atesoglu.sut/',                                                  group: 'social' },
      { key: 'social_facebook',          value: 'https://www.facebook.com/profile.php?id=61574833545804&locale=tr_TR',                      group: 'social' },
      { key: 'seo_title',                value: 'Ateşoğlu Süt ve Süt Ürünleri',                                                            group: 'seo' },
      { key: 'seo_description',          value: 'En kaliteli doğal bal, peynir, tereyağı ve organik gıda ürünleri.',                        group: 'seo' },
      { key: 'meta_description',         value: 'En kaliteli doğal bal, peynir, tereyağı ve organik gıda ürünleri.',                        group: 'seo' },
      { key: 'free_shipping_threshold',  value: '3500',                                                                                     group: 'shipping' },
      { key: 'min_order_amount',         value: '999',                                                                                      group: 'shipping' },
      { key: 'bank_transfer_enabled',    value: '1',                                                                                        group: 'payment' },
      { key: 'cash_on_delivery_enabled', value: '1',                                                                                        group: 'payment' },
      { key: 'cash_on_delivery_fee',     value: '0',                                                                                        group: 'payment' },
      { key: 'iyzico_enabled',           value: '0',                                                                                        group: 'payment' },
      { key: 'iyzico_api_key',           value: '',                                                                                         group: 'payment' },
      { key: 'iyzico_secret_key',        value: '',                                                                                         group: 'payment' },
      { key: 'iyzico_base_url',          value: 'https://sandbox-api.iyzipay.com',                                                         group: 'payment' },
    ]
    for (const s of settings) {
      await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
    }
    results.push('✅ Site ayarları')

    // Kategoriler
    const categories = [
      { name: 'Peynirler',     slug: 'peynirler',  sortOrder: 1 },
      { name: 'Tereyağı',      slug: 'tereyagi',   sortOrder: 2 },
      { name: 'Bal & Pekmez',  slug: 'bal-pekmez', sortOrder: 3 },
      { name: 'Doğal Ürünler', slug: 'dogal-urunler', sortOrder: 4 },
    ]
    for (const c of categories) {
      await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
    }
    results.push('✅ Kategoriler')

    return NextResponse.json({ success: true, results, message: 'Seed tamamlandı! Şimdi /admin adresine gidin.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, results }, { status: 500 })
  }
}
