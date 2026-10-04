/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true, // bật gzip/brotli cho responses
  images: {
    formats: ['image/avif', 'image/webp'], // ưu tiên AVIF rồi WebP thay vì JPEG/PNG
    minimumCacheTTL: 60 * 60 * 24 * 30,   // cache ảnh 30 ngày
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8081'
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  async headers() {
    return [
      {
        // Cache static assets dài hạn — giảm round-trip trên mobile
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*.(?:jpg|jpeg|png|webp|avif|svg|ico|woff2|woff))',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/backend-files/:path*',
        destination: 'https://p01--backend--4j4v4pb6yj96.code.run/files/:path*'
      }
    ]
  }
};

export default nextConfig;
