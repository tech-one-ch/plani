"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateOrgForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function deriveSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
    });

    const data = (await res.json()) as { id?: string; error?: string | object };
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to create organization");
      return;
    }

    setName("");
    setSlug("");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug || slug === deriveSlug(name)) setSlug(deriveSlug(e.target.value));
            }}
            placeholder="Acme Corp"
            required
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-zinc-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(deriveSlug(e.target.value))}
            placeholder="acme-corp"
            required
            pattern="^[a-z0-9-]+$"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-sm focus:ring-1 focus:ring-zinc-400 focus:outline-none"
          />
          <p className="mt-0.5 text-xs text-zinc-400">Lowercase letters, numbers, hyphens only</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || !name.trim() || !slug.trim()}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create organization"}
      </button>
    </form>
  );
}
