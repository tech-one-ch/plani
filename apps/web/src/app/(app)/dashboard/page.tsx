export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Welcome, {session?.user.name ?? "there"}</h1>
      <p className="mt-2 text-zinc-500">
        Your workspace is being set up. Features are coming soon.
      </p>
    </div>
  );
}
