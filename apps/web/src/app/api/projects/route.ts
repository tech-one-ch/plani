import { getDb, projects } from "@plani/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgMember } from "@/lib/require-org-member";
import { slugify, uniqueSlug } from "@/lib/slugify";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function GET() {
  const auth = await requireOrgMember();
  if (!auth.ok) return auth.response;

  const db = getDb();
  const orgProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, auth.orgId))
    .orderBy(projects.createdAt);

  return NextResponse.json(orgProjects);
}

export async function POST(request: Request) {
  const auth = await requireOrgMember();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();

  // Generate unique slug within the org
  const existing = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.organizationId, auth.orgId));

  const slug = uniqueSlug(
    slugify(parsed.data.name),
    existing.map((p) => p.slug),
  );

  const [project] = await db
    .insert(projects)
    .values({
      organizationId: auth.orgId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      color: parsed.data.color,
      createdBy: auth.userId,
    })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
