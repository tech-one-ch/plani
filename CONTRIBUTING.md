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

There are two ways to run Plani locally. A **Makefile** provides shortcuts for all common commands — run `make help` to see the full list.

### Option A — `pnpm dev` (recommended for development)

Hot reload, fast feedback. Run the app natively and only infrastructure in Docker.

```bash
# 1. Start Postgres + Mailhog
make dev-infra           # or: docker compose up -d

# 2. Apply migrations (first time only, or after a new migration is added)
make migrate             # or: pnpm db:migrate

# 3. Start the app
pnpm dev                 # or: make dev (does steps 1+3 together)
```

The app will be available at <http://localhost:3000>.  
Mailhog (email preview) at <http://localhost:8025>.

### Option B — Full Docker build (test the production image locally)

Builds the Dockerfile and runs the full stack in Docker. Closer to production behavior.

```bash
make dev-docker
# or: docker compose -f docker-compose.yml -f docker-compose.full.yml up --build
```

Migrations run **automatically** at container startup — no extra step needed.  
The app will be available at <http://localhost:3000>.

### Stop everything

```bash
make down         # stop infra (Postgres + Mailhog), preserves data
make down-all     # stop infra AND delete all data (fresh start)
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

### Before pushing — verify the build matches CI

`pnpm build` uses cached results (`.next/`, `.turbo/`) and can silently skip
TypeScript checks on files it has already seen. CI and Docker always start
from scratch, so they can catch errors that pass locally.

If CI fails with a TypeScript error that doesn't reproduce locally, clear
the cache first:

```bash
rm -rf apps/web/.next .turbo
pnpm --filter @plani/web build
```

This runs exactly what the Docker build runs. **You only need this when:**

- CI fails with a TypeScript error but local passes
- You're pushing a PR that touches type-sensitive code and want to be sure

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

### How to fill a PR

**Feature / fix PR** (`feat/*` or `fix/*` → `develop`):

- **Title:** follow Conventional Commits — `feat(scope): short description` or `fix(scope): ...`
- **Summary:** 1–3 bullet points describing what changed and why
- **Testing:** check the boxes that apply; run the cache-busting build if you touched Next.js code
- **Screenshots:** add before/after if the change is visible in the browser

**Promotion PR** (`develop → staging` or `staging → main`):

- **Title:** `chore: promote develop to staging` or `chore: promote staging to main`
- **Summary:** paste the list of commits included since the last promotion:
  ```bash
  git log --oneline origin/staging..origin/develop  # for develop → staging
  git log --oneline origin/main..origin/staging      # for staging → main
  ```
- **Testing / Screenshots:** skip — CI already validated the code

### Releases and versioning

Versioning is handled automatically by [release-please](https://github.com/googleapis/release-please-action). You never set version numbers manually.

**How it works:**

1. You merge `staging → main`
2. release-please reads all Conventional Commits since the last release and opens a PR:
   _"chore: release v0.2.0"_ with an auto-generated CHANGELOG
3. You review and merge that PR when ready
4. A git tag `v0.2.0` is created automatically
5. The Docker build triggers and pushes:
   - `ghcr.io/tech-one-ch/plani:0.2.0` ← permanent, never deleted
   - `ghcr.io/tech-one-ch/plani:latest` ← updated to point to this release

**Version bump rules** (from your commit messages):

| Commits since last release     | Result                  |
| ------------------------------ | ----------------------- |
| Only `fix:`                    | patch — `0.1.0 → 0.1.1` |
| At least one `feat:`           | minor — `0.1.0 → 0.2.0` |
| `feat!:` or `BREAKING CHANGE:` | major — `0.1.0 → 1.0.0` |

To override the calculated version (e.g., jump straight to `v2.0.0`), edit
`.release-please-manifest.json` in the release PR before merging.

### Docker images

| Image tag                           | Updated when             | Kept?       |
| ----------------------------------- | ------------------------ | ----------- |
| `ghcr.io/tech-one-ch/plani:latest`  | Every merge to `main`    | Overwritten |
| `ghcr.io/tech-one-ch/plani:0.1.0`   | Release `v0.1.0`         | Permanent   |
| `ghcr.io/tech-one-ch/plani:staging` | Every merge to `staging` | Overwritten |

The `staging` image is always the latest pre-production build — only one exists at a time.
Old release images (`0.1.0`, `0.2.0`, …) are kept forever so you can roll back to any version.

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
