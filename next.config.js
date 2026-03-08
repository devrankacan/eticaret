/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Hostinger'da local ve harici görseller için
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Hostinger Node.js için standalone build
  output: 'standalone',
};

module.exports = nextConfig;
