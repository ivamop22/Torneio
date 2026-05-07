/** @type {import('next').NextConfig} */

// URL interna do Railway — usada apenas no servidor (não exposta ao cliente)
const RAILWAY_API = process.env.API_URL ?? 'https://beach-tennis-api-production.up.railway.app';

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  /**
   * Proxy reverso: /api/* → Railway API
   *
   * O cliente chama https://torneiobeachtennis.com/api/...
   * O Next.js repassa a requisição para o Railway em background.
   * Sem CORS, sem expor a URL do Railway ao browser.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${RAILWAY_API}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
