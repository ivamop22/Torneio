FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Generate Prisma client
WORKDIR /app/packages/db
RUN npx prisma generate

# Build NestJS API
WORKDIR /app/apps/api
RUN npx nest build

# Production image
FROM node:20-alpine AS production
WORKDIR /app

RUN npm install -g pnpm@10

COPY --from=base /app/package.json ./
COPY --from=base /app/pnpm-workspace.yaml ./
COPY --from=base /app/pnpm-lock.yaml ./
COPY --from=base /app/packages/db/package.json ./packages/db/
COPY --from=base /app/apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod

COPY --from=base /app/packages/db/prisma ./packages/db/prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/apps/api/dist ./apps/api/dist

# Run prisma migrate on startup, then start server
WORKDIR /app/apps/api
CMD ["sh", "-c", "cd ../../packages/db && npx prisma migrate deploy && cd ../../apps/api && node dist/main.js"]

EXPOSE 3001
