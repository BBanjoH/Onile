"use client";

import { useState } from "react";

export default function PayNowButton({ paymentId }: { paymentId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function payNow() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/payments/${paymentId}/checkout`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start payment");
        return;
      }
      window.location.href = data.link;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={payNow}
        disabled={busy}
        className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? "Redirecting..." : "Pay Now"}
      </button>
    </div>
  );
}
