import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, code, password } = await req.json()

    if (!email || !code || !password) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır.' }, { status: 400 })
    }

    const normalizedEmail = (email as string).trim().toLowerCase()

    const token = await prisma.passwordResetToken.findFirst({
      where: {
        email: normalizedEmail,
        code: String(code).trim(),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!token) {
      return NextResponse.json({ error: 'Kod geçersiz veya süresi dolmuş.' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ message: 'Şifreniz başarıyla güncellendi.' })
  } catch (err) {
    console.error('[sifre-sifirla]', err)
    return NextResponse.json({ error: 'Bir hata oluştu, lütfen tekrar deneyin.' }, { status: 500 })
  }
}
