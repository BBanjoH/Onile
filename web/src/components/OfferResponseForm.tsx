"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OfferResponseForm({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [counterAmount, setCounterAmount] = useState("");
  const [counterOpen, setCounterOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(status: "ACCEPTED" | "REJECTED" | "COUNTERED") {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(status === "COUNTERED" ? { counterAmount: Number(counterAmount) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not respond");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => respond("ACCEPTED")}
          disabled={busy}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Accept
        </button>
        <button
          onClick={() => setCounterOpen((v) => !v)}
          disabled={busy}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Counter
        </button>
        <button
          onClick={() => respond("REJECTED")}
          disabled={busy}
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          Reject
        </button>
      </div>
      {counterOpen && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder="Counter amount (₦)"
            value={counterAmount}
            onChange={(e) => setCounterAmount(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => respond("COUNTERED")}
            disabled={busy || !counterAmount}
            className="rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60"
          >
            Send Counter
          </button>
        </div>
      )}
    </div>
  );
}
