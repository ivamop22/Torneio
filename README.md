# Torneio - Beach Tennis Platform

Monorepo inicial para gestão de torneios de Beach Tennis com Next.js, NestJS, Prisma e PostgreSQL/Supabase.

## Estrutura
- `apps/web`: frontend público e dashboard
- `apps/api`: API NestJS
- `packages/db`: Prisma schema, migrations e seed
- `docs`: arquitetura, regras e endpoints

## Rodando localmente
```bash
cp .env.example .env
pnpm install
pnpm --filter @btp/db prisma generate
pnpm --filter @btp/db prisma migrate deploy
pnpm dev
```

## Supabase
A migration SQL pronta está em `packages/db/prisma/migrations/0001_init/migration.sql`.
Você pode colar esse arquivo no SQL Editor do Supabase ou executar via Prisma usando a `DATABASE_URL`.
