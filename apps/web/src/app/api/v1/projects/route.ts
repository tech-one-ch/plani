import { getDb, projects } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/require-session";
import { slugify } from "@/lib/slugify";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#3b82f6"),
});

export async function GET() {
  const { error, session } = await requireSession();
  if (error || !session)
    return error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.session.activeOrganizationId;
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const db = getDb();
  const list = await db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, orgId))
    .orderBy(projects.createdAt);

  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error || !session)
    return error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.session.activeOrganizationId;
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const body = (await request.json()) as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = getDb();
  const project = await db
    .insert(projects)
    .values({
      organizationId: orgId,
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      color: parsed.data.color,
    })
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(project, { status: 201 });
}
