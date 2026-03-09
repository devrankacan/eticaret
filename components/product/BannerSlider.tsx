'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Banner {
  id: string
  title: string | null
  imageDesktop: string
  imageMobile: string | null
  link: string | null
}

export function BannerSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % banners.length)
  }, [banners.length])

  const prev = useCallback(() => {
    setCurrent(c => (c === 0 ? banners.length - 1 : c - 1))
  }, [banners.length])

  // Otomatik kaydırma
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [next, banners.length])

  if (banners.length === 0) return null

  return (
    <div className="relative overflow-hidden bg-gray-200">
      {/* Slider track */}
      <div
        className="flex slider-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => {
          const content = (
            <div className="min-w-full relative">
              {/* Mobil görsel */}
              {banner.imageMobile && (
                <Image
                  src={banner.imageMobile.startsWith('data:') || banner.imageMobile.startsWith('http') ? banner.imageMobile : `/${banner.imageMobile}`}
                  alt={banner.title ?? ''}
                  width={800}
                  height={400}
                  className="w-full object-cover sm:hidden"
                  priority
                  unoptimized={banner.imageMobile.startsWith('data:')}
                />
              )}
              {/* Desktop görsel */}
              <Image
                src={banner.imageDesktop.startsWith('data:') || banner.imageDesktop.startsWith('http') ? banner.imageDesktop : `/${banner.imageDesktop}`}
                alt={banner.title ?? ''}
                width={1920}
                height={600}
                className={`w-full object-cover max-h-72 sm:max-h-96 lg:max-h-[500px] ${banner.imageMobile ? 'hidden sm:block' : 'block'}`}
                priority
                unoptimized={banner.imageDesktop.startsWith('data:')}
              />
            </div>
          )

          return banner.link ? (
            <Link key={banner.id} href={banner.link} className="block min-w-full">
              {content}
            </Link>
          ) : (
            <div key={banner.id}>{content}</div>
          )
        })}
      </div>

      {/* Nokta göstergeler */}
      {banners.length > 1 && (
        <>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 bg-white' : 'w-2 bg-white/50'
                }`}
                aria-label={`Banner ${i + 1}`}
              />
            ))}
          </div>

          {/* Ok butonları (sadece sm+) */}
          <button
            onClick={prev}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-10 h-10 rounded-full items-center justify-center transition"
            aria-label="Önceki"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white w-10 h-10 rounded-full items-center justify-center transition"
            aria-label="Sonraki"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
