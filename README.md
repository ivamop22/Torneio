# Torneio - Beach Tennis Platform

Monorepo para gestão de torneios de Beach Tennis com Next.js, NestJS, Prisma e PostgreSQL.

## Estrutura
- `apps/web`: frontend público e dashboard admin (Next.js)
- `apps/api`: API REST (NestJS)
- `packages/db`: Prisma schema, migrations e seed

## Rodando localmente
```bash
cp .env.example .env
pnpm install
pnpm setup:db
pnpm dev
```

Isso sobe:
- API NestJS em `http://localhost:3001`
- Frontend Next.js em `http://localhost:3000`

### Build de verificação (smoke test)
```bash
pnpm test:smoke
```

## Deploy

- **Frontend**: Vercel — conectado ao repositório GitHub, branch `main`
- **API**: Railway — build via Dockerfile, branch `main`
- **Banco de dados**: Railway PostgreSQL interno

### Variáveis de ambiente necessárias

| Variável | Onde usar |
|---|---|
| `DATABASE_URL` | Railway API (injetada automaticamente pelo Railway) |
| `NEXT_PUBLIC_API_URL` | Vercel (URL pública da API Railway) |

## Links de produção

- Frontend: https://beach-tennis-platform.vercel.app
- API: https://beach-tennis-api-production.up.railway.app
