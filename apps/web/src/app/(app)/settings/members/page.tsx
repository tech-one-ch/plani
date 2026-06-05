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
