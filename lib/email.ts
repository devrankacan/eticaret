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
