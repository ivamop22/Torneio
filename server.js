const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

// Configuração para rodar o Next.js (Web)
const dev = process.env.NODE_ENV !== 'production';
// Aponta explicitamente para a pasta da aplicação web
const app = next({ dev, dir: path.resolve(__dirname, 'apps/web') });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Se a URL começar com /api, o Next.js tentará resolver via API Routes (apps/web/app/api/...)
    // Se a sua API for um serviço NestJS separado (apps/api), o redirecionamento ocorre aqui
    if (pathname.startsWith('/api')) {
      // Deixamos o Next.js lidar. Se não houver rota, ele retornará o 404 que você viu.
      await handle(req, res, parsedUrl);
    } else {
      // Rota normal do site (frontend)
      await handle(req, res, parsedUrl);
    }
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err;
    console.log('> Servidor pronto em produção');
  });
});
