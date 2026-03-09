import Image from 'next/image'
import Link from 'next/link'

interface InstagramPost {
  image: string
  link?: string
}

interface Props {
  username: string
  posts: InstagramPost[]
}

export function InstagramFeed({ username, posts }: Props) {
  if (!username && posts.length === 0) return null

  const profileUrl = `https://www.instagram.com/${username.replace('@', '')}`

  return (
    <div className="bg-white py-5">
      <div className="max-w-7xl mx-auto px-4">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Instagram ikon */}
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
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4v8m-4-4h8" />
              </svg>
              Takip Et
            </Link>
          )}
        </div>

        {/* Kullanıcı adı */}
        {username && (
          <p className="text-sm text-gray-500 mb-4">
            <Link href={profileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">
              @{username.replace('@', '')} hesabından bizi takip etmeyi unutmayın!
            </Link>
          </p>
        )}

        {/* Post grid */}
        {posts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {posts.map((post, i) => (
              <Link
                key={i}
                href={post.link || profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
              >
                <Image
                  src={post.image}
                  alt={`Instagram post ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="1.8" fill="none" />
                    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.8" fill="none" />
                    <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
