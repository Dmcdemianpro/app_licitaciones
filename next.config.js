/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  swcMinify: false,
  experimental: {
    forceSwcTransforms: false,
  },
}

module.exports = nextConfig
