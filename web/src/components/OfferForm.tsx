"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OfferForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, amount: Number(amount), message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit offer");
        return;
      }
      setSubmitted(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <p className="mt-3 rounded-md bg-brand-50 p-3 text-sm text-brand-700">
        Your offer was sent directly to the owner. Track its status under &ldquo;My Rentals &amp; Purchases&rdquo;.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 block w-full rounded-md border border-brand-600 py-2 text-center text-sm font-medium text-brand-700 hover:bg-brand-50"
      >
        Make an Offer
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-md border border-gray-200 p-3">
      {error && <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Your offer (₦)</label>
        <input
          required
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Message (optional)</label>
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-brand-600 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Offer"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
