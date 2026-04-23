FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy workspace config files first (for layer caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Generate Prisma client (with Alpine binary target)
RUN cd packages/db && npx prisma generate

# Build NestJS API
RUN cd apps/api && npx nest build

# Production image
FROM node:20-alpine AS production
WORKDIR /app

# OpenSSL is required by Prisma's query engine on Alpine
RUN apk add --no-cache openssl

# Install pnpm (needed to re-generate Prisma client for correct platform)
RUN npm install -g pnpm@10

# Copy built artifacts and node_modules from build stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/packages/db ./packages/db
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/package.json
COPY --from=base /app/apps/api/node_modules ./apps/api/node_modules

# Re-generate Prisma client in production stage to ensure correct binary
RUN cd packages/db && npx prisma generate

EXPOSE 3001

# Entrypoint: push schema then start API
COPY --from=base /app/packages/db/prisma ./packages/db/prisma
WORKDIR /app/packages/db
RUN echo '#!/bin/sh\nnpx prisma db push --skip-generate --accept-data-loss 2>&1 || true\nexec node /app/apps/api/dist/main.js' > /app/start.sh && chmod +x /app/start.sh

WORKDIR /app/apps/api
CMD ["/bin/sh", "/app/start.sh"]
