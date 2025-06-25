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
}

module.exports = nextConfig