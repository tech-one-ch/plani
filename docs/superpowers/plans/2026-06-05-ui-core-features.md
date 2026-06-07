# Plani — UI & Core Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete dark UI with 4 core features — workspace/projects, tasks+kanban, notes, members — as sequential vertical slices (DB → API → UI per feature).

**Architecture:** Server Components fetch data directly via `getDb()`; client components (board, editor, modals) call the `/api/v1/` REST layer. Zod validates all API inputs. The dark theme is the app default, defined via Tailwind v4 CSS tokens. 4 phases, each ending with a commit checkpoint.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM + PostgreSQL 16, Zod (already in `apps/web`), `@dnd-kit/core` + `@dnd-kit/sortable`, `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-placeholder`, better-auth org plugin (already configured), Tailwind CSS v4, lucide-react (via `@plani/ui`), Vitest (jsdom, `globals: true`)

---

## File Structure Map

```
packages/db/src/schema/
├── projects.ts          NEW — project table
├── tasks.ts             NEW — task table
├── notes.ts             NEW — note table
└── index.ts             MODIFY — export new schemas

apps/web/src/
├── lib/
│   ├── slugify.ts        NEW — slug generation utility
│   ├── slugify.test.ts   NEW — unit tests
│   ├── position.ts       NEW — kanban position calculation
│   ├── position.test.ts  NEW — unit tests
│   └── require-session.ts  NEW — auth helper for API routes
├── middleware.ts         MODIFY — add /projects, /settings, /workspace
├── app/
│   ├── (app)/
│   │   ├── layout.tsx            REWRITE — dark shell, topbar, sidebar
│   │   ├── dashboard/page.tsx    REWRITE — project grid
│   │   ├── workspace/new/page.tsx NEW — workspace creation form
│   │   ├── projects/
│   │   │   └── [projectId]/
│   │   │       ├── layout.tsx    NEW — project shell + tabs
│   │   │       ├── page.tsx      NEW — redirects to /board
│   │   │       ├── board/page.tsx     NEW — kanban board
│   │   │       ├── tasks/page.tsx     NEW — task list
│   │   │       └── notes/page.tsx     NEW — notes split view
│   │   └── settings/
│   │       ├── page.tsx          NEW — workspace settings
│   │       └── members/page.tsx  NEW — members + invitations
│   └── api/v1/
│       ├── workspaces/
│       │   ├── route.ts          NEW — GET list, POST create
│       │   └── [workspaceId]/
│       │       ├── route.ts      NEW — GET, PATCH
│       │       ├── projects/route.ts  NEW — GET list, POST create
│       │       └── members/
│       │           ├── route.ts  NEW — GET list
│       │           └── invite/route.ts NEW — POST invite
│       ├── projects/[projectId]/
│       │   ├── route.ts          NEW — GET, PATCH, DELETE
│       │   ├── tasks/route.ts    NEW — GET list, POST create
│       │   └── notes/route.ts    NEW — GET list, POST create
│       ├── tasks/[taskId]/route.ts   NEW — GET, PATCH, DELETE
│       └── notes/[noteId]/route.ts   NEW — GET, PATCH, DELETE
└── components/
    ├── layout/
    │   ├── topbar.tsx            NEW — workspace switcher + avatar
    │   └── sidebar.tsx           NEW — collapsible sidebar (client)
    ├── project/
    │   └── create-project-modal.tsx NEW — modal (client)
    ├── kanban/
    │   ├── board.tsx             NEW — DnD context + columns (client)
    │   ├── column.tsx            NEW — single column + quick add
    │   └── task-card.tsx         NEW — draggable card
    ├── tasks/
    │   ├── task-detail-panel.tsx NEW — slide-out panel (client)
    │   └── task-list.tsx         NEW — sortable table (client)
    ├── notes/
    │   ├── note-list.tsx         NEW — note picker (client)
    │   └── note-editor.tsx       NEW — TipTap editor (client)
    └── members/
        ├── member-list.tsx       NEW — members table (client)
        └── invite-modal.tsx      NEW — invite form (client)
```

---

## Phase 1 — App Shell + Workspace/Projects

---

### Task 1: Install new dependencies

**Files:** `apps/web/package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install DnD kit and TipTap**

```bash
cd /projects/plani/plani
pnpm --filter @plani/web add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm --filter @plani/web add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder
```

Expected: no errors, packages appear in `apps/web/node_modules/`.

- [ ] **Step 2: Verify installation**

```bash
pnpm --filter @plani/web exec node -e "require('@dnd-kit/core'); require('@tiptap/react'); console.log('ok')"
```

Expected: prints `ok`.

---

### Task 2: Add dark theme tokens to globals.css

**Files:** `packages/ui/src/globals.css`

- [ ] **Step 1: Replace the file content**

```css
/* packages/ui/src/globals.css */
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  /* App backgrounds */
  --color-bg-app: #0a0a0a;
  --color-bg-sidebar: #0f0f0f;
  --color-bg-elevated: #111111;
  --color-bg-hover: #161616;

  /* Borders */
  --color-border-subtle: #1a1a1a;
  --color-border-default: #222222;

  /* Text */
  --color-text-primary: #e0e0e0;
  --color-text-secondary: #888888;
  --color-text-muted: #444444;
  --color-text-white: #ffffff;

  /* Accent — blue */
  --color-accent: #3b82f6;
  --color-accent-hover: #2563eb;
  --color-accent-subtle: #0d2240;

  /* Status colors */
  --color-priority-high: #ef4444;
  --color-priority-medium: #f59e0b;
  --color-priority-low: #22c55e;
}
```

- [ ] **Step 2: Verify Tailwind picks up tokens**

```bash
pnpm --filter @plani/web typecheck 2>&1 | tail -5
```

Expected: 0 errors (or pre-existing errors unrelated to CSS).

---

### Task 3: Add project DB schema

**Files:**

- Create: `packages/db/src/schema/projects.ts`

- [ ] **Step 1: Write the schema**

```typescript
// packages/db/src/schema/projects.ts
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { workspaces } from "./workspaces";

export const projects = pgTable(
  "project",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color").notNull().default("#3b82f6"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (t) => [uniqueIndex("project_workspace_slug_idx").on(t.workspaceId, t.slug)],
);
```

---

### Task 4: Add task DB schema

**Files:**

- Create: `packages/db/src/schema/tasks.ts`

- [ ] **Step 1: Write the schema**

```typescript
// packages/db/src/schema/tasks.ts
import { date, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { users } from "./auth";
import { projects } from "./projects";

export const tasks = pgTable("task", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["backlog", "todo", "in_progress", "done"] })
    .notNull()
    .default("backlog"),
  priority: text("priority", { enum: ["low", "medium", "high"] })
    .notNull()
    .default("medium"),
  dueDate: date("due_date"),
  assigneeId: text("assignee_id").references(() => users.id, { onDelete: "set null" }),
  position: real("position").notNull().default(1000),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
```

---

### Task 5: Add note DB schema

**Files:**

- Create: `packages/db/src/schema/notes.ts`

- [ ] **Step 1: Write the schema**

```typescript
// packages/db/src/schema/notes.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { users } from "./auth";
import { projects } from "./projects";

export const notes = pgTable("note", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Sans titre"),
  content: text("content").notNull().default(""),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
```

---

### Task 6: Update schema index + generate migration

**Files:**

- Modify: `packages/db/src/schema/index.ts`
- New: migration file generated by Drizzle

- [ ] **Step 1: Update schema index**

```typescript
// packages/db/src/schema/index.ts
export * from "./auth";
export * from "./instance";
export * from "./organizations";
export * from "./workspaces";
export * from "./projects";
export * from "./tasks";
export * from "./notes";
```

- [ ] **Step 2: Ensure Docker services are running**

```bash
docker compose -f /projects/plani/plani/docker-compose.yml up -d
```

Expected: postgres and mailhog containers running.

- [ ] **Step 3: Copy .env if not present**

```bash
[ -f /projects/plani/plani/.env ] || cp /projects/plani/plani/.env.example /projects/plani/plani/.env
```

- [ ] **Step 4: Generate migration**

```bash
cd /projects/plani/plani && pnpm db:generate
```

Expected: new `.sql` file created in `packages/db/src/migrations/`.

- [ ] **Step 5: Apply migration**

```bash
cd /projects/plani/plani && pnpm db:migrate
```

Expected: `Migration applied` (or similar success message). No errors.

- [ ] **Step 6: Typecheck DB package**

```bash
pnpm --filter @plani/db typecheck
```

Expected: 0 errors.

---

### Task 7: Add slugify utility + tests

**Files:**

- Create: `apps/web/src/lib/slugify.ts`
- Create: `apps/web/src/lib/slugify.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/src/lib/slugify.test.ts
import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("converts spaces to hyphens", () => {
    expect(slugify("My Project")).toBe("my-project");
  });

  it("strips special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("a--b  c")).toBe("a-b-c");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("truncates at 50 characters", () => {
    expect(slugify("a".repeat(60))).toHaveLength(50);
  });

  it("falls back to untitled on empty input", () => {
    expect(slugify("!!!")).toBe("untitled");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /projects/plani/plani && pnpm --filter @plani/web test --run src/lib/slugify.test.ts
```

Expected: FAIL — `Cannot find module './slugify'`

- [ ] **Step 3: Implement slugify**

```typescript
// apps/web/src/lib/slugify.ts
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50) || "untitled"
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /projects/plani/plani && pnpm --filter @plani/web test --run src/lib/slugify.test.ts
```

Expected: 6 tests pass.

---

### Task 8: Add position utility + tests

**Files:**

- Create: `apps/web/src/lib/position.ts`
- Create: `apps/web/src/lib/position.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/src/lib/position.test.ts
import { describe, expect, it } from "vitest";
import { calculatePosition } from "./position";

describe("calculatePosition", () => {
  it("returns 1000 when no neighbors", () => {
    expect(calculatePosition(null, null)).toBe(1000);
  });

  it("inserts before first item (no prev)", () => {
    expect(calculatePosition(null, 1000)).toBe(500);
  });

  it("inserts after last item (no next)", () => {
    expect(calculatePosition(1000, null)).toBe(2000);
  });

  it("inserts between two items", () => {
    expect(calculatePosition(1000, 2000)).toBe(1500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /projects/plani/plani && pnpm --filter @plani/web test --run src/lib/position.test.ts
```

Expected: FAIL — `Cannot find module './position'`

- [ ] **Step 3: Implement calculatePosition**

```typescript
// apps/web/src/lib/position.ts
export function calculatePosition(
  prevPosition: number | null,
  nextPosition: number | null,
): number {
  if (prevPosition === null && nextPosition === null) return 1000;
  if (prevPosition === null) return nextPosition! / 2;
  if (nextPosition === null) return prevPosition + 1000;
  return (prevPosition + nextPosition) / 2;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /projects/plani/plani && pnpm --filter @plani/web test --run src/lib/position.test.ts
```

Expected: 4 tests pass.

---

### Task 9: Add require-session helper

**Files:**

- Create: `apps/web/src/lib/require-session.ts`

- [ ] **Step 1: Write the helper**

```typescript
// apps/web/src/lib/require-session.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { getDb, workspaceMembers, workspaces, projects } from "@plani/db";
import { and, eq } from "drizzle-orm";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function requireWorkspaceMember(workspaceId: string) {
  const { error, session } = await requireSession();
  if (error || !session) return { error: error!, session: null };

  const db = getDb();
  const membership = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!membership.length) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function requireProjectAccess(projectId: string) {
  const { error, session } = await requireSession();
  if (error || !session) return { error: error!, session: null, project: null };

  const db = getDb();
  const project = await db
    .select({
      id: projects.id,
      workspaceId: projects.workspaceId,
      name: projects.name,
      slug: projects.slug,
      color: projects.color,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)
    .then((r) => r[0]);

  if (!project) {
    return {
      error: NextResponse.json({ error: "Not Found" }, { status: 404 }),
      session: null,
      project: null,
    };
  }

  const membership = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, project.workspaceId),
        eq(workspaceMembers.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!membership.length) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
      project: null,
    };
  }
  return { error: null, session, project };
}
```

---

### Task 10: Update middleware

**Files:**

- Modify: `apps/web/src/middleware.ts`

- [ ] **Step 1: Add new protected prefixes**

Replace the `PROTECTED_PREFIXES` line:

```typescript
// apps/web/src/middleware.ts
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const AUTH_PAGES = ["/login", "/signup", "/reset-password", "/verify-email"];
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/projects", "/settings", "/workspace"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSessionCookie(request);

  if (pathname.startsWith("/setup")) return NextResponse.next();

  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

### Task 11: Workspace API routes

**Files:**

- Create: `apps/web/src/app/api/v1/workspaces/route.ts`
- Create: `apps/web/src/app/api/v1/workspaces/[workspaceId]/route.ts`

- [ ] **Step 1: Create workspace list + create route**

```typescript
// apps/web/src/app/api/v1/workspaces/route.ts
import { getDb, workspaces, workspaceMembers, organizations } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/require-session";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { slugify } from "@/lib/slugify";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const { error, session } = await requireSession();
  if (error || !session) return error!;

  const db = getDb();
  const userWorkspaces = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      organizationId: workspaces.organizationId,
      createdAt: workspaces.createdAt,
    })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, session.user.id));

  return NextResponse.json(userWorkspaces);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error || !session) return error!;

  const body = (await request.json()) as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name } = parsed.data;
  const slug = slugify(name);

  // Create org via better-auth
  const org = await auth.api.createOrganization({
    headers: await headers(),
    body: { name, slug },
  });

  if (!org) {
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }

  // Set as active organization
  await auth.api.setActiveOrganization({
    headers: await headers(),
    body: { organizationId: org.id },
  });

  // Create Plani workspace record
  const db = getDb();
  const workspace = await db
    .insert(workspaces)
    .values({ organizationId: org.id, name, slug })
    .returning()
    .then((r) => r[0]);

  // Add user as workspace member
  await db.insert(workspaceMembers).values({
    workspaceId: workspace!.id,
    userId: session.user.id,
    role: "admin",
  });

  return NextResponse.json(workspace, { status: 201 });
}
```

- [ ] **Step 2: Create workspace detail + update route**

```typescript
// apps/web/src/app/api/v1/workspaces/[workspaceId]/route.ts
import { getDb, workspaces } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceMember } from "@/lib/require-session";
import { slugify } from "@/lib/slugify";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error } = await requireWorkspaceMember(workspaceId);
  if (error) return error;

  const db = getDb();
  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
    .then((r) => r[0]);

  if (!workspace) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json(workspace);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error } = await requireWorkspaceMember(workspaceId);
  if (error) return error;

  const body = (await request.json()) as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const updates: Record<string, unknown> = {};
  if (parsed.data.name) {
    updates["name"] = parsed.data.name;
    updates["slug"] = slugify(parsed.data.name);
  }

  const updated = await db
    .update(workspaces)
    .set(updates)
    .where(eq(workspaces.id, workspaceId))
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(updated);
}
```

---

### Task 12: Project API routes

**Files:**

- Create: `apps/web/src/app/api/v1/workspaces/[workspaceId]/projects/route.ts`
- Create: `apps/web/src/app/api/v1/projects/[projectId]/route.ts`

- [ ] **Step 1: Create workspace projects route**

```typescript
// apps/web/src/app/api/v1/workspaces/[workspaceId]/projects/route.ts
import { getDb, projects } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceMember } from "@/lib/require-session";
import { slugify } from "@/lib/slugify";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#3b82f6"),
});

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error } = await requireWorkspaceMember(workspaceId);
  if (error) return error;

  const db = getDb();
  const list = await db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .orderBy(projects.createdAt);

  return NextResponse.json(list);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error } = await requireWorkspaceMember(workspaceId);
  if (error) return error;

  const body = (await request.json()) as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const project = await db
    .insert(projects)
    .values({
      workspaceId,
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      color: parsed.data.color,
    })
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(project, { status: 201 });
}
```

- [ ] **Step 2: Create project detail route**

```typescript
// apps/web/src/app/api/v1/projects/[projectId]/route.ts
import { getDb, projects } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectAccess } from "@/lib/require-session";
import { slugify } from "@/lib/slugify";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error, project } = await requireProjectAccess(projectId);
  if (error || !project) return error!;
  return NextResponse.json(project);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error } = await requireProjectAccess(projectId);
  if (error) return error;

  const body = (await request.json()) as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const updates: Record<string, unknown> = {};
  if (parsed.data.name) {
    updates["name"] = parsed.data.name;
    updates["slug"] = slugify(parsed.data.name);
  }
  if (parsed.data.color) updates["color"] = parsed.data.color;

  const updated = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error } = await requireProjectAccess(projectId);
  if (error) return error;

  const db = getDb();
  await db.delete(projects).where(eq(projects.id, projectId));
  return new Response(null, { status: 204 });
}
```

---

### Task 13: Topbar component

**Files:**

- Create: `apps/web/src/components/layout/topbar.tsx`

- [ ] **Step 1: Write the topbar (server component)**

```tsx
// apps/web/src/components/layout/topbar.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb, workspaces, workspaceMembers } from "@plani/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";

export async function Topbar() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const activeOrgId = session.session.activeOrganizationId;
  const db = getDb();

  const userWorkspaces = activeOrgId
    ? await db
        .select({ id: workspaces.id, name: workspaces.name })
        .from(workspaces)
        .innerJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
        .where(eq(workspaceMembers.userId, session.user.id))
    : [];

  const activeWorkspace =
    userWorkspaces.find((w) => {
      // workspace linked to active org
      return true; // simplified — first workspace
    }) ?? userWorkspaces[0];

  const initials = session.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <header className="border-border-subtle bg-bg-sidebar flex h-10 flex-shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-text-white text-sm font-bold tracking-tight">
          plani
        </Link>
        {activeWorkspace && (
          <span className="border-border-default bg-bg-elevated text-text-secondary rounded border px-2 py-0.5 text-xs">
            {activeWorkspace.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="text-text-muted hover:text-text-secondary transition-colors"
        >
          <Settings size={15} />
        </Link>
        <div
          className="bg-accent-subtle text-accent flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
          title={session.user.name}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
```

---

### Task 14: Sidebar component

**Files:**

- Create: `apps/web/src/components/layout/sidebar.tsx`

- [ ] **Step 1: Write the collapsible sidebar (client component)**

```tsx
// apps/web/src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CheckSquare,
  Users,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@plani/ui";

type Project = { id: string; name: string; color: string };
type Workspace = { id: string; name: string };

interface SidebarProps {
  workspace: Workspace | null;
  projects: Project[];
}

export function Sidebar({ workspace, projects }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/tasks", icon: CheckSquare, label: "Mes tâches" },
  ];

  const workspaceItems = [
    { href: "/settings/members", icon: Users, label: "Membres" },
    { href: "/settings", icon: Settings, label: "Paramètres" },
  ];

  return (
    <aside
      className={cn(
        "border-border-subtle bg-bg-sidebar flex flex-shrink-0 flex-col border-r transition-all duration-200",
        collapsed ? "w-12" : "w-56",
      )}
    >
      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-2 pt-3">
        {!collapsed && (
          <p className="text-text-muted mb-1 px-2 text-[10px] tracking-widest uppercase">
            Navigation
          </p>
        )}
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
              pathname === href
                ? "bg-accent-subtle text-accent"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
              collapsed && "justify-center",
            )}
            title={collapsed ? label : undefined}
          >
            <Icon size={15} className="flex-shrink-0" />
            {!collapsed && label}
          </Link>
        ))}
      </nav>

      <div className="border-border-subtle mx-2 my-2 border-t" />

      {/* Projects */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {!collapsed && (
          <p className="text-text-muted mb-1 px-2 text-[10px] tracking-widest uppercase">Projets</p>
        )}
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}/board`}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
              pathname.startsWith(`/projects/${project.id}`)
                ? "bg-accent-subtle text-accent"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
              collapsed && "justify-center",
            )}
            title={collapsed ? project.name : undefined}
          >
            <span
              className="h-2 w-2 flex-shrink-0 rounded-sm"
              style={{ backgroundColor: project.color }}
            />
            {!collapsed && <span className="truncate">{project.name}</span>}
          </Link>
        ))}
        <Link
          href="/dashboard"
          className={cn(
            "text-text-muted hover:text-text-secondary flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
            collapsed && "justify-center",
          )}
          title={collapsed ? "Nouveau projet" : undefined}
        >
          <Plus size={13} className="flex-shrink-0" />
          {!collapsed && "Nouveau projet"}
        </Link>
      </nav>

      <div className="border-border-subtle mx-2 border-t" />

      {/* Workspace */}
      <nav className="flex flex-col gap-0.5 p-2">
        {workspaceItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
              pathname === href
                ? "bg-accent-subtle text-accent"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
              collapsed && "justify-center",
            )}
            title={collapsed ? label : undefined}
          >
            <Icon size={15} className="flex-shrink-0" />
            {!collapsed && label}
          </Link>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={toggle}
        className="border-border-subtle text-text-muted hover:text-text-secondary flex items-center justify-center border-t p-2.5 transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
```

---

### Task 15: Rewrite app layout

**Files:**

- Modify: `apps/web/src/app/(app)/layout.tsx`

- [ ] **Step 1: Rewrite the layout with dark shell**

```tsx
// apps/web/src/app/(app)/layout.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { getDb, workspaces, workspaceMembers, projects } from "@plani/db";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const activeOrgId = session.session.activeOrganizationId;
  const db = getDb();

  let workspace = null;
  let projectList: { id: string; name: string; color: string }[] = [];

  if (activeOrgId) {
    workspace = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.organizationId, activeOrgId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (workspace) {
      projectList = await db
        .select({ id: projects.id, name: projects.name, color: projects.color })
        .from(projects)
        .where(eq(projects.workspaceId, workspace.id))
        .orderBy(projects.createdAt);
    }
  }

  // No workspace yet — redirect to creation (except when already on /workspace/new)
  // Note: this redirect is handled by the page itself to avoid layout loops

  return (
    <div className="bg-bg-app text-text-primary flex h-screen flex-col">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar workspace={workspace} projects={projectList} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

---

### Task 16: Workspace creation page

**Files:**

- Create: `apps/web/src/app/(app)/workspace/new/page.tsx`

- [ ] **Step 1: Write the workspace creation form**

```tsx
// apps/web/src/app/(app)/workspace/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewWorkspacePage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Workspace créé !");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la création du workspace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="border-border-subtle bg-bg-elevated w-full max-w-sm rounded-lg border p-8">
        <h1 className="text-text-white mb-1 text-lg font-semibold">Créer un workspace</h1>
        <p className="text-text-secondary mb-6 text-sm">
          Un workspace regroupe vos projets et votre équipe.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-text-secondary mb-1.5 block text-xs font-medium">
              Nom du workspace
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon équipe"
              required
              className="border-border-default bg-bg-app text-text-primary placeholder:text-text-muted focus:border-accent w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-accent hover:bg-accent-hover rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer le workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### Task 17: Rewrite dashboard + create-project modal

**Files:**

- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`
- Create: `apps/web/src/components/project/create-project-modal.tsx`

- [ ] **Step 1: Create the create-project modal**

```tsx
// apps/web/src/components/project/create-project-modal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];

interface CreateProjectModalProps {
  workspaceId: string;
  onClose: () => void;
}

export function CreateProjectModal({ workspaceId, onClose }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]!);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Projet créé !");
      onClose();
      router.refresh();
    } catch {
      toast.error("Erreur lors de la création du projet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="border-border-subtle bg-bg-elevated w-full max-w-sm rounded-lg border p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-text-white font-semibold">Nouveau projet</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-text-secondary mb-1.5 block text-xs font-medium">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon projet"
              required
              autoFocus
              className="border-border-default bg-bg-app text-text-primary placeholder:text-text-muted focus:border-accent w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-text-secondary mb-1.5 block text-xs font-medium">Couleur</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    ring: color === c ? `2px solid white` : undefined,
                    outline: color === c ? `2px solid white` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary rounded-md px-4 py-1.5 text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-accent hover:bg-accent-hover rounded-md px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite dashboard page**

```tsx
// apps/web/src/app/(app)/dashboard/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb, workspaces, workspaceMembers, projects } from "@plani/db";
import { eq } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) redirect("/workspace/new");

  const db = getDb();
  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.organizationId, activeOrgId))
    .limit(1)
    .then((r) => r[0]);

  if (!workspace) redirect("/workspace/new");

  const projectList = await db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspace.id))
    .orderBy(projects.createdAt);

  return <DashboardClient workspace={workspace} projects={projectList} />;
}
```

- [ ] **Step 3: Create dashboard-client.tsx**

```tsx
// apps/web/src/app/(app)/dashboard/dashboard-client.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CreateProjectModal } from "@/components/project/create-project-modal";

type Project = { id: string; name: string; color: string; createdAt: Date };
type Workspace = { id: string; name: string };

export function DashboardClient({
  workspace,
  projects,
}: {
  workspace: Workspace;
  projects: Project[];
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-text-white text-xl font-semibold">Projets</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-accent hover:bg-accent-hover flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus size={14} />
          Nouveau projet
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="border-border-default flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <p className="text-text-secondary mb-3 text-sm">Aucun projet pour l'instant.</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-accent text-sm hover:underline"
          >
            Créer votre premier projet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/board`}
              className="group border-border-subtle bg-bg-elevated hover:border-border-default rounded-lg border p-5 transition-colors"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: project.color }} />
                <span className="text-text-primary group-hover:text-text-white font-medium transition-colors">
                  {project.name}
                </span>
              </div>
              <p className="text-text-muted text-xs">
                Créé le{" "}
                {new Date(project.createdAt).toLocaleDateString("fr-CH", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal workspaceId={workspace.id} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
```

---

### Task 18: Project shell (layout + tabs + redirect)

**Files:**

- Create: `apps/web/src/app/(app)/projects/[projectId]/layout.tsx`
- Create: `apps/web/src/app/(app)/projects/[projectId]/page.tsx`

- [ ] **Step 1: Create project layout with tabs**

```tsx
// apps/web/src/app/(app)/projects/[projectId]/layout.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDb, projects, workspaceMembers } from "@plani/db";
import { and, eq } from "drizzle-orm";
import { cn } from "@plani/ui";

const TABS = [
  { label: "Board", slug: "board" },
  { label: "Tâches", slug: "tasks" },
  { label: "Notes", slug: "notes" },
  { label: "Calendrier", slug: "calendar", disabled: true },
] as const;

interface Props {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function ProjectLayout({ children, params }: Props) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = getDb();
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)
    .then((r) => r[0]);

  if (!project) notFound();

  const member = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, project.workspaceId),
        eq(workspaceMembers.userId, session.user.id),
      ),
    )
    .limit(1)
    .then((r) => r[0]);

  if (!member) notFound();

  return (
    <div className="flex h-full flex-col">
      <div className="border-border-subtle bg-bg-app flex h-11 flex-shrink-0 items-center gap-1 border-b px-6">
        <span className="text-text-primary mr-4 text-sm font-semibold">{project.name}</span>
        {TABS.map((tab) =>
          tab.disabled ? (
            <span
              key={tab.slug}
              className="text-text-muted cursor-not-allowed px-3 py-2 text-xs"
              title="Disponible bientôt"
            >
              {tab.label}
            </span>
          ) : (
            <Link
              key={tab.slug}
              href={`/projects/${projectId}/${tab.slug}`}
              className="text-text-secondary hover:text-text-primary data-[active=true]:border-accent data-[active=true]:text-text-white border-b-2 border-transparent px-3 py-2 text-xs transition-colors"
            >
              {tab.label}
            </Link>
          ),
        )}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
```

> Note: The tab active state uses Next.js `usePathname` which requires a client wrapper. For simplicity, the active styling can be enhanced later. The layout above works without active state first.

- [ ] **Step 2: Create redirect page**

```tsx
// apps/web/src/app/(app)/projects/[projectId]/page.tsx
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/board`);
}
```

---

### Task 19: Settings page

**Files:**

- Create: `apps/web/src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Write settings page**

```tsx
// apps/web/src/app/(app)/settings/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDb, workspaces } from "@plani/db";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) redirect("/workspace/new");

  const db = getDb();
  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.organizationId, activeOrgId))
    .limit(1)
    .then((r) => r[0]);

  if (!workspace) redirect("/workspace/new");

  return (
    <div className="max-w-2xl p-8">
      <h1 className="text-text-white mb-6 text-xl font-semibold">Paramètres du workspace</h1>

      <div className="border-border-subtle bg-bg-elevated mb-6 rounded-lg border p-5">
        <h2 className="text-text-primary mb-4 text-sm font-medium">Informations générales</h2>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-text-secondary mb-0.5 text-xs">Nom</p>
            <p className="text-text-primary text-sm">{workspace.name}</p>
          </div>
          <div>
            <p className="text-text-secondary mb-0.5 text-xs">Slug</p>
            <p className="text-text-secondary font-mono text-sm">{workspace.slug}</p>
          </div>
        </div>
      </div>

      <div className="border-border-subtle bg-bg-elevated rounded-lg border p-5">
        <h2 className="text-text-primary mb-3 text-sm font-medium">Membres</h2>
        <Link href="/settings/members" className="text-accent text-sm hover:underline">
          Gérer les membres →
        </Link>
      </div>
    </div>
  );
}
```

---

### Task 20: Typecheck + commit Phase 1

- [ ] **Step 1: Run typecheck**

```bash
cd /projects/plani/plani && pnpm typecheck
```

Fix any TypeScript errors before continuing.

- [ ] **Step 2: Run all unit tests**

```bash
cd /projects/plani/plani && pnpm test --run
```

Expected: all tests pass (at minimum slugify and position tests).

- [ ] **Step 3: Commit Phase 1**

```bash
cd /projects/plani/plani
git add -p  # stage all new files
git commit -m "feat(web): phase 1 — app shell, workspace/project management"
```

---

## Phase 2 — Tasks + Kanban

---

### Task 21: Task API routes

**Files:**

- Create: `apps/web/src/app/api/v1/projects/[projectId]/tasks/route.ts`
- Create: `apps/web/src/app/api/v1/tasks/[taskId]/route.ts`

- [ ] **Step 1: Create project tasks route**

```typescript
// apps/web/src/app/api/v1/projects/[projectId]/tasks/route.ts
import { getDb, tasks } from "@plani/db";
import { asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectAccess } from "@/lib/require-session";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  status: z.enum(["backlog", "todo", "in_progress", "done"]).default("backlog"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  description: z.string().optional(),
  due_date: z.string().date().optional().nullable(),
  assignee_id: z.string().optional().nullable(),
  position: z.number().default(1000),
});

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error } = await requireProjectAccess(projectId);
  if (error) return error;

  const db = getDb();
  const list = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.position), asc(tasks.createdAt));

  return NextResponse.json(list);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error } = await requireProjectAccess(projectId);
  if (error) return error;

  const body = (await request.json()) as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const task = await db
    .insert(tasks)
    .values({
      projectId,
      title: parsed.data.title,
      status: parsed.data.status,
      priority: parsed.data.priority,
      description: parsed.data.description,
      dueDate: parsed.data.due_date ?? undefined,
      assigneeId: parsed.data.assignee_id ?? undefined,
      position: parsed.data.position,
    })
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(task, { status: 201 });
}
```

- [ ] **Step 2: Create task detail route**

```typescript
// apps/web/src/app/api/v1/tasks/[taskId]/route.ts
import { getDb, tasks, projects, workspaceMembers } from "@plani/db";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/require-session";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["backlog", "todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  due_date: z.string().date().nullable().optional(),
  assignee_id: z.string().nullable().optional(),
  position: z.number().optional(),
});

type Params = { params: Promise<{ taskId: string }> };

async function getTaskWithAccess(taskId: string, userId: string) {
  const db = getDb();
  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)
    .then((r) => r[0]);

  if (!task)
    return { task: null, error: NextResponse.json({ error: "Not Found" }, { status: 404 }) };

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, task.projectId))
    .limit(1)
    .then((r) => r[0]);

  if (!project)
    return { task: null, error: NextResponse.json({ error: "Not Found" }, { status: 404 }) };

  const member = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, project.workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .limit(1)
    .then((r) => r[0]);

  if (!member)
    return { task: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { task, error: null };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { taskId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError!;

  const { task, error } = await getTaskWithAccess(taskId, session.user.id);
  if (error) return error;
  return NextResponse.json(task);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { taskId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError!;

  const { task, error } = await getTaskWithAccess(taskId, session.user.id);
  if (error || !task) return error!;

  const body = (await request.json()) as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates["title"] = parsed.data.title;
  if (parsed.data.description !== undefined) updates["description"] = parsed.data.description;
  if (parsed.data.status !== undefined) updates["status"] = parsed.data.status;
  if (parsed.data.priority !== undefined) updates["priority"] = parsed.data.priority;
  if (parsed.data.due_date !== undefined) updates["dueDate"] = parsed.data.due_date;
  if (parsed.data.assignee_id !== undefined) updates["assigneeId"] = parsed.data.assignee_id;
  if (parsed.data.position !== undefined) updates["position"] = parsed.data.position;

  const updated = await db
    .update(tasks)
    .set(updates)
    .where(eq(tasks.id, taskId))
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { taskId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError!;

  const { task, error } = await getTaskWithAccess(taskId, session.user.id);
  if (error || !task) return error!;

  const db = getDb();
  await db.delete(tasks).where(eq(tasks.id, taskId));
  return new Response(null, { status: 204 });
}
```

---

### Task 22: Task detail panel

**Files:**

- Create: `apps/web/src/components/tasks/task-detail-panel.tsx`

- [ ] **Step 1: Write the slide-out panel**

```tsx
// apps/web/src/components/tasks/task-detail-panel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "backlog" | "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  assigneeId: string | null;
};

const STATUS_LABELS = {
  backlog: "Backlog",
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};
const PRIORITY_LABELS = { low: "Basse", medium: "Moyenne", high: "Haute" };
const PRIORITY_COLORS = {
  low: "text-priority-low",
  medium: "text-priority-medium",
  high: "text-priority-high",
};

interface Props {
  task: Task;
  onClose: () => void;
  onUpdate: (updated: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskDetailPanel({ task, onClose, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function save(updates: Partial<Task>) {
    try {
      const res = await fetch(`/api/v1/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as Task;
      onUpdate(updated);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette tâche ?")) return;
    await fetch(`/api/v1/tasks/${task.id}`, { method: "DELETE" });
    onDelete(task.id);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div
        ref={panelRef}
        className="border-border-subtle bg-bg-elevated fixed top-0 right-0 z-50 flex h-full w-96 flex-col border-l shadow-xl"
      >
        {/* Header */}
        <div className="border-border-subtle flex items-center justify-between border-b px-5 py-3">
          <span className="text-text-muted text-xs">Détail de la tâche</span>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title !== task.title) save({ title });
            }}
            className="text-text-white mb-4 w-full bg-transparent text-base font-medium focus:outline-none"
            placeholder="Titre de la tâche"
          />

          {/* Meta fields */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-text-muted w-20 text-xs">Statut</span>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as Task["status"];
                  setStatus(val);
                  save({ status: val });
                }}
                className="border-border-default bg-bg-app text-text-primary rounded border px-2 py-1 text-xs focus:outline-none"
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-text-muted w-20 text-xs">Priorité</span>
              <select
                value={priority}
                onChange={(e) => {
                  const val = e.target.value as Task["priority"];
                  setPriority(val);
                  save({ priority: val });
                }}
                className="border-border-default bg-bg-app text-text-primary rounded border px-2 py-1 text-xs focus:outline-none"
              >
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-text-muted w-20 text-xs">Échéance</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  save({ dueDate: e.target.value || null });
                }}
                className="border-border-default bg-bg-app text-text-primary rounded border px-2 py-1 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-5">
            <p className="text-text-muted mb-2 text-xs">Description</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== (task.description ?? ""))
                  save({ description: description || null });
              }}
              rows={5}
              placeholder="Ajouter une description..."
              className="border-border-default bg-bg-app text-text-primary placeholder:text-text-muted focus:border-border-default w-full resize-none rounded border p-3 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-border-subtle border-t px-5 py-3">
          <button
            onClick={handleDelete}
            className="text-priority-high flex items-center gap-1.5 text-xs hover:underline"
          >
            <Trash2 size={13} />
            Supprimer la tâche
          </button>
        </div>
      </div>
    </>
  );
}
```

---

### Task 23: Kanban board components

**Files:**

- Create: `apps/web/src/components/kanban/task-card.tsx`
- Create: `apps/web/src/components/kanban/column.tsx`
- Create: `apps/web/src/components/kanban/board.tsx`

- [ ] **Step 1: Write task card**

```tsx
// apps/web/src/components/kanban/task-card.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@plani/ui";

type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  status: "backlog" | "todo" | "in_progress" | "done";
  position: number;
};

const PRIORITY_STYLE = {
  high: "bg-red-950 text-priority-high",
  medium: "bg-amber-950 text-priority-medium",
  low: "bg-green-950 text-priority-low",
};
const PRIORITY_LABEL = { high: "Haute", medium: "Moyenne", low: "Basse" };

interface Props {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "border-border-subtle bg-bg-elevated hover:border-border-default cursor-pointer rounded-md border p-3 transition-colors",
        isDragging && "opacity-40",
      )}
    >
      <p className="text-text-primary mb-2 line-clamp-2 text-xs">{task.title}</p>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-medium",
            PRIORITY_STYLE[task.priority],
          )}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>
        {task.dueDate && (
          <span
            className={cn(
              "ml-auto text-[10px]",
              isOverdue ? "text-priority-high" : "text-text-muted",
            )}
          >
            {new Date(task.dueDate).toLocaleDateString("fr-CH", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write column**

```tsx
// apps/web/src/components/kanban/column.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { cn } from "@plani/ui";
import { TaskCard } from "./task-card";

type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  status: "backlog" | "todo" | "in_progress" | "done";
  position: number;
};

const STATUS_DOT = {
  backlog: "bg-border-default",
  todo: "bg-text-muted",
  in_progress: "bg-accent",
  done: "bg-priority-low",
};

interface Props {
  id: "backlog" | "todo" | "in_progress" | "done";
  label: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onQuickAdd: (status: string, title: string) => Promise<void>;
}

export function KanbanColumn({ id, label, tasks, onTaskClick, onQuickAdd }: Props) {
  const [quickInput, setQuickInput] = useState("");
  const { setNodeRef, isOver } = useDroppable({ id });

  async function handleQuickAdd(e: React.KeyboardEvent) {
    if (e.key !== "Enter" || !quickInput.trim()) return;
    await onQuickAdd(id, quickInput.trim());
    setQuickInput("");
  }

  return (
    <div className="flex w-60 flex-shrink-0 flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[id])} />
          <span className="text-text-secondary text-[11px] font-semibold tracking-wider uppercase">
            {label}
          </span>
        </div>
        <span className="bg-bg-elevated text-text-muted rounded px-1.5 text-[10px]">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-md p-1 transition-colors",
          isOver && "bg-accent-subtle",
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        {/* Quick add */}
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={handleQuickAdd}
          placeholder="+ Ajouter une tâche"
          className="border-border-default text-text-muted placeholder:text-text-muted focus:border-border-subtle focus:text-text-primary rounded border border-dashed bg-transparent px-2 py-1.5 text-xs focus:outline-none"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write board**

```tsx
// apps/web/src/components/kanban/board.tsx
"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";
import { KanbanColumn } from "./column";
import { TaskCard } from "./task-card";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { calculatePosition } from "@/lib/position";

type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  status: "backlog" | "todo" | "in_progress" | "done";
  position: number;
  description: string | null;
  assigneeId: string | null;
};

const COLUMNS: { id: Task["status"]; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "À faire" },
  { id: "in_progress", label: "En cours" },
  { id: "done", label: "Terminé" },
];

export function KanbanBoard({
  projectId,
  initialTasks,
}: {
  projectId: string;
  initialTasks: Task[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function getColumnTasks(status: Task["status"]) {
    return tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    // Determine new status (over could be a column or a task)
    const newStatus = (COLUMNS.find((c) => c.id === over.id)?.id ??
      tasks.find((t) => t.id === over.id)?.status) as Task["status"] | undefined;

    if (!newStatus) return;

    const columnTasks = getColumnTasks(newStatus).filter((t) => t.id !== draggedTask.id);
    const overIndex = columnTasks.findIndex((t) => t.id === over.id);

    const prev = overIndex > 0 ? (columnTasks[overIndex - 1]?.position ?? null) : null;
    const next = overIndex >= 0 ? (columnTasks[overIndex]?.position ?? null) : null;
    const newPosition = calculatePosition(prev, next);

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggedTask.id ? { ...t, status: newStatus, position: newPosition } : t,
      ),
    );

    try {
      await fetch(`/api/v1/tasks/${draggedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, position: newPosition }),
      });
    } catch {
      toast.error("Erreur lors du déplacement");
      setTasks(initialTasks); // revert
    }
  }

  async function handleQuickAdd(status: string, title: string) {
    const columnTasks = getColumnTasks(status as Task["status"]);
    const lastPosition = columnTasks[columnTasks.length - 1]?.position ?? null;
    const position = calculatePosition(lastPosition, null);

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status, position }),
      });
      if (!res.ok) throw new Error();
      const newTask = (await res.json()) as Task;
      setTasks((prev) => [...prev, newTask]);
    } catch {
      toast.error("Erreur lors de la création");
    }
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex h-full gap-4 overflow-x-auto p-6">
          {COLUMNS.map(({ id, label }) => (
            <KanbanColumn
              key={id}
              id={id}
              label={label}
              tasks={getColumnTasks(id)}
              onTaskClick={setSelectedTask}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>
        <DragOverlay>{activeTask && <TaskCard task={activeTask} onClick={() => {}} />}</DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
            setSelectedTask(updated);
          }}
          onDelete={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
        />
      )}
    </>
  );
}
```

---

### Task 24: Board page + task list page

**Files:**

- Create: `apps/web/src/app/(app)/projects/[projectId]/board/page.tsx`
- Create: `apps/web/src/app/(app)/projects/[projectId]/tasks/page.tsx`

- [ ] **Step 1: Write board page**

```tsx
// apps/web/src/app/(app)/projects/[projectId]/board/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb, tasks } from "@plani/db";
import { asc, eq } from "drizzle-orm";
import { KanbanBoard } from "@/components/kanban/board";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function BoardPage({ params }: Props) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = getDb();
  const taskList = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.position), asc(tasks.createdAt));

  return <KanbanBoard projectId={projectId} initialTasks={taskList} />;
}
```

- [ ] **Step 2: Write task list page**

```tsx
// apps/web/src/app/(app)/projects/[projectId]/tasks/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb, tasks } from "@plani/db";
import { asc, eq } from "drizzle-orm";
import { TaskList } from "@/components/tasks/task-list";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function TasksPage({ params }: Props) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = getDb();
  const taskList = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.status), asc(tasks.position));

  return <TaskList projectId={projectId} initialTasks={taskList} />;
}
```

- [ ] **Step 3: Write TaskList client component**

```tsx
// apps/web/src/components/tasks/task-list.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@plani/ui";
import { TaskDetailPanel } from "./task-detail-panel";

type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  status: "backlog" | "todo" | "in_progress" | "done";
  position: number;
  description: string | null;
  assigneeId: string | null;
};

const STATUS_LABEL = {
  backlog: "Backlog",
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};
const PRIORITY_LABEL = { low: "Basse", medium: "Moyenne", high: "Haute" };
const PRIORITY_DOT = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

export function TaskList({ projectId, initialTasks }: { projectId: string; initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selected, setSelected] = useState<Task | null>(null);

  return (
    <>
      <div className="p-6">
        <div className="border-border-subtle overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border-subtle bg-bg-elevated border-b">
                <th className="text-text-muted px-4 py-2.5 text-left text-xs font-medium">Titre</th>
                <th className="text-text-muted px-4 py-2.5 text-left text-xs font-medium">
                  Statut
                </th>
                <th className="text-text-muted px-4 py-2.5 text-left text-xs font-medium">
                  Priorité
                </th>
                <th className="text-text-muted px-4 py-2.5 text-left text-xs font-medium">
                  Échéance
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => setSelected(task)}
                  className="border-border-subtle bg-bg-app hover:bg-bg-hover cursor-pointer border-b transition-colors"
                >
                  <td className="text-text-primary px-4 py-2.5 text-xs">{task.title}</td>
                  <td className="text-text-secondary px-4 py-2.5 text-xs">
                    {STATUS_LABEL[task.status]}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-text-secondary flex items-center gap-1.5 text-xs">
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[task.priority])}
                      />
                      {PRIORITY_LABEL[task.priority]}
                    </span>
                  </td>
                  <td className="text-text-muted px-4 py-2.5 text-xs">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("fr-CH", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-text-muted px-4 py-10 text-center text-xs">
                    Aucune tâche pour l'instant. Créez-en une depuis le Board.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <TaskDetailPanel
          task={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
            setSelected(updated);
          }}
          onDelete={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
        />
      )}
    </>
  );
}
```

---

### Task 25: Typecheck + commit Phase 2

- [ ] **Step 1: Run typecheck**

```bash
cd /projects/plani/plani && pnpm typecheck
```

Fix any TypeScript errors.

- [ ] **Step 2: Run unit tests**

```bash
cd /projects/plani/plani && pnpm test --run
```

- [ ] **Step 3: Commit Phase 2**

```bash
git commit -m "feat(web): phase 2 — tasks, kanban board with drag & drop"
```

---

## Phase 3 — Notes

---

### Task 26: Note API routes

**Files:**

- Create: `apps/web/src/app/api/v1/projects/[projectId]/notes/route.ts`
- Create: `apps/web/src/app/api/v1/notes/[noteId]/route.ts`

- [ ] **Step 1: Create project notes route**

```typescript
// apps/web/src/app/api/v1/projects/[projectId]/notes/route.ts
import { getDb, notes } from "@plani/db";
import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/require-session";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error } = await requireProjectAccess(projectId);
  if (error) return error;

  const db = getDb();
  const list = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(eq(notes.projectId, projectId))
    .orderBy(desc(notes.updatedAt));

  return NextResponse.json(list);
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error, session } = await requireProjectAccess(projectId);
  if (error || !session) return error!;

  const db = getDb();
  const note = await db
    .insert(notes)
    .values({ projectId, createdBy: session.user.id })
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(note, { status: 201 });
}
```

- [ ] **Step 2: Create note detail route**

```typescript
// apps/web/src/app/api/v1/notes/[noteId]/route.ts
import { getDb, notes, projects, workspaceMembers } from "@plani/db";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/require-session";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
});

type Params = { params: Promise<{ noteId: string }> };

async function getNoteWithAccess(noteId: string, userId: string) {
  const db = getDb();
  const note = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1)
    .then((r) => r[0]);
  if (!note)
    return { note: null, error: NextResponse.json({ error: "Not Found" }, { status: 404 }) };

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, note.projectId))
    .limit(1)
    .then((r) => r[0]);
  if (!project)
    return { note: null, error: NextResponse.json({ error: "Not Found" }, { status: 404 }) };

  const member = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, project.workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .limit(1)
    .then((r) => r[0]);

  if (!member)
    return { note: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { note, error: null };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { noteId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError!;

  const { note, error } = await getNoteWithAccess(noteId, session.user.id);
  if (error) return error;
  return NextResponse.json(note);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { noteId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError!;

  const { note, error } = await getNoteWithAccess(noteId, session.user.id);
  if (error || !note) return error!;

  const body = (await request.json()) as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = getDb();
  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates["title"] = parsed.data.title;
  if (parsed.data.content !== undefined) updates["content"] = parsed.data.content;

  const updated = await db
    .update(notes)
    .set(updates)
    .where(eq(notes.id, noteId))
    .returning()
    .then((r) => r[0]);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { noteId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError!;

  const { note, error } = await getNoteWithAccess(noteId, session.user.id);
  if (error || !note) return error!;

  const db = getDb();
  await db.delete(notes).where(eq(notes.id, noteId));
  return new Response(null, { status: 204 });
}
```

---

### Task 27: Notes UI components

**Files:**

- Create: `apps/web/src/components/notes/note-list.tsx`
- Create: `apps/web/src/components/notes/note-editor.tsx`
- Create: `apps/web/src/app/(app)/projects/[projectId]/notes/page.tsx`

- [ ] **Step 1: Write note list**

```tsx
// apps/web/src/components/notes/note-list.tsx
"use client";

import { cn } from "@plani/ui";
import { Plus } from "lucide-react";

type Note = { id: string; title: string; content: string; updatedAt: Date };

interface Props {
  notes: Note[];
  selectedId: string | null;
  onSelect: (note: Note) => void;
  onNew: () => void;
}

export function NoteList({ notes, selectedId, onSelect, onNew }: Props) {
  function excerpt(content: string) {
    return (
      content
        .replace(/<[^>]+>/g, " ")
        .trim()
        .substring(0, 60) || "Aucun contenu"
    );
  }

  return (
    <div className="border-border-subtle bg-bg-sidebar flex h-full w-60 flex-shrink-0 flex-col border-r">
      <div className="border-border-subtle flex items-center justify-between border-b px-4 py-3">
        <span className="text-text-secondary text-xs font-medium">Notes</span>
        <button
          onClick={onNew}
          className="text-text-muted hover:text-text-secondary transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 && (
          <p className="text-text-muted p-4 text-xs">Aucune note. Créez-en une.</p>
        )}
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={() => onSelect(note)}
            className={cn(
              "border-border-subtle w-full border-b px-4 py-3 text-left transition-colors",
              selectedId === note.id ? "bg-accent-subtle" : "hover:bg-bg-hover",
            )}
          >
            <p
              className={cn(
                "mb-0.5 truncate text-xs font-medium",
                selectedId === note.id ? "text-accent" : "text-text-primary",
              )}
            >
              {note.title || "Sans titre"}
            </p>
            <p className="text-text-muted truncate text-[10px]">{excerpt(note.content)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write note editor with TipTap**

```tsx
// apps/web/src/components/notes/note-editor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef, useState } from "react";

type Note = { id: string; title: string; content: string; updatedAt: Date };

interface Props {
  note: Note;
  onUpdate: (updated: Note) => void;
}

export function NoteEditor({ note, onUpdate }: Props) {
  const [title, setTitle] = useState(note.title);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const saveContent = useCallback(
    async (id: string, updates: { title?: string; content?: string }) => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/v1/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error();
        const updated = (await res.json()) as Note;
        onUpdate(updated);
        setSaveState("saved");
      } catch {
        setSaveState("unsaved");
      }
    },
    [onUpdate],
  );

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Commencer à écrire..." })],
    content: note.content,
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none text-text-primary text-sm",
      },
    },
    onUpdate({ editor }) {
      setSaveState("unsaved");
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveContent(note.id, { content: editor.getHTML() });
      }, 1000);
    },
  });

  // Reset editor when note changes
  useEffect(() => {
    setTitle(note.title);
    if (editor && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content);
    }
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-border-subtle flex items-center justify-between border-b px-6 py-3">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSaveState("unsaved");
          }}
          onBlur={() => {
            if (title !== note.title) saveContent(note.id, { title });
          }}
          placeholder="Sans titre"
          className="text-text-white flex-1 bg-transparent text-sm font-semibold focus:outline-none"
        />
        <span className="text-text-muted text-[10px]">
          {saveState === "saving"
            ? "Enregistrement..."
            : saveState === "unsaved"
              ? "Non enregistré"
              : "Enregistré"}
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write notes page**

```tsx
// apps/web/src/app/(app)/projects/[projectId]/notes/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb, notes } from "@plani/db";
import { desc, eq } from "drizzle-orm";
import { NotesView } from "./notes-view";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function NotesPage({ params }: Props) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = getDb();
  const noteList = await db
    .select()
    .from(notes)
    .where(eq(notes.projectId, projectId))
    .orderBy(desc(notes.updatedAt));

  return <NotesView projectId={projectId} initialNotes={noteList} />;
}
```

- [ ] **Step 4: Write NotesView client component**

```tsx
// apps/web/src/app/(app)/projects/[projectId]/notes/notes-view.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NoteList } from "@/components/notes/note-list";
import { NoteEditor } from "@/components/notes/note-editor";

type Note = { id: string; title: string; content: string; updatedAt: Date; createdAt: Date };

export function NotesView({
  projectId,
  initialNotes,
}: {
  projectId: string;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [selected, setSelected] = useState<Note | null>(initialNotes[0] ?? null);

  async function handleNew() {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/notes`, { method: "POST" });
      if (!res.ok) throw new Error();
      const note = (await res.json()) as Note;
      setNotes((prev) => [note, ...prev]);
      setSelected(note);
    } catch {
      toast.error("Erreur lors de la création de la note");
    }
  }

  function handleUpdate(updated: Note) {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    if (selected?.id === updated.id) setSelected(updated);
  }

  return (
    <div className="flex h-full">
      <NoteList
        notes={notes}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        onNew={handleNew}
      />
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <NoteEditor key={selected.id} note={selected} onUpdate={handleUpdate} />
        ) : (
          <div className="text-text-muted flex h-full items-center justify-center text-sm">
            Sélectionnez une note ou créez-en une nouvelle.
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Task 28: Typecheck + commit Phase 3

- [ ] **Step 1: Add TipTap prose styles to globals.css**

Add at the end of `packages/ui/src/globals.css`:

```css
/* TipTap editor prose overrides for dark theme */
.prose-invert p {
  color: var(--color-text-primary);
  margin: 0.75em 0;
}
.prose-invert h1,
.prose-invert h2,
.prose-invert h3 {
  color: var(--color-text-white);
  font-weight: 600;
}
.prose-invert code {
  background: var(--color-bg-elevated);
  border-radius: 3px;
  padding: 0.1em 0.3em;
  font-size: 0.875em;
}
.prose-invert pre {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 6px;
  padding: 1em;
}
.prose-invert blockquote {
  border-left: 3px solid var(--color-border-default);
  padding-left: 1em;
  color: var(--color-text-secondary);
}
.ProseMirror .is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--color-text-muted);
  pointer-events: none;
  float: left;
  height: 0;
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /projects/plani/plani && pnpm typecheck
```

- [ ] **Step 3: Commit Phase 3**

```bash
git commit -m "feat(web): phase 3 — notes with TipTap editor"
```

---

## Phase 4 — Members

---

### Task 29: Member API routes

**Files:**

- Create: `apps/web/src/app/api/v1/workspaces/[workspaceId]/members/route.ts`
- Create: `apps/web/src/app/api/v1/workspaces/[workspaceId]/members/invite/route.ts`

- [ ] **Step 1: Create members list + remove route**

```typescript
// apps/web/src/app/api/v1/workspaces/[workspaceId]/members/route.ts
import { getDb, workspaceMembers, users } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceMember } from "@/lib/require-session";

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error } = await requireWorkspaceMember(workspaceId);
  if (error) return error;

  const db = getDb();
  const members = await db
    .select({
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.createdAt,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  return NextResponse.json(members);
}

const removeSchema = z.object({ userId: z.string() });

export async function DELETE(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error, session } = await requireWorkspaceMember(workspaceId);
  if (error || !session) return error!;

  const body = (await request.json()) as unknown;
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const db = getDb();
  await db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));

  // Only delete the specific user, not all members
  await db.delete(workspaceMembers).where(eq(workspaceMembers.userId, parsed.data.userId));

  return new Response(null, { status: 204 });
}
```

> **Note:** The DELETE above has a bug — it deletes all workspace members then removes by userId which no longer exists. Fix: use `and()` to combine both conditions in a single delete:
>
> ```typescript
> import { and, eq } from "drizzle-orm";
> // Replace both db.delete calls with:
> await db
>   .delete(workspaceMembers)
>   .where(
>     and(
>       eq(workspaceMembers.workspaceId, workspaceId),
>       eq(workspaceMembers.userId, parsed.data.userId),
>     ),
>   );
> ```

- [ ] **Step 2: Create invite route**

```typescript
// apps/web/src/app/api/v1/workspaces/[workspaceId]/members/invite/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireWorkspaceMember } from "@/lib/require-session";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb, workspaces } from "@plani/db";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

type Params = { params: Promise<{ workspaceId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error, session } = await requireWorkspaceMember(workspaceId);
  if (error || !session) return error!;

  const body = (await request.json()) as unknown;
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Use better-auth org plugin to send invitation email
  const db = getDb();

  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
    .then((r) => r[0]);
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  try {
    await auth.api.inviteMember({
      headers: await headers(),
      body: {
        organizationId: workspace.organizationId,
        email: parsed.data.email,
        role: parsed.data.role,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[invite] error:", err);
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}

// Note: use static imports at the top of the file — move `import { getDb, workspaces } from "@plani/db"` and `import { eq } from "drizzle-orm"` to the top-level imports, not inside the function body.
```

---

### Task 30: Members page UI

**Files:**

- Create: `apps/web/src/app/(app)/settings/members/page.tsx`
- Create: `apps/web/src/components/members/member-list.tsx`
- Create: `apps/web/src/components/members/invite-modal.tsx`

- [ ] **Step 1: Write member list component**

```tsx
// apps/web/src/components/members/member-list.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type Member = {
  userId: string;
  role: string;
  joinedAt: Date;
  name: string;
  email: string;
  image: string | null;
};

interface Props {
  members: Member[];
  workspaceId: string;
  currentUserId: string;
}

export function MemberList({ members: initial, workspaceId, currentUserId }: Props) {
  const [members, setMembers] = useState(initial);

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Retirer ${name} du workspace ?`)) return;
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success(`${name} retiré du workspace`);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  function initials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  return (
    <div className="border-border-subtle overflow-hidden rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-border-subtle bg-bg-elevated border-b">
            <th className="text-text-muted px-5 py-3 text-left text-xs font-medium">Membre</th>
            <th className="text-text-muted px-5 py-3 text-left text-xs font-medium">Rôle</th>
            <th className="text-text-muted px-5 py-3 text-left text-xs font-medium">Rejoint le</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.userId} className="border-border-subtle bg-bg-app border-b">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="bg-accent-subtle text-accent flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold">
                    {initials(member.name)}
                  </div>
                  <div>
                    <p className="text-text-primary text-xs font-medium">{member.name}</p>
                    <p className="text-text-muted text-[10px]">{member.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3">
                <span className="bg-bg-elevated text-text-secondary rounded px-2 py-0.5 text-[10px] font-medium capitalize">
                  {member.role}
                </span>
              </td>
              <td className="text-text-muted px-5 py-3 text-xs">
                {new Date(member.joinedAt).toLocaleDateString("fr-CH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-5 py-3 text-right">
                {member.userId !== currentUserId && (
                  <button
                    onClick={() => handleRemove(member.userId, member.name)}
                    className="text-text-muted hover:text-priority-high transition-colors"
                    title="Retirer ce membre"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Write invite modal**

```tsx
// apps/web/src/components/members/invite-modal.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  workspaceId: string;
  onClose: () => void;
}

export function InviteModal({ workspaceId, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/members/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Invitation envoyée à ${email}`);
      onClose();
    } catch {
      toast.error("Erreur lors de l'envoi de l'invitation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="border-border-subtle bg-bg-elevated w-full max-w-sm rounded-lg border p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-text-white font-semibold">Inviter un membre</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-text-secondary mb-1.5 block text-xs font-medium">
              Adresse e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collaborateur@exemple.com"
              required
              autoFocus
              className="border-border-default bg-bg-app text-text-primary placeholder:text-text-muted focus:border-accent w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-text-secondary mb-1.5 block text-xs font-medium">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "member" | "admin")}
              className="border-border-default bg-bg-app text-text-primary focus:border-accent w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary rounded-md px-4 py-1.5 text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="bg-accent hover:bg-accent-hover rounded-md px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write members page**

```tsx
// apps/web/src/app/(app)/settings/members/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb, workspaces, workspaceMembers, users } from "@plani/db";
import { eq } from "drizzle-orm";
import { MembersPageClient } from "./members-client";

export default async function MembersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) redirect("/workspace/new");

  const db = getDb();
  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.organizationId, activeOrgId))
    .limit(1)
    .then((r) => r[0]);

  if (!workspace) redirect("/workspace/new");

  const members = await db
    .select({
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.createdAt,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspace.id));

  return (
    <MembersPageClient workspace={workspace} members={members} currentUserId={session.user.id} />
  );
}
```

- [ ] **Step 4: Write members-client.tsx**

```tsx
// apps/web/src/app/(app)/settings/members/members-client.tsx
"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { MemberList } from "@/components/members/member-list";
import { InviteModal } from "@/components/members/invite-modal";

type Member = {
  userId: string;
  role: string;
  joinedAt: Date;
  name: string;
  email: string;
  image: string | null;
};
type Workspace = { id: string; name: string };

export function MembersPageClient({
  workspace,
  members,
  currentUserId,
}: {
  workspace: Workspace;
  members: Member[];
  currentUserId: string;
}) {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-text-white text-xl font-semibold">Membres</h1>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-accent hover:bg-accent-hover flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white"
        >
          <UserPlus size={14} />
          Inviter un membre
        </button>
      </div>

      <MemberList members={members} workspaceId={workspace.id} currentUserId={currentUserId} />

      {showInvite && (
        <InviteModal workspaceId={workspace.id} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}
```

---

### Task 31: Final typecheck, tests + commit Phase 4

- [ ] **Step 1: Run full typecheck**

```bash
cd /projects/plani/plani && pnpm typecheck
```

Fix all TypeScript errors.

- [ ] **Step 2: Run full test suite**

```bash
cd /projects/plani/plani && pnpm test --run
```

Expected: slugify (6) + position (4) = 10 tests pass, 0 failures.

- [ ] **Step 3: Run lint**

```bash
cd /projects/plani/plani && pnpm lint
```

Fix any lint errors.

- [ ] **Step 4: Commit Phase 4**

```bash
git commit -m "feat(web): phase 4 — members management and invitations"
```

---

## Post-implementation verification

- [ ] Start services and dev server:

```bash
cd /projects/plani/plani
docker compose up -d
pnpm dev
```

- [ ] Verify the app loads at `http://localhost:3000` — should redirect to login
- [ ] Create account, complete setup wizard → should land on workspace creation
- [ ] Create workspace → dashboard with empty state
- [ ] Create a project → appears in sidebar and dashboard
- [ ] Navigate to Board → kanban columns visible, quick-add a task
- [ ] Drag task between columns → status updates
- [ ] Click task → detail panel opens, edit title/description
- [ ] Navigate to Notes → create a note, type content, verify autosave indicator
- [ ] Navigate to Settings → Members → invite flow visible

If any page errors or is blank, check the browser console and Next.js terminal output.
