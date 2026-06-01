# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2026-06-01)


### Features

* **admin:** instance admin panel + first-run setup wizard ([#9](https://github.com/tech-one-ch/plani/issues/9)) ([b73272c](https://github.com/tech-one-ch/plani/commit/b73272ca240cf8b4c40f0680ff3ad82cea543388))
* **auth:** add better-auth, email templates, UI components, auth pages ([#5](https://github.com/tech-one-ch/plani/issues/5)) ([6a54c81](https://github.com/tech-one-ch/plani/commit/6a54c814f24a0ebecc2d78c81c8a09376aaaf199))
* **db:** add Drizzle schema, migrations and dev docker-compose ([51b8aec](https://github.com/tech-one-ch/plani/commit/51b8aec56edbacde691866087748cd44748f285d))
* **db:** Drizzle schema, migrations, dev docker-compose ([ab8b66c](https://github.com/tech-one-ch/plani/commit/ab8b66c5368bcf3ca261457c64433e6ada8e80ef))


### Bug Fixes

* **auth:** fix migration env loading, drizzle schema mapping, dotenv in next.config ([#7](https://github.com/tech-one-ch/plani/issues/7)) ([e225766](https://github.com/tech-one-ch/plani/commit/e22576647c9c79d06eb766a1e7c2b2788fea0d28))
* **ci:** remove explicit pnpm version, use packageManager from package.json ([#11](https://github.com/tech-one-ch/plani/issues/11)) ([0f65175](https://github.com/tech-one-ch/plani/commit/0f65175821d692407aa645a50ea03035ea9bd8ad))
* **docker:** add apps/web/public dir required by Dockerfile COPY ([#26](https://github.com/tech-one-ch/plani/issues/26)) ([39e2e8a](https://github.com/tech-one-ch/plani/commit/39e2e8ac9a01df67b383cd07aef9612521a6e776))
* **docker:** add apps/web/public dir required by Dockerfile COPY ([#26](https://github.com/tech-one-ch/plani/issues/26)) ([c33a1a6](https://github.com/tech-one-ch/plani/commit/c33a1a69f7b6db6fd4000ab1e3c516d4b725635a))
* **docker:** add git to Alpine, LEFTHOOK=0, fix count() implicit any type ([#13](https://github.com/tech-one-ch/plani/issues/13)) ([258c1b1](https://github.com/tech-one-ch/plani/commit/258c1b19769b4f017717bf4f3815edd0dc8a37bd))
* **docker:** merge deps+build stages to fix pnpm symlink resolution (… ([9c20a4e](https://github.com/tech-one-ch/plani/commit/9c20a4eaf5c59e9d1ff4376cf016c21bebebc394))
* **docker:** merge deps+build stages to fix pnpm symlink resolution ([#24](https://github.com/tech-one-ch/plani/issues/24)) ([df7ef39](https://github.com/tech-one-ch/plani/commit/df7ef39334319c3eb925c290a6809fa75772698d))
* **docker:** use ENV LEFTHOOK=0, fix implicit any in users/page.tsx (… ([e811c3b](https://github.com/tech-one-ch/plani/commit/e811c3b1414dc4d5c237dffee9c8e8bbc93ae4fd))
* **docker:** use ENV LEFTHOOK=0, fix implicit any in users/page.tsx ([#15](https://github.com/tech-one-ch/plani/issues/15)) ([dca1f24](https://github.com/tech-one-ch/plani/commit/dca1f2470128d3e9fe71b372afbf985243e687c4))
* **web:** fix implicit any in invite page .then() callback ([#19](https://github.com/tech-one-ch/plani/issues/19)) ([a718ec3](https://github.com/tech-one-ch/plani/commit/a718ec33afce50ae50dff6dd3a4a2764d421aa3f))
* **web:** fix implicit any in invite page .then() callback ([#19](https://github.com/tech-one-ch/plani/issues/19)) ([6dfa624](https://github.com/tech-one-ch/plani/commit/6dfa624e1d4e1ba94f9a728fa6007199fee84663))
* **web:** remove deprecated baseUrl from tsconfig ([1fb71b4](https://github.com/tech-one-ch/plani/commit/1fb71b4bcd681ea750db8f9e4505e65a5b831717))
* **web:** replace .then() with async/await in invite page useEffect ([#21](https://github.com/tech-one-ch/plani/issues/21)) ([51768ad](https://github.com/tech-one-ch/plani/commit/51768ad129537bd72e1ccab744ebfedde9a19c48))

## [Unreleased]

### Added

- Initial monorepo scaffold (pnpm workspaces + Turborepo).
- `apps/web`: Next.js 15 minimal landing page.
- `packages/`: empty skeletons for `config`, `db`, `ui`, `types`, `email`, `auth`.
- Shared TypeScript, ESLint, Prettier configurations.
- Conventional Commits enforced via `commitlint` + `lefthook`.
- AGPL-3.0 license.
