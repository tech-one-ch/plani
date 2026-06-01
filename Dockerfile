# =============================================================================
# Plani — Production Dockerfile
# Multi-stage build: install+build → minimal runner
# Migrations run automatically at container start via docker-entrypoint.sh.
# Compatible with Coolify, Dokploy, and any Docker host.
# =============================================================================

# ---- Stage 1: build ---------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.5.0 --activate

ENV LEFTHOOK=0
ENV TURBO_TELEMETRY_DISABLED=1
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/email/package.json ./packages/email/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @plani/web build


# ---- Stage 2: runner --------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Migration runner — copy SQL files and the postgres.js package it needs
# (postgres.js is bundled by webpack in standalone output, so we copy it separately)
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/src/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/postgres@3.4.9/node_modules/postgres ./node_modules/postgres
COPY --chown=nextjs:nodejs docker-migrate.mjs ./docker-migrate.mjs
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
