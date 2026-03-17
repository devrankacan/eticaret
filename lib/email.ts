import nodemailer from 'nodemailer'
import { prisma } from './prisma'

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

async function getSiteInfo() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ['site_name', 'site_logo', 'site_email', 'site_phone'] } },
  })
  const map = Object.fromEntries(settings.map(s => [s.key, s.value ?? '']))
  return {
    name: map.site_name || 'Mağazamız',
    logo: map.site_logo || '',
    email: map.site_email || '',
    phone: map.site_phone || '',
  }
}

function buildResetEmailHtml(opts: {
  userName: string
  code: string
  siteName: string
  siteEmail: string
  sitePhone: string
  siteLogo: string
}) {
  const { userName, code, siteName, siteEmail, sitePhone, siteLogo } = opts

  const logoHtml = siteLogo
    ? `<img src="${siteLogo}" alt="${siteName}" style="max-height:52px;max-width:180px;object-fit:contain;display:block;" />`
    : `<span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${siteName}</span>`

  const digits = code.split('').map(d =>
    `<span style="display:inline-block;width:48px;height:60px;line-height:60px;text-align:center;font-size:28px;font-weight:800;color:#1a1a2e;background:#f0fdf4;border:2px solid #86efac;border-radius:12px;margin:0 4px;">${d}</span>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Şifre Sıfırlama</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
              ${logoHtml}
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e8eaf0;border-right:1px solid #e8eaf0;">

              <!-- İkon -->
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;width:64px;height:64px;background:#f0fdf4;border-radius:50%;line-height:64px;text-align:center;font-size:30px;">🔐</div>
              </div>

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;text-align:center;">
                Şifre Sıfırlama İsteği
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;text-align:center;line-height:1.6;">
                Merhaba <strong style="color:#111827;">${userName}</strong>, hesabınız için şifre sıfırlama kodu talep edildi.
              </p>

              <!-- Kod kutusu -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">
                  Doğrulama Kodunuz
                </p>
                <div style="letter-spacing:0;">
                  ${digits}
                </div>
                <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">
                  ⏱ Bu kod <strong>15 dakika</strong> geçerlidir
                </p>
              </div>

              <!-- Uyarılar -->
              <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:28px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                  <strong>⚠ Güvenlik Uyarısı:</strong> Bu kodu kimseyle paylaşmayın.
                  ${siteName} ekibi sizden hiçbir zaman bu kodu talep etmez.
                </p>
              </div>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;text-align:center;">
                Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.<br />
                Hesabınız güvende olmaya devam edecektir.
              </p>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="background:#ffffff;padding:0 40px;border-left:1px solid #e8eaf0;border-right:1px solid #e8eaf0;">
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0;" />
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#ffffff;padding:24px 40px 32px;border-radius:0 0 16px 16px;border:1px solid #e8eaf0;border-top:none;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">${siteName}</p>
              ${siteEmail ? `<p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">${siteEmail}</p>` : ''}
              ${sitePhone ? `<p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">${sitePhone}</p>` : ''}
              <p style="margin:16px 0 0;font-size:11px;color:#d1d5db;">
                Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

function buildVerifyEmailHtml(opts: {
  userName: string
  code: string
  siteName: string
  siteEmail: string
  sitePhone: string
  siteLogo: string
}) {
  const { userName, code, siteName, siteEmail, sitePhone, siteLogo } = opts

  const logoHtml = siteLogo
    ? `<img src="${siteLogo}" alt="${siteName}" style="max-height:52px;max-width:180px;object-fit:contain;display:block;" />`
    : `<span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${siteName}</span>`

  const digits = code.split('').map(d =>
    `<span style="display:inline-block;width:48px;height:60px;line-height:60px;text-align:center;font-size:28px;font-weight:800;color:#1a1a2e;background:#f0fdf4;border:2px solid #86efac;border-radius:12px;margin:0 4px;">${d}</span>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>E-posta Doğrulama</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
              ${logoHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e8eaf0;border-right:1px solid #e8eaf0;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;width:64px;height:64px;background:#f0fdf4;border-radius:50%;line-height:64px;text-align:center;font-size:30px;">✉️</div>
              </div>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;text-align:center;">
                E-posta Adresinizi Doğrulayın
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;text-align:center;line-height:1.6;">
                Merhaba <strong style="color:#111827;">${userName}</strong>, hesabınızı oluşturmak için aşağıdaki doğrulama kodunu girin.
              </p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">
                  Doğrulama Kodunuz
                </p>
                <div style="letter-spacing:0;">${digits}</div>
                <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">
                  ⏱ Bu kod <strong>15 dakika</strong> geçerlidir
                </p>
              </div>
              <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:28px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                  <strong>⚠ Güvenlik Uyarısı:</strong> Bu kodu kimseyle paylaşmayın.
                  ${siteName} ekibi sizden hiçbir zaman bu kodu talep etmez.
                </p>
              </div>
              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;text-align:center;">
                Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:0 40px;border-left:1px solid #e8eaf0;border-right:1px solid #e8eaf0;">
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:24px 40px 32px;border-radius:0 0 16px 16px;border:1px solid #e8eaf0;border-top:none;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">${siteName}</p>
              ${siteEmail ? `<p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">${siteEmail}</p>` : ''}
              ${sitePhone ? `<p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">${sitePhone}</p>` : ''}
              <p style="margin:16px 0 0;font-size:11px;color:#d1d5db;">Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendEmailVerificationCode(to: string, userName: string, code: string) {
  const site = await getSiteInfo()
  const transporter = getTransporter()

  const html = buildVerifyEmailHtml({
    userName,
    code,
    siteName: site.name,
    siteEmail: site.email,
    sitePhone: site.phone,
    siteLogo: site.logo,
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"${site.name}" <${process.env.SMTP_USER}>`,
    to,
    subject: `${code} — E-posta Doğrulama Kodunuz | ${site.name}`,
    html,
  })
}

// ─── Sipariş E-posta Şablonları ──────────────────────────────────────────────

const ADMIN_EMAIL = 'mustafaates75@icloud.com'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Havale / EFT',
  cash_on_delivery_cash: 'Kapıda Nakit Ödeme',
  cash_on_delivery_card: 'Kapıda Kredi Kartı ile Ödeme',
  credit_card: 'Kredi / Banka Kartı',
}

function formatTL(amount: number) {
  return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'
}

function buildEmailBase(opts: {
  siteName: string
  siteLogo: string
  siteEmail: string
  sitePhone: string
  headerTitle: string
  headerIcon: string
  bodyHtml: string
}) {
  const { siteName, siteLogo, siteEmail, sitePhone, headerTitle, headerIcon, bodyHtml } = opts
  const logoHtml = siteLogo
    ? `<img src="${siteLogo}" alt="${siteName}" style="max-height:52px;max-width:200px;object-fit:contain;display:block;margin:0 auto;" />`
    : `<span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${siteName}</span>`

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f0ece6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece6;padding:32px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#3d1f08 0%,#6b3a1f 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
            ${logoHtml}
            <p style="margin:16px 0 0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:0.5px;text-transform:uppercase;">${siteName}</p>
          </td>
        </tr>

        <!-- İKON + BAŞLIK -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 0;border-left:1px solid #e8e0d8;border-right:1px solid #e8e0d8;text-align:center;">
            <div style="display:inline-block;width:72px;height:72px;background:#fdf6ee;border:2px solid #e8c9a0;border-radius:50%;line-height:68px;text-align:center;font-size:32px;margin-bottom:20px;">${headerIcon}</div>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1a0a00;">${headerTitle}</h1>
          </td>
        </tr>

        <!-- İÇERİK -->
        <tr>
          <td style="background:#ffffff;padding:24px 40px 36px;border-left:1px solid #e8e0d8;border-right:1px solid #e8e0d8;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#3d1f08;padding:24px 40px;border-radius:0 0 16px 16px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#fff;">${siteName}</p>
            ${siteEmail ? `<p style="margin:0 0 3px;font-size:12px;color:rgba(255,255,255,0.6);">${siteEmail}</p>` : ''}
            ${sitePhone ? `<p style="margin:0 0 3px;font-size:12px;color:rgba(255,255,255,0.6);">${sitePhone}</p>` : ''}
            <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,0.4);">Bu e-posta otomatik olarak gönderilmiştir.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildOrderItemsTable(items: { name: string; variationName?: string | null; qty: number; unitPrice: number; total: number }[]) {
  const rows = items.map(item => `
    <tr>
      <td style="padding:10px 12px;font-size:14px;color:#1a0a00;border-bottom:1px solid #f0ebe3;">
        <strong>${item.name}</strong>${item.variationName ? `<br/><span style="font-size:12px;color:#9c7a5a;">${item.variationName}</span>` : ''}
      </td>
      <td style="padding:10px 12px;text-align:center;font-size:14px;color:#4a3020;border-bottom:1px solid #f0ebe3;">${item.qty}</td>
      <td style="padding:10px 12px;text-align:right;font-size:14px;color:#4a3020;border-bottom:1px solid #f0ebe3;">${formatTL(item.unitPrice)}</td>
      <td style="padding:10px 12px;text-align:right;font-size:14px;font-weight:700;color:#1a0a00;border-bottom:1px solid #f0ebe3;">${formatTL(item.total)}</td>
    </tr>
  `).join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8ddd0;border-radius:12px;overflow:hidden;margin-bottom:20px;">
      <thead>
        <tr style="background:#fdf6ee;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9c7a5a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ürün</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#9c7a5a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Adet</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9c7a5a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Birim</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9c7a5a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Toplam</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildPriceSummary(opts: { subtotal: number; shippingCost: number; discount: number; total: number }) {
  const { subtotal, shippingCost, discount, total } = opts
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#6b4a2a;">Ara Toplam</td>
        <td style="padding:6px 0;text-align:right;font-size:14px;color:#6b4a2a;">${formatTL(subtotal)}</td>
      </tr>
      ${discount > 0 ? `<tr><td style="padding:6px 0;font-size:14px;color:#16a34a;">İndirim</td><td style="padding:6px 0;text-align:right;font-size:14px;color:#16a34a;">-${formatTL(discount)}</td></tr>` : ''}
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#6b4a2a;">Kargo</td>
        <td style="padding:6px 0;text-align:right;font-size:14px;color:#6b4a2a;">${shippingCost > 0 ? formatTL(shippingCost) : 'Ücretsiz'}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;font-size:17px;font-weight:800;color:#1a0a00;border-top:2px solid #e8ddd0;">Genel Toplam</td>
        <td style="padding:12px 0 0;text-align:right;font-size:17px;font-weight:800;color:#3d1f08;border-top:2px solid #e8ddd0;">${formatTL(total)}</td>
      </tr>
    </table>
  `
}

interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail?: string | null
  paymentMethod: string
  shippingAddress: string
  shippingCity: string
  shippingDistrict: string
  shippingPhone: string
  subtotal: number
  shippingCost: number
  discountAmount: number
  total: number
  items: { name: string; variationName?: string | null; qty: number; unitPrice: number; total: number }[]
}

function buildOrderConfirmationHtml(data: OrderEmailData, site: { name: string; logo: string; email: string; phone: string }) {
  const payLabel = PAYMENT_METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod
  const bodyHtml = `
    <p style="margin:0 0 24px;font-size:15px;color:#4a3020;text-align:center;line-height:1.7;">
      Merhaba <strong style="color:#1a0a00;">${data.customerName}</strong>,<br/>
      siparişiniz başarıyla alındı. En kısa sürede hazırlanacaktır.
    </p>

    <!-- Sipariş No -->
    <div style="background:#fdf6ee;border:1px solid #e8c9a0;border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#9c7a5a;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Sipariş Numarası</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#3d1f08;letter-spacing:1px;">#${data.orderNumber}</p>
    </div>

    <!-- Ürünler -->
    ${buildOrderItemsTable(data.items)}

    <!-- Fiyat özeti -->
    ${buildPriceSummary({ subtotal: data.subtotal, shippingCost: data.shippingCost, discount: data.discountAmount, total: data.total })}

    <!-- Ödeme + Teslimat -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td width="50%" style="padding-right:8px;vertical-align:top;">
          <div style="background:#f8f5f0;border-radius:12px;padding:16px 18px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#9c7a5a;text-transform:uppercase;letter-spacing:0.5px;">Ödeme Yöntemi</p>
            <p style="margin:0;font-size:14px;color:#1a0a00;font-weight:600;">${payLabel}</p>
          </div>
        </td>
        <td width="50%" style="padding-left:8px;vertical-align:top;">
          <div style="background:#f8f5f0;border-radius:12px;padding:16px 18px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#9c7a5a;text-transform:uppercase;letter-spacing:0.5px;">Teslimat Adresi</p>
            <p style="margin:0;font-size:14px;color:#1a0a00;line-height:1.5;">
              ${data.customerName}<br/>
              ${data.shippingAddress}<br/>
              ${data.shippingDistrict}, ${data.shippingCity}<br/>
              ${data.shippingPhone}
            </p>
          </div>
        </td>
      </tr>
    </table>
  `

  return buildEmailBase({
    siteName: site.name, siteLogo: site.logo, siteEmail: site.email, sitePhone: site.phone,
    headerTitle: 'Siparişiniz Alındı!',
    headerIcon: '🛍️',
    bodyHtml,
  })
}

function buildOrderStatusUpdateHtml(data: {
  orderNumber: string
  customerName: string
  newStatus: string
  statusLabel: string
  note?: string | null
  trackingNumber?: string | null
  cargoCompany?: string | null
  trackingUrl?: string | null
}, site: { name: string; logo: string; email: string; phone: string }) {
  const statusColors: Record<string, string> = {
    confirmed: '#16a34a', processing: '#2563eb', shipped: '#7c3aed',
    delivered: '#16a34a', cancelled: '#dc2626', refunded: '#dc2626',
  }
  const statusIcons: Record<string, string> = {
    confirmed: '✅', processing: '⚙️', shipped: '📦',
    delivered: '🎉', cancelled: '❌', refunded: '↩️',
  }
  const color = statusColors[data.newStatus] ?? '#3d1f08'
  const icon = statusIcons[data.newStatus] ?? '📋'

  const trackingHtml = data.trackingNumber ? `
    <div style="background:#f0f4ff;border:1px solid #c7d7ff;border-radius:12px;padding:16px 20px;margin-top:20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#3b5bdb;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Kargo Takip</p>
      <p style="margin:0 0 8px;font-size:14px;color:#1a1a2e;font-weight:600;">${data.cargoCompany ?? ''} — ${data.trackingNumber}</p>
      ${data.trackingUrl ? `<a href="${data.trackingUrl}" style="display:inline-block;background:#3b5bdb;color:#ffffff;font-size:13px;font-weight:600;padding:8px 20px;border-radius:8px;text-decoration:none;">Kargom Nerede?</a>` : ''}
    </div>
  ` : ''

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;color:#4a3020;text-align:center;line-height:1.7;">
      Merhaba <strong style="color:#1a0a00;">${data.customerName}</strong>,<br/>
      <strong>#${data.orderNumber}</strong> numaralı siparişinizde güncelleme var.
    </p>

    <div style="background:${color}15;border:1.5px solid ${color}40;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:28px;">${icon}</p>
      <p style="margin:0;font-size:18px;font-weight:800;color:${color};">${data.statusLabel}</p>
      ${data.note ? `<p style="margin:10px 0 0;font-size:14px;color:#4a3020;">${data.note}</p>` : ''}
    </div>

    ${trackingHtml}
  `

  return buildEmailBase({
    siteName: site.name, siteLogo: site.logo, siteEmail: site.email, sitePhone: site.phone,
    headerTitle: 'Sipariş Güncelleme',
    headerIcon: '📋',
    bodyHtml,
  })
}

function buildAdminNewOrderHtml(data: OrderEmailData, site: { name: string; logo: string; email: string; phone: string }) {
  const payLabel = PAYMENT_METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod
  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;color:#4a3020;text-align:center;">
      Yeni bir sipariş alındı. Detaylar aşağıdadır.
    </p>

    <div style="background:#fdf6ee;border:1px solid #e8c9a0;border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#9c7a5a;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Sipariş Numarası</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#3d1f08;">#${data.orderNumber}</p>
    </div>

    <!-- Müşteri Bilgisi -->
    <div style="background:#f8f5f0;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#9c7a5a;text-transform:uppercase;letter-spacing:0.5px;">Müşteri Bilgileri</p>
      <p style="margin:0;font-size:14px;color:#1a0a00;line-height:1.7;">
        <strong>${data.customerName}</strong><br/>
        ${data.customerEmail ? `${data.customerEmail}<br/>` : ''}
        ${data.shippingPhone}<br/>
        ${data.shippingAddress}, ${data.shippingDistrict} / ${data.shippingCity}
      </p>
    </div>

    <!-- Ürünler -->
    ${buildOrderItemsTable(data.items)}

    <!-- Fiyat -->
    ${buildPriceSummary({ subtotal: data.subtotal, shippingCost: data.shippingCost, discount: data.discountAmount, total: data.total })}

    <!-- Ödeme -->
    <div style="background:#fff8f0;border:1px solid #f5c99a;border-radius:12px;padding:14px 18px;text-align:center;">
      <p style="margin:0;font-size:14px;color:#1a0a00;">
        Ödeme Yöntemi: <strong>${payLabel}</strong>
      </p>
    </div>
  `

  return buildEmailBase({
    siteName: site.name, siteLogo: site.logo, siteEmail: site.email, sitePhone: site.phone,
    headerTitle: 'Yeni Sipariş Geldi!',
    headerIcon: '🔔',
    bodyHtml,
  })
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const site = await getSiteInfo()
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM || `"${site.name}" <${process.env.SMTP_USER}>`
  const subject = `Siparişiniz Alındı — #${data.orderNumber} | ${site.name}`

  // Müşteriye
  if (data.customerEmail) {
    await transporter.sendMail({
      from,
      to: data.customerEmail,
      subject,
      html: buildOrderConfirmationHtml(data, site),
    })
  }

  // Admine
  await transporter.sendMail({
    from,
    to: ADMIN_EMAIL,
    subject: `[Yeni Sipariş] #${data.orderNumber} — ${data.customerName}`,
    html: buildAdminNewOrderHtml(data, site),
  })
}

export async function sendOrderStatusUpdate(data: {
  orderNumber: string
  customerName: string
  customerEmail?: string | null
  newStatus: string
  statusLabel: string
  note?: string | null
  trackingNumber?: string | null
  cargoCompany?: string | null
  trackingUrl?: string | null
}) {
  const site = await getSiteInfo()
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM || `"${site.name}" <${process.env.SMTP_USER}>`
  const html = buildOrderStatusUpdateHtml(data, site)
  const subject = `Sipariş Güncelleme — #${data.orderNumber} | ${site.name}`

  if (data.customerEmail) {
    await transporter.sendMail({ from, to: data.customerEmail, subject, html })
  }

  await transporter.sendMail({
    from,
    to: ADMIN_EMAIL,
    subject: `[Sipariş Güncelleme] #${data.orderNumber} — ${data.statusLabel}`,
    html,
  })
}

export async function sendPasswordResetEmail(to: string, userName: string, code: string) {
  const site = await getSiteInfo()
  const transporter = getTransporter()

  const html = buildResetEmailHtml({
    userName,
    code,
    siteName: site.name,
    siteEmail: site.email,
    sitePhone: site.phone,
    siteLogo: site.logo,
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"${site.name}" <${process.env.SMTP_USER}>`,
    to,
    subject: `${code} — Şifre Sıfırlama Kodunuz | ${site.name}`,
    html,
  })
}
