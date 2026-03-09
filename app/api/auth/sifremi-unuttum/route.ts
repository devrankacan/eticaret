import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-posta adresi gereklidir.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Kullanıcıyı bul — bulunamasa bile aynı mesajı dön (güvenlik)
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    if (user && user.isActive) {
      // Önceki kullanılmamış kodları temizle
      await prisma.passwordResetToken.deleteMany({
        where: { email: normalizedEmail, usedAt: null },
      })

      const code = generateCode()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 dakika

      await prisma.passwordResetToken.create({
        data: { email: normalizedEmail, code, expiresAt },
      })

      await sendPasswordResetEmail(normalizedEmail, user.name, code)
    }

    // Her durumda aynı mesajı ver (kullanıcı tespitini engelle)
    return NextResponse.json({
      message: 'E-posta adresiniz kayıtlıysa doğrulama kodu gönderildi.',
    })
  } catch (err) {
    console.error('[sifremi-unuttum]', err)
    return NextResponse.json({ error: 'E-posta gönderilemedi, lütfen tekrar deneyin.' }, { status: 500 })
  }
}
