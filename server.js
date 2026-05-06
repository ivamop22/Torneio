```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

// Configuração para rodar o Next.js (Web)
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: path.join(__dirname, 'apps/web') });
const handle = app.getRequestHandler();

// Tenta carregar a API (se existir na pasta apps/api)
let apiApp;
try {
  // Ajuste o caminho abaixo se o ponto de entrada da sua API for outro (ex: dist/main.js)
  apiApp = require('./apps/api/dist/main'); 
} catch (e) {
  console.log("API não carregada via require, operando modo Next.js");
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Se a URL começar com /api, tentamos mandar para o roteador da API
    if (pathname.startsWith('/api')) {
      // Se a sua API for integrada ao Next.js (API Routes), o handle resolve
      // Caso contrário, o servidor Next tratará como rota normal
      await handle(req, res, parsedUrl);
    } else {
      // Rota normal do site
      await handle(req, res, parsedUrl);
    }
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err;
    console.log('> Servidor Arena pronto em http://localhost:' + (process.env.PORT || 3000));
  });
});
