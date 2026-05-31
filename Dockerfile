# =============================================================================
# Plani — Production Dockerfile
# Multi-stage build: install+build → minimal runner
# Compatible with Coolify, Dokploy, and any Docker host.
# =============================================================================

# ---- Stage 1: build ---------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.5.0 --activate

# Disable lefthook — no .git repo in Docker context
ENV LEFTHOOK=0
ENV TURBO_TELEMETRY_DISABLED=1
ENV NEXT_TELEMETRY_DISABLED=1

# Copy workspace manifests and lockfile first (layer cache for install step)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/email/package.json ./packages/email/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json

# Install all dependencies — pnpm creates correct symlinks for all packages
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build Next.js standalone output
RUN pnpm --filter @plani/web build


# ---- Stage 2: runner --------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Next.js standalone output bundles all required Node modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
