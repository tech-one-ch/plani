import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { getDb, members, projects } from "@plani/db";
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

export async function requireOrgMember(organizationId: string) {
  const { error, session } = await requireSession();
  if (error || !session)
    return {
      error: error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
      member: null,
    };

  const db = getDb();
  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.organizationId, organizationId), eq(members.userId, session.user.id)))
    .limit(1);

  if (!member) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
      member: null,
    };
  }
  return { error: null, session, member };
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
    .select()
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

  const [membership] = await db
    .select()
    .from(members)
    .where(
      and(eq(members.organizationId, project.organizationId), eq(members.userId, session.user.id)),
    )
    .limit(1);

  if (!membership) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
      project: null,
    };
  }
  return { error: null, session, project };
}
