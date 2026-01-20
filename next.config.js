/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  swcMinify: false,
  experimental: {
    swcTraceProfiling: false,
  },
}

module.exports = nextConfig
