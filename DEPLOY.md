# 🚀 Deploy Guide — Beach Tennis Platform SaaS

## Arquitetura de Produção

```
[Usuário] → [Vercel (Next.js)] → [Railway API (NestJS)] → [Supabase (PostgreSQL)]
```

---

## 1️⃣ Supabase (Database) — Já configurado!

O Supabase já está pronto. Apenas confirme que as migrações foram aplicadas:

```bash
cd packages/db
npx prisma migrate deploy
```

Variáveis necessárias:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
```

---

## 2️⃣ Railway (API NestJS)

### Passo a passo:

1. Acesse [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Selecione este repositório
3. Railway vai detectar o `railway.toml` automaticamente
4. Configure as variáveis de ambiente:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://seu-app.vercel.app
```

5. Railway vai buildar via Dockerfile e fazer deploy automaticamente
6. Copie a URL gerada (ex: `https://beach-tennis-api-production.railway.app`)

### Testar API:
```
GET https://sua-api.railway.app/health
→ {"status":"ok","ts":...}

GET https://sua-api.railway.app/tournaments
→ [...]
```

---

## 3️⃣ Vercel (Frontend Next.js)

### Passo a passo:

1. Acesse [vercel.com](https://vercel.com) → Add New Project → Import Git
2. Selecione este repositório
3. Configure as variáveis de ambiente no painel da Vercel:

```env
NEXT_PUBLIC_API_URL=https://sua-api.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
```

4. Em **Build & Output Settings**:
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `npm run build`

5. Clique em Deploy!

### URLs geradas:
- **Frontend público**: `https://beach-tennis.vercel.app`
- **Torneios**: `https://beach-tennis.vercel.app/torneios`
- **Chaveamento**: `https://beach-tennis.vercel.app/torneios/[slug]`
- **Admin**: `https://beach-tennis.vercel.app/` (painel organizador)

---

## 4️⃣ Alternativa: Render (API)

Se preferir Render ao invés de Railway:

1. New Web Service → Connect to GitHub
2. Build Command: `cd apps/api && npm install && npm run build`
3. Start Command: `cd apps/api && node dist/main.js`
4. Configure as mesmas variáveis do Railway

---

## 🔄 Fluxo completo de uso

```
1. Organizador entra no painel admin (/)
2. Cria torneio → cria evento → cadastra jogadores → cria duplas
3. Clica em "Gerar Chaveamento" (seleciona evento + nº grupos)
4. Motor distribui duplas nos grupos (seeding serpentina)
5. Partidas de grupos são exibidas em /torneios/[slug]
6. Organizador lança resultados → standings atualizam automaticamente
7. Quando todos os grupos terminam → mata-mata gerado automaticamente!
8. Resultados do mata-mata → vencedor avança automaticamente
9. Final concluída → Campeão detectado + Ranking atualizado 🏆
```

---

## 🎯 URLs da Plataforma

| Rota | Descrição |
|------|-----------|
| `/` | Painel do organizador |
| `/torneios` | Lista pública de torneios |
| `/torneios/[slug]` | Chaveamento ao vivo |
| `/torneios/[slug]?tab=bracket` | Bracket mata-mata |
| `/torneios/[slug]?tab=ranking` | Ranking de jogadores |

---

## 🔒 Segurança (SQLi)

✅ **Todos os queries usam Prisma ORM** — zero raw SQL.
✅ CORS configurado para aceitar apenas domínios permitidos.
✅ Prepared statements em todas as operações de banco.

---

## 📡 API Endpoints Principais

```
GET    /tournaments              → Listar torneios
POST   /tournaments              → Criar torneio
GET    /events                   → Listar eventos  
POST   /events                   → Criar evento
GET    /players                  → Listar jogadores
POST   /players                  → Criar jogador
GET    /teams                    → Listar duplas
POST   /teams                    → Criar dupla
POST   /draws/generate-group-knockout → Gerar chaveamento
GET    /events/:id/bracket       → Dados do bracket (grupos + knockout + campeão)
PATCH  /matches/:id/result       → Lançar resultado (dispara automação)
GET    /ranking                  → Ranking geral
GET    /health                   → Health check
```
