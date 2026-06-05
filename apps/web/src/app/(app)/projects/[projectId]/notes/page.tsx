// apps/web/src/app/(app)/projects/[projectId]/notes/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb, notes } from "@plani/db";
import { desc, eq } from "drizzle-orm";
import { NotesView } from "./notes-view";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function NotesPage({ params }: Props) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = getDb();
  const noteList = await db
    .select()
    .from(notes)
    .where(eq(notes.projectId, projectId))
    .orderBy(desc(notes.updatedAt));

  return <NotesView projectId={projectId} initialNotes={noteList} />;
}
