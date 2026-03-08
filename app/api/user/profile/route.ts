import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

  const userId = (session.user as any).id
  const { name, phone, currentPassword, newPassword } = await req.json()

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  const updateData: any = {}

  if (name) updateData.name = name
  if (phone !== undefined) updateData.phone = phone || null

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Mevcut şifrenizi girin' }, { status: 400 })
    }
    if (!user.password) {
      return NextResponse.json({ error: 'Şifre değiştirilemez' }, { status: 400 })
    }
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Mevcut şifre hatalı' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Yeni şifre en az 8 karakter olmalı' }, { status: 400 })
    }
    updateData.password = await bcrypt.hash(newPassword, 10)
  }

  await prisma.user.update({ where: { id: userId }, data: updateData })

  return NextResponse.json({ success: true })
}
