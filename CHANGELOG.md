# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial monorepo scaffold (pnpm workspaces + Turborepo).
- `apps/web`: Next.js 15 minimal landing page.
- `packages/`: empty skeletons for `config`, `db`, `ui`, `types`, `email`, `auth`.
- Shared TypeScript, ESLint, Prettier configurations.
- Conventional Commits enforced via `commitlint` + `lefthook`.
- AGPL-3.0 license.
