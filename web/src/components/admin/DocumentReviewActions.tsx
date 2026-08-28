"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentReviewActions({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review(status: "APPROVED" | "REJECTED") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewerNote: note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (visible to the landlord)"
        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={() => review("APPROVED")}
          disabled={busy}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          onClick={() => review("REJECTED")}
          disabled={busy}
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
