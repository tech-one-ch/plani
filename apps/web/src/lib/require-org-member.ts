import { getDb, members } from "@plani/db";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";

type OrgMemberResult =
  | { ok: true; userId: string; orgId: string; role: string }
  | { ok: false; response: NextResponse };

/**
 * Verifies the caller has an active organization and is a member of it.
 * Use in API routes that operate on org-scoped resources.
 */
export async function requireOrgMember(): Promise<OrgMemberResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const orgId = session.session.activeOrganizationId;
  if (!orgId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No active organization. Select an organization first." },
        { status: 403 },
      ),
    };
  }

  const db = getDb();
  const [membership] = await db
    .select({ role: members.role })
    .from(members)
    .where(and(eq(members.organizationId, orgId), eq(members.userId, session.user.id)));

  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not a member of this organization" }, { status: 403 }),
    };
  }

  return { ok: true, userId: session.user.id, orgId, role: membership.role };
}
