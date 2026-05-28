# Architecture

This document is a living reference for contributors and the AI assistant.

## Repository structure

Plani uses a **pnpm monorepo** managed by **Turborepo**.

```
apps/
  web/           Next.js 15 app — serves the UI and hosts the API

packages/
  auth/          better-auth server config + auth helpers
  config/        Shared configs: TypeScript, ESLint, Prettier, Tailwind
  db/            Drizzle schema, migrations, typed query helpers
  email/         react-email templates + nodemailer SMTP sender
  types/         Shared TypeScript types, enums, DTOs
  ui/            shadcn/ui-flavored component library
```

## Multi-tenancy model

```
Instance
  └── Organization(s)
        └── Workspace(s)
              └── Project(s)       ← business features start here
                    ├── Task(s)
                    ├── Note(s)
                    ├── Canvas(es)
                    └── Calendar events
```

**Instance admin** — controls global settings (open registration, user management).  
**Org owner/admin/member** — independent of the instance role hierarchy.  
A person can be both, but via explicit assignment.

## Authentication flow

- Email/password, Google OAuth (optional), magic link — all via `better-auth`.
- Sessions stored in the `sessions` DB table (stateless containers, multi-instance safe).
- Invitation flow: `invitations` row created → email sent → token validated → user joins org.

## Data access patterns

- **Server Components / Server Actions** read directly from `packages/db` (Drizzle).
- **tRPC** layer sits in `apps/web/src/server/` for typed client→server calls.
- **Public REST API** under `apps/web/src/app/api/v1/` — designed for external integrations.

## Environment

All runtime config is passed via environment variables (see `.env.example`).  
No runtime config files — the container is stateless.

## Docker

Multi-stage Dockerfile: `build` stage → Next.js standalone output → minimal `runner` image.  
Images are built and pushed to GHCR by GitHub Actions on merges to `staging` / `main`.

---

_Last updated: bootstrap phase. Expand sections as features land._
