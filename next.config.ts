import type { NextConfig } from "next";

const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || '*'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors ${allowedOrigins}`,
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
