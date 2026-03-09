'use client'

import Link from 'next/link'
import Script from 'next/script'

interface Props {
  username: string
  embedCode: string
}

export function InstagramFeed({ username, embedCode }: Props) {
  if (!username && !embedCode) return null

  const profileUrl = `https://www.instagram.com/${username.replace('@', '')}`

  // LightWidget iframe src'ini embed kodundan çıkar
  const iframeSrcMatch = embedCode.match(/src=["']([^"']+lightwidget[^"']+)["']/)
  const iframeSrc = iframeSrcMatch?.[1] ?? ''

  return (
    <div className="bg-white py-5">
      <div className="max-w-7xl mx-auto px-4">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f09433" />
                  <stop offset="25%" stopColor="#e6683c" />
                  <stop offset="50%" stopColor="#dc2743" />
                  <stop offset="75%" stopColor="#cc2366" />
                  <stop offset="100%" stopColor="#bc1888" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
              <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.8" fill="none" />
              <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
            </svg>
            <h2 className="font-bold text-base text-gray-900">Instagram</h2>
          </div>
          {username && (
            <Link
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-90 transition"
            >
              Takip Et @{username.replace('@', '')}
            </Link>
          )}
        </div>

        {/* LightWidget iframe */}
        {iframeSrc ? (
          <>
            <Script src="https://cdn.lightwidget.com/widgets/lightwidget.js" strategy="lazyOnload" />
            <iframe
              src={iframeSrc}
              scrolling="no"
              allowTransparency={true}
              className="lightwidget-widget w-full overflow-hidden"
              style={{ border: 'none' }}
            />
          </>
        ) : embedCode ? (
          <div dangerouslySetInnerHTML={{ __html: embedCode }} />
        ) : null}
      </div>
    </div>
  )
}
