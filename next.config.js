/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    forceSwcTransforms: false,
  },
}

module.exports = nextConfig
