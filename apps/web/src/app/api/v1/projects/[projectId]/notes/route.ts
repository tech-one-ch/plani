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
