# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Run everything in parallel (frontend + API)
pnpm dev

# Build all apps
pnpm build

# Set up database (generate Prisma client + run migrations)
pnpm setup:db

# Simulate a tournament draw
pnpm simulate:tournament

# Frontend only (port 3000)
cd apps/web && pnpm dev

# API only (port 3001)
cd apps/api && pnpm dev

# Database migrations only
cd packages/db && pnpm migrate

# Regenerate Prisma client after schema changes
cd packages/db && pnpm generate
```

No lint or test scripts are configured yet.

## Architecture

This is a **Beach Tennis tournament management SaaS platform** structured as a pnpm + Turbo monorepo.

### Apps

- **`apps/api`** — NestJS 10 backend running on port 3001. Organized into feature modules: `auth`, `tournaments`, `events`, `players`, `teams`, `matches`, `draws`, `registrations`, `superuser`. Entry point is `src/main.ts`; CORS is configured there. Health check at `GET /health`.
- **`apps/web`** — Next.js 15 + React 19 frontend on port 3000. Uses the App Router with three route groups:
  - `(public)/` — unauthenticated pages (ao-vivo, torneios, inscricao)
  - `(auth)/` — login/register flows
  - `(dashboard)/` — protected organizer/superuser/match management pages

### Packages

- **`packages/db`** — Shared Prisma client and schema. All apps import `@beach-tennis/db`. Schema has 20+ models with UUID PKs, `Timestamptz(6)` timestamps, and soft deletes via `deletedAt`. After changing `schema.prisma`, run `pnpm setup:db` from the root.

### Infrastructure

- **Frontend:** Vercel (auto-deployed from `main`)
- **API:** Railway with Docker (`railway.toml` points to the root `Dockerfile`)
- **Database:** Supabase PostgreSQL

### Auth

JWT-based. The API uses Passport.js with a JWT strategy. The Next.js `middleware.ts` guards all `(dashboard)/` routes client-side; the API enforces roles (`admin`, `organizer`, `referee`, `player`, `viewer`) via guards in `apps/api/src/auth/`.

### Key Data Flow

Draws are generated via `POST /draws/generate-group-knockout`. Match results are recorded via `PATCH /matches/:id/result`. Rankings and standings are derived from match results and stored in `EventGroupStanding` and `Ranking` models.

## Environment Variables

Copy `.env.example` to `.env` at the root. Required vars include Supabase connection string, `JWT_SECRET`, and the public API URL consumed by the Next.js frontend.
