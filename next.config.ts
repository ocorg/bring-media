export const runtime = 'edge'; // faster cold start than Node.js
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';


const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflarestorage.com',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
export const dynamic = 'force-dynamic';