export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getDb, notes } from "@plani/db";
import { desc, eq } from "drizzle-orm";
import { NotesView } from "./notes-view";
import { requireProjectAccess } from "@/lib/require-session";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function NotesPage({ params }: Props) {
  const { projectId } = await params;
  const { error } = await requireProjectAccess(projectId);
  if (error) notFound();

  const db = getDb();
  const noteList = await db
    .select()
    .from(notes)
    .where(eq(notes.projectId, projectId))
    .orderBy(desc(notes.updatedAt));

  return <NotesView projectId={projectId} initialNotes={noteList} />;
}
