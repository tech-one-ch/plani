# Contributing to Plani

Thank you for your interest in Plani! This guide covers everything you need to run the project locally, understand the codebase, and submit changes.

## Table of contents

- [Prerequisites](#prerequisites)
- [First-time setup](#first-time-setup)
- [Running locally](#running-locally)
- [Useful commands](#useful-commands)
- [Project structure](#project-structure)
- [Branching model](#branching-model)
- [Commit conventions](#commit-conventions)

---

## Prerequisites

| Tool                                                    | Minimum version | Notes                                 |
| ------------------------------------------------------- | --------------- | ------------------------------------- |
| [Node.js](https://nodejs.org/)                          | 20 LTS          | 22 LTS recommended                    |
| [pnpm](https://pnpm.io/)                                | 10              | See install instructions below        |
| [Docker](https://docs.docker.com/get-docker/) + Compose | Docker 24+      | Required for local Postgres + Mailhog |
| [Git](https://git-scm.com/)                             | any recent      | —                                     |

### Install pnpm

If `pnpm` is not already on your system:

```bash
# Option A — standalone installer (no sudo required)
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc   # or restart your terminal

# Option B — via npm (requires sudo on Linux)
sudo npm install -g pnpm
```

Verify: `pnpm --version` should print `10.x.x` or higher.

---

## First-time setup

```bash
# 1. Clone the repository
git clone https://github.com/tech-one-ch/plani.git
cd plani

# 2. Install all workspace dependencies
pnpm install

# 3. Copy the environment file and fill in your values
cp .env.example .env
# Open .env — the defaults work for local dev without any changes.
```

> **`.env` defaults for local dev**: `DATABASE_URL` already points to the local Docker Postgres container. `SMTP_*` already points to the local Mailhog container. You don't need to change anything to get started.

---

## Running locally

### Start the infrastructure (Postgres + Mailhog)

```bash
docker compose up -d
```

This starts:

- **Postgres 16** on port `5432` (DB: `plani`, user: `plani`, password: `plani`)
- **Mailhog** on port `1025` (SMTP) and `8025` (web UI — open <http://localhost:8025> to read sent emails)

### Apply database migrations

Only needed the first time (or after a new migration is added):

```bash
pnpm db:migrate
```

### Seed default instance settings (optional)

```bash
pnpm db:seed
```

### Start the development server

```bash
pnpm dev
```

The app will be available at <http://localhost:3000>.  
Hot reload is enabled via Next.js Turbopack.

### Stop everything

```bash
# Kill the dev server: Ctrl+C in the terminal where pnpm dev is running

# Stop Docker services (data is preserved in a Docker volume)
docker compose stop

# Stop AND delete all data
docker compose down -v
```

---

## Useful commands

```bash
pnpm dev              # Start all apps in development mode
pnpm build            # Production build (all workspaces)
pnpm typecheck        # TypeScript check across all packages
pnpm lint             # ESLint across all packages
pnpm test             # Unit tests (Vitest)
pnpm format           # Auto-format with Prettier
pnpm format:check     # Check formatting without writing

pnpm db:generate      # Generate a new SQL migration from schema changes
pnpm db:migrate       # Apply pending migrations to the database
pnpm db:seed          # Seed default instance settings (dev only)
pnpm db:studio        # Open Drizzle Studio (visual DB browser)
```

### Working on a specific package only

```bash
pnpm --filter @plani/db typecheck
pnpm --filter @plani/web dev
```

---

## Project structure

```
plani/
├── apps/
│   └── web/                Next.js 15 — UI + API routes (App Router)
├── packages/
│   ├── auth/               better-auth server config + client helpers
│   ├── config/             Shared ESLint, TypeScript, Tailwind configs
│   ├── db/                 Drizzle schema, migrations, DB client
│   ├── email/              react-email templates + SMTP sender
│   ├── types/              Shared TypeScript types and DTOs
│   └── ui/                 Shared UI components (Tailwind + shadcn/ui)
├── docs/                   Architecture notes
├── docker-compose.yml      Local dev stack (Postgres + Mailhog)
├── .env.example            Environment variables template
└── CLAUDE.md               Context file for AI assistants
```

### Key conventions

- **App Router only** — no `pages/` directory. Server Components by default; `"use client"` only when needed.
- **snake_case** for database column names, **camelCase** for TypeScript.
- **All IDs** are `text` for better-auth tables; `uuid v7` for Plani's own tables.
- **All timestamps** use `TIMESTAMPTZ` (timestamp with time zone).

---

## Branching model

| Branch    | Purpose             | Protected                  |
| --------- | ------------------- | -------------------------- |
| `main`    | Production          | Yes — PR + review required |
| `staging` | Pre-production      | Yes — PR + review required |
| `develop` | Integration branch  | Yes — CI required          |
| `feat/*`  | New features        | No                         |
| `fix/*`   | Bug fixes           | No                         |
| `chore/*` | Tooling / deps / CI | No                         |

**Flow:** `feat/my-feature` → PR → `develop` → PR → `staging` → PR → `main`

All merges between protected branches go through a pull request. No direct push to `develop`, `staging`, or `main`.

### Merge strategy — important

The merge strategy depends on the type of PR:

| PR type                         | Strategy                  | Why                                                        |
| ------------------------------- | ------------------------- | ---------------------------------------------------------- |
| `feat/*` or `fix/*` → `develop` | **Squash and merge**      | Keeps `develop` history clean — one commit per feature     |
| `develop` → `staging`           | **Create a merge commit** | Preserves git ancestry so future merges stay conflict-free |
| `staging` → `main`              | **Create a merge commit** | Same reason                                                |

> **Never use "Squash and merge" for promotion PRs** (`develop → staging`, `staging → main`).
> Squashing rewrites the commit history — the next promotion will see the branches as
> divergent and produce conflicts on every file.

---

## Commit conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). The format is enforced by a `commit-msg` git hook:

```
<type>(<scope>): <short description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`, `revert`

**Examples:**

```
feat(db): add task table to schema
fix(web): correct redirect after login
docs: update local setup instructions
chore(deps): bump drizzle-orm to 0.41
```

Rules:

- Subject in **lowercase**
- No period at the end
- Body lines max 100 characters

The `pre-commit` hook also runs **Prettier** on staged files — format issues will block the commit. Run `pnpm format` to fix them before committing.
