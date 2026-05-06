// Arquivo de inicialização para a Hostinger
process.env.NODE_ENV = 'production';

// Diz para o servidor iniciar a interface Web do seu torneio
process.argv = ['node', 'next', 'start', 'apps/web', '-p', process.env.PORT || '3000'];

// Dá a partida no motor do Next.js
try {
  require('next/dist/bin/next');
} catch (e) {
  require('./apps/web/node_modules/next/dist/bin/next');
}
