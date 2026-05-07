'use strict';

/**
 * Entry point para Hostinger Node.js hosting.
 * Hostinger injeta process.env.PORT — o servidor DEVE escutar nessa porta.
 */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const port = parseInt(process.env.PORT || '3000', 10);
const dev  = false;

const app    = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, '0.0.0.0', () => {
      console.log(`[Beach Tennis] Servidor rodando na porta ${port}`);
      console.log(`[Beach Tennis] API URL: ${process.env.NEXT_PUBLIC_API_URL}`);
    });
  })
  .catch((err) => {
    console.error('[Beach Tennis] Erro ao iniciar Next.js:', err);
    process.exit(1);
  });
