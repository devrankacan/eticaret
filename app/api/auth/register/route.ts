import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { name, email, phone, password, passwordConfirm } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Tüm alanları doldurun.' }, { status: 400 })
  }

  if (password !== passwordConfirm) {
    return NextResponse.json({ error: 'Şifreler eşleşmiyor.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Şifre en az 8 karakter olmalı.' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Bu e-posta adresi zaten kayıtlı.' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, password: hashedPassword },
  })

  return NextResponse.json({ success: true, userId: user.id })
}
