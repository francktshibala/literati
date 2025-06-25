/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  typescript: {
    // Only ignore type errors during build for initial deployment
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    // Don't run ESLint during build on Vercel (runs separately)
    ignoreDuringBuilds: true,
  },
  // Optimize for production builds
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig
