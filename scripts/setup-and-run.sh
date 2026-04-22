#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Beach Tennis Platform — Setup & Run
# ─────────────────────────────────────────────────────────────────

set -e

echo "🎾 Beach Tennis Platform — Setup"
echo "=================================="

# 1. Install dependencies
echo "📦 Instalando dependências..."
pnpm install

# 2. Generate Prisma client (schema com relations)
echo "🗄️  Gerando cliente Prisma..."
cd packages/db
npx prisma generate
npx prisma migrate deploy
cd ../..

# 3. Build API
echo "🔨 Compilando API..."
cd apps/api
npx nest build
cd ../..

# 4. Start API in background
echo "🚀 Iniciando API na porta 3001..."
cd apps/api && node dist/main.js &
API_PID=$!
cd ../..

# 5. Start frontend
echo "🌐 Iniciando Frontend na porta 3000..."
cd apps/web
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ Tudo rodando!"
echo ""
echo "  🌐 Frontend:   http://localhost:3000"
echo "  🔧 Admin:      http://localhost:3000"
echo "  📋 Torneios:   http://localhost:3000/torneios"
echo "  🔗 API:        http://localhost:3001"
echo "  ❤️  Health:     http://localhost:3001/health"
echo ""
echo "Pressione Ctrl+C para parar."

# Wait for background processes
wait $API_PID $FRONTEND_PID
