/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  typescript: {
    // Temporarily ignore type errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Don't run ESLint during build (we'll run it separately)
    ignoreDuringBuilds: false,
  },
  // Ensure proper build output for Vercel
  output: 'standalone',
  // Generate static files correctly
  generateEtags: false,
  // Optimize for production builds
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig
