import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // better-sqlite3 uses native Node.js bindings — keep it server-side only
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
