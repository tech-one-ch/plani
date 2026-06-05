import { getDb, notes, projects, workspaceMembers } from "@plani/db";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/require-session";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
});

type Params = { params: Promise<{ noteId: string }> };

async function getNoteWithAccess(noteId: string, userId: string) {
  const db = getDb();
  const note = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1)
    .then((r) => r[0]);
  if (!note)
    return { note: null, error: NextResponse.json({ error: "Not Found" }, { status: 404 }) };

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, note.projectId))
    .limit(1)
    .then((r) => r[0]);
  if (!project)
    return { note: null, error: NextResponse.json({ error: "Not Found" }, { status: 404 }) };

  const member = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, project.workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .limit(1)
    .then((r) => r[0]);

  if (!member)
    return { note: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { note, error: null };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { noteId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError!;

  const { note, error } = await getNoteWithAccess(noteId, session.user.id);
  if (error) return error;
  return NextResponse.json(note);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { noteId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError!;

  const { note, error } = await getNoteWithAccess(noteId, session.user.id);
  if (error || !note) return error!;

  const body = (await request.json()) as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = getDb();
  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates["title"] = parsed.data.title;
  if (parsed.data.content !== undefined) updates["content"] = parsed.data.content;

  const updated = await db
    .update(notes)
    .set(updates)
    .where(eq(notes.id, noteId))
    .returning()
    .then((r) => r[0]);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { noteId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError!;

  const { note, error } = await getNoteWithAccess(noteId, session.user.id);
  if (error || !note) return error!;

  const db = getDb();
  await db.delete(notes).where(eq(notes.id, noteId));
  return new Response(null, { status: 204 });
}
