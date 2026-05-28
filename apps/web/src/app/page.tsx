import { Button } from "@plani/ui";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Plani</h1>
        <p className="mt-4 text-lg text-zinc-500">
          Collaborative visual planning — tasks, board, calendar, notes and canvas.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
