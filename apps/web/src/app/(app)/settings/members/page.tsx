export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb, members, users } from "@plani/db";
import { eq } from "drizzle-orm";
import { MembersPageClient } from "./members-client";

export default async function MembersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) redirect("/home");

  const db = getDb();
  const orgMembers = await db
    .select({
      userId: members.userId,
      role: members.role,
      joinedAt: members.createdAt,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(eq(members.organizationId, activeOrgId));

  return (
    <MembersPageClient orgId={activeOrgId} members={orgMembers} currentUserId={session.user.id} />
  );
}
