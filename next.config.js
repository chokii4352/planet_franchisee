/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['your-project.supabase.co'],  // Supabase Storage 도메인으로 변경
  },
}

module.exports = nextConfig
