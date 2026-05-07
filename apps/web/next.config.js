/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' é para Docker/Vercel — remover para Hostinger Node.js
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
module.exports = nextConfig;
