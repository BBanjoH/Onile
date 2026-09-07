"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BuyerOfferActions({ offerId, status }: { offerId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function respond(newStatus: "ACCEPTED" | "REJECTED" | "WITHDRAWN") {
    setBusy(true);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (status === "COUNTERED") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => respond("ACCEPTED")}
          disabled={busy}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Accept Counter
        </button>
        <button
          onClick={() => respond("REJECTED")}
          disabled={busy}
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          Decline
        </button>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <button
        onClick={() => respond("WITHDRAWN")}
        disabled={busy}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        Withdraw Offer
      </button>
    );
  }

  return null;
}
