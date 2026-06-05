import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { getDb, workspaceMembers, projects } from "@plani/db";
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
  if (error || !session)
    return {
      error: error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };

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
  if (error || !session)
    return {
      error: error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
      project: null,
    };

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
