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
}

export default nextConfig
