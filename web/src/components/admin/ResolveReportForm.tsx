"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResolveReportForm({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moderatorNote: note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 sm:flex-row">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What action was taken? e.g. 'Listing taken down, owner phone did not match'"
        className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        Mark resolved
      </button>
    </form>
  );
}
