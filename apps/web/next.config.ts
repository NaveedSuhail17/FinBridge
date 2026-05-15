import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@finbridge/ui', '@finbridge/sdk', '@finbridge/types'],
};

export default nextConfig;
