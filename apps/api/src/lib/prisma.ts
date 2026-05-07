import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        // connection_limit e pool_timeout evitam erros de "primeira tentativa"
        // causados por conexões frias no Railway
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Aquecer a conexão com o banco na inicialização do servidor.
// Evita timeout na primeira requisição após cold start do Railway.
prisma
  .$connect()
  .then(() => console.log('[Prisma] Conexão estabelecida'))
  .catch((err) => console.error('[Prisma] Falha ao conectar:', err));
