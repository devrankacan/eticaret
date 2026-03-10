import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await prisma.page.findUnique({
    where: { slug: params.slug, isActive: true },
  })
  if (!page) return { title: 'Sayfa Bulunamadı' }
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt || undefined,
  }
}

export default async function DynamicPage({ params }: Props) {
  const page = await prisma.page.findUnique({
    where: { slug: params.slug, isActive: true },
  })

  if (!page) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{page.title}</h1>
      {page.excerpt && (
        <p className="text-gray-500 text-lg mb-6 leading-relaxed border-l-4 border-primary-300 pl-4">
          {page.excerpt}
        </p>
      )}
      <div
        className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-a:text-primary-600 prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  )
}
