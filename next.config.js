/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Public runtime config for client-side access
  publicRuntimeConfig: {
    epubApiUrl: process.env.NEXT_PUBLIC_EPUB_API_URL,
  },
}

module.exports = nextConfig
