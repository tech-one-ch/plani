# Plani

> Open-source, self-hosted collaborative visual planning — tasks, board, calendar, notes and canvas in one project space.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Status: Bootstrap](https://img.shields.io/badge/status-bootstrap-yellow.svg)](#status)

Plani brings together everything that usually lives in five different tools — a kanban board, a calendar, a notes app, a whiteboard, and a task list — into a single connected project space. The point isn't to clone any one of them; it's to let an idea travel naturally from note, to task, to calendar entry, to canvas sketch, without ever losing its context.

> **Status — bootstrap.** This repository currently contains the project scaffold only. The product features described below are not yet implemented. See [the changelog](./CHANGELOG.md) for what's actually here.

## Vision

- **Tasks** — the unit of execution: title, description, status, priority, labels, dates, dependencies, comments, attachments.
- **Board** — a kanban view for visually moving work between columns.
- **Calendar** — week/month views to plan tasks and milestones in time.
- **Notes** — lightweight rich-text pages (Markdown-friendly) attached to a project or a task.
- **Canvas** — a free-form visual space for diagrams, sketches and brainstorming, linked to the project.
- **Relations** — the central differentiator: a note can give birth to a task, a task can be planned in the calendar, a canvas can reference tasks, and every view edits the same underlying object.

## Self-hosting

Plani is built to be deployed via Docker on your own server. It is compatible with Coolify, Dokploy, or any plain Docker host. Production updates target zero-downtime rolling deploys.

Docker images and `docker-compose` setup will be added in a later phase.

## Tech stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL 16
- **ORM**: Drizzle
- **Auth**: better-auth (email + password, magic link, Google OAuth, organizations)
- **UI**: Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **Editor**: TipTap / BlockNote _(planned)_
- **Canvas**: tldraw _(planned)_
- **Real-time**: Yjs + Hocuspocus _(planned)_
- **Monorepo**: pnpm workspaces + Turborepo

## Repository layout

```
plani/
├── apps/
│   └── web/                # Next.js application (UI + public API)
├── packages/
│   ├── auth/               # Auth configuration (better-auth)
│   ├── config/             # Shared TS/ESLint/Prettier/Tailwind configs
│   ├── db/                 # Drizzle schema, migrations, queries
│   ├── email/              # react-email templates + SMTP sender
│   ├── types/              # Shared TypeScript types
│   └── ui/                 # Shared UI components (shadcn/ui)
├── docs/                   # Architecture notes
└── .github/                # PR template, CODEOWNERS, dependabot
```

## Getting started

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for the complete local setup guide: prerequisites, first-time install, running migrations, and development workflow.

## License

Plani is released under the [GNU Affero General Public License v3.0 or later](./LICENSE).
