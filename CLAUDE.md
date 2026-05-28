# CLAUDE.md

This file gives Claude (and any other AI assistant) the context it needs to be useful in this repository. Keep it updated as conventions evolve.

## What this project is

**Plani** is an open-source, self-hosted, collaborative visual planning web application. It combines tasks, kanban board, calendar, notes and canvas into a single project space, with relations between objects as the central feature. See [README.md](./README.md) for the vision.

The product is in **bootstrap phase**: the repo currently holds only the scaffold (monorepo + tooling). Business features (tasks, board, calendar, notes, canvas) are not implemented yet and will arrive through subsequent feature PRs.

## Hard rules for AI assistants

1. **Never merge between branches.** The flow is `feat/*` → PR → `develop` → PR → `staging` → PR → `main`. Branch-to-branch merges are reserved for the human reviewer through the GitHub UI. Open a PR with `gh pr create` and stop.
2. **Never modify global git config.** The repo owner's `user.name` / `user.email` are set globally — don't run `git config user.*` for any reason.
3. **Conventional Commits.** Every commit message must follow the format `<type>(<scope>): <subject>`. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`, `revert`. Subject in lowercase. Validated by `commitlint`.
4. **Strict scope discipline.** Do not add unrelated changes "while you're at it" — open a separate PR. Keep PRs small enough to review in one sitting.
5. **No business features in the bootstrap series (PR #1–#5).** Tasks/board/calendar/notes/canvas come later.

## Repository layout

```
plani/
├── apps/
│   └── web/                Next.js 15 application — UI + API routes
├── packages/
│   ├── auth/               better-auth configuration
│   ├── config/             Shared TS/ESLint/Prettier/Tailwind configs
│   ├── db/                 Drizzle schema, migrations, queries
│   ├── email/              react-email templates + SMTP sender
│   ├── types/              Shared TypeScript types & DTOs
│   └── ui/                 Shared UI components (shadcn/ui-flavored)
├── docs/                   Architecture notes for contributors
└── .github/                PR template, CODEOWNERS, dependabot, workflows
```

Workspaces are managed by **pnpm**; task orchestration is done by **Turborepo** (see `turbo.json`).

## Common commands

```bash
pnpm install                # install all workspaces
pnpm dev                    # run apps/web in dev mode (turbo dev)
pnpm build                  # build every workspace
pnpm lint                   # ESLint across the repo
pnpm typecheck              # tsc --noEmit across the repo
pnpm test                   # vitest across the repo
pnpm format                 # prettier --write
pnpm format:check           # prettier --check (CI)
pnpm clean                  # nuke build outputs and node_modules
```

## Conventions

### TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true` everywhere.
- `verbatimModuleSyntax: true` — use `import type { … }` for type-only imports.
- Path aliases (`@/…`) are configured per-app, not global.

### React / Next.js

- App Router only. No `pages/` directory.
- Server Components by default; mark client components with `"use client"` at the top.
- Server Actions for write paths inside `apps/web`; tRPC for typed reads where it pays off; REST under `/api/v1/*` for the public/external API.

### Styling

- Tailwind CSS v4 (CSS-first config). No `tailwind.config.ts` — theme lives in `globals.css` via `@theme`.
- Use the `cn` helper from `@plani/ui` for class composition.

### Database (from Phase 2)

- All tables have `id` (uuid v7), `created_at`, `updated_at`.
- Multi-tenancy is row-level: `organization_id` is on every tenant-scoped table.
- Migrations live in `packages/db/src/migrations/` and are committed to the repo.

### Auth (from Phase 3)

- `better-auth` is the source of truth. Don't roll custom auth.
- Sessions are DB-backed (compatible with multi-instance deployments).
- Two distinct role spaces: instance roles (admin only) vs organization roles (`owner`, `admin`, `member`).

### Tests

- Unit tests with Vitest, colocated next to the code (`foo.ts` + `foo.test.ts`).
- E2E with Playwright in `apps/web/e2e/` (kept minimal — one smoke test per critical path).

## Working with the AI assistant

- The assistant should plan multi-file changes before editing. For non-trivial work, use the planning workflow.
- When in doubt about scope, ask before adding.
- Long-lived context the assistant needs to remember between sessions belongs in `~/.claude/projects/.../memory/`, not in the repo.
