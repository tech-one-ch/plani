// apps/web/src/app/api/v1/workspaces/route.ts
import { getDb, workspaces, workspaceMembers } from "@plani/db";
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
