import { getDb, organizations } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();

  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, parsed.data.slug))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await db.insert(organizations).values({ id, name: parsed.data.name, slug: parsed.data.slug });

  return NextResponse.json({ id }, { status: 201 });
}
