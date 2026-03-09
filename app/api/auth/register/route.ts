import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { email, code } = await req.json()

  if (!email || !code) {
    return NextResponse.json({ error: 'E-posta ve kod zorunludur.' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  const token = await prisma.emailVerificationToken.findFirst({
    where: {
      email: normalizedEmail,
      code: String(code).trim(),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })

  if (!token) {
    return NextResponse.json({ error: 'Kod geçersiz veya süresi dolmuş.' }, { status: 400 })
  }

  const { name, phone, hashedPassword } = JSON.parse(token.metadata)

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: 'Bu e-posta adresi zaten kayıtlı.' }, { status: 409 })
  }

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email: normalizedEmail, phone, password: hashedPassword },
    })
    await tx.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    })
    return newUser
  })

  return NextResponse.json({ success: true, userId: user.id })
}
