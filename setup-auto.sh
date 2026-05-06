#!/bin/bash
set -e

echo "🚀 Iniciando setup automático..."

ROOT="$HOME/Downloads/Torneio"
API="$ROOT/apps/api"
SCHEMA="$ROOT/packages/db/prisma/schema.prisma"

cd "$ROOT"

echo "✅ Ativando corepack/pnpm..."
corepack enable

echo "✅ Instalando dependências..."
pnpm install

echo "✅ Gerando Prisma Client..."
cd "$API"
pnpm exec prisma generate --schema "$SCHEMA"

if [ ! -f "$API/.env" ]; then
  echo ""
  echo "Cole sua DATABASE_URL do Supabase/Postgres:"
  read -r DATABASE_URL

  cat > "$API/.env" <<ENV
DATABASE_URL="$DATABASE_URL"
JWT_SECRET="dev-secret-local"
PORT=3001
ENV

  echo "✅ .env criado em apps/api/.env"
else
  echo "✅ .env já existe, mantendo arquivo atual."
fi

echo "✅ Sincronizando banco..."
pnpm exec prisma db push --schema "$SCHEMA"

echo "✅ Setup finalizado."
echo ""
echo "🌐 Iniciando aplicação..."
cd "$ROOT"
pnpm dev
