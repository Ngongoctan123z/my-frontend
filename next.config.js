/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
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
