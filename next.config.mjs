/** @type {import('next').NextConfig} */
const nextConfig = {
  // Producción: habilitar validación de TypeScript y ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Optimización deshabilitada solo para desarrollo/self-hosted
    // Habilitar en producción con CDN si es posible
    unoptimized: true,
  },
  // Mejoras de seguridad
  poweredByHeader: false,
  reactStrictMode: true,
  // Fix para NextAuth v5 beta con Next.js 15
  transpilePackages: ["next-auth"],
  // Skip static optimization for error pages (temporal fix for Next.js 15 Html import issue)
  skipTrailingSlashRedirect: true,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

export default nextConfig
