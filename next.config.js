/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['iyzipay', 'pg', '@prisma/adapter-pg'],
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
