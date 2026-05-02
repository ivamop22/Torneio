# Fase 2 — Autenticação e Papéis

**Data:** 2026-05-01  
**Status:** Aprovado pelo usuário

---

## Papéis

| Papel | Como é criado | Acesso |
|---|---|---|
| `superuser` | Seed no startup da API | Tudo — gerenciar admins, ver todos os dados |
| `admin` | Superusuário cria manualmente **ou** envia link de convite | Próprios torneios/eventos/jogadores (tenant isolation) |
| `player` | Clica em link de inscrição de evento gerado pelo admin | Visualização do torneio em que participa + edição do próprio perfil |

---

## Autenticação

- **JWT stateless** — `jsonwebtoken` + `bcryptjs` (sem dependências nativas, compatível com Alpine)
- Token: `{ sub: userId, role, email }`, expiração 7 dias
- Guard global em todos os endpoints exceto rotas públicas (ver abaixo)

### Rotas públicas (sem auth)
- `POST /auth/login`
- `POST /auth/admin/register/:token`
- `POST /auth/player/register/:token`
- `GET /tournaments` (listagem pública)
- `GET /tournaments/:slug` (detalhe público)
- `GET /events/:eventId/bracket`
- `GET /matches` (com filtro eventId)

---

## Schema — novas tabelas

```prisma
model RegistrationLink {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  token     String   @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  type      String   // 'admin_invite' | 'player_registration'
  eventId   String?  @db.Uuid   // só para player_registration
  adminId   String   @db.Uuid   // quem gerou
  expiresAt DateTime
  maxUses   Int      @default(1)
  usedCount Int      @default(0)
  createdAt DateTime @default(now())

  event Event? @relation(fields: [eventId], references: [id])
}
```

Campo `created_by` já existe em Tournament — será usado para tenant isolation.

---

## Novos endpoints da API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/login` | Público | Retorna JWT |
| GET | `/auth/me` | JWT | Dados do usuário logado |
| POST | `/auth/admin/register/:token` | Público | Cadastro admin via link de convite |
| POST | `/auth/player/register/:token` | Público | Cadastro jogador via link de evento |
| GET | `/superuser/admins` | Superuser | Listar admins |
| POST | `/superuser/admins` | Superuser | Criar admin manualmente |
| PATCH | `/superuser/admins/:id/toggle` | Superuser | Ativar/bloquear admin |
| POST | `/superuser/invite` | Superuser | Gerar link de convite para admin |
| POST | `/events/:eventId/registration-link` | Admin | Gerar link de inscrição para evento |
| GET | `/events/:eventId/registrations` | Admin | Ver inscrições pendentes |
| PATCH | `/registrations/:id/approve` | Admin | Aprovar inscrição |

---

## Tenant isolation

Todos os endpoints de admin filtram por `createdBy = req.user.userId`:
- `GET /tournaments` → `where: { created_by: userId }`
- `GET /events` → join com tournament onde `created_by = userId`
- `GET /players`, `GET /teams` → idem via evento

Superusuário: sem filtro de tenant.

---

## Seed do superusuário

No `AppModule.onApplicationBootstrap()`:
```ts
await prisma.user.upsert({
  where: { email: 'chrisjsp35@gmail.com' },
  create: { email, name: 'Super Admin', role: 'superuser',
             passwordHash: bcrypt.hashSync('V1toriA20215', 10), status: 'active' },
  update: {}
})
```

---

## Dados órfãos

Ao primeiro admin ser criado/ativado, um job de migração atribui todos os torneios com `created_by = null` para esse admin.

---

## Frontend

### Novos arquivos
- `apps/web/contexts/AuthContext.tsx` — `user`, `token`, `login()`, `logout()`
- `apps/web/middleware.ts` — redireciona `/` e rotas autenticadas para `/login` sem token
- `apps/web/app/(auth)/register/[token]/page.tsx` — cadastro admin via convite
- `apps/web/app/(public)/inscricao/[token]/page.tsx` — cadastro jogador via link
- `apps/web/app/(dashboard)/superuser/page.tsx` — gestão de admins

### Alterações existentes
- `apps/web/app/(auth)/login/page.tsx` — conectar ao `POST /auth/login`
- `apps/web/app/page.tsx` (dashboard admin) — passar `Authorization: Bearer {token}` em todos os fetches
- `apps/web/app/(public)/torneios/[slug]/page.tsx` — inalterado (público)
