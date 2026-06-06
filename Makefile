# Plani — developer shortcuts
# Run `make help` to see all available commands.

.PHONY: help dev dev-docker prod install migrate seed build lint typecheck test \
        down down-all clean format

COMPOSE_DEV  = docker compose -f docker-compose.dev.yml
COMPOSE_FULL = docker compose -f docker-compose.dev.yml -f docker-compose.full.yml
COMPOSE_PROD = docker compose

# ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' | \
	  sort

# ── Development ──────────────────────────────────────────────────────────────

dev: ## Start infra (Postgres + Mailhog) then run pnpm dev
	$(COMPOSE_DEV) up -d
	pnpm dev

dev-docker: ## Build app from source and start full stack in Docker
	$(COMPOSE_FULL) up --build

dev-infra: ## Start only Postgres + Mailhog (then run pnpm dev yourself)
	$(COMPOSE_DEV) up -d

# ── Production ───────────────────────────────────────────────────────────────

prod: ## Start production stack using GHCR image (requires .env)
	$(COMPOSE_PROD) up -d

prod-pull: ## Pull latest GHCR image and restart
	$(COMPOSE_PROD) pull
	$(COMPOSE_PROD) up -d

# ── Database ─────────────────────────────────────────────────────────────────

migrate: ## Apply pending database migrations
	pnpm db:migrate

seed: ## Seed default instance settings (dev only)
	pnpm db:seed

# ── Code quality ─────────────────────────────────────────────────────────────

lint: ## Run ESLint across all packages
	pnpm lint

typecheck: ## TypeScript check across all packages
	pnpm typecheck

test: ## Run unit tests
	pnpm test

build: ## Production build (all workspaces)
	pnpm build

build-clean: ## Production build with clean cache (matches CI/Docker behavior)
	rm -rf apps/web/.next .turbo
	pnpm --filter @plani/web build

format: ## Auto-format with Prettier
	pnpm format

# ── Cleanup ──────────────────────────────────────────────────────────────────

down: ## Stop dev infrastructure
	$(COMPOSE_DEV) down

down-all: ## Stop dev infrastructure and remove volumes (deletes DB data)
	$(COMPOSE_DEV) down -v

clean: ## Remove build outputs and node_modules
	pnpm clean
