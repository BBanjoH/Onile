"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/StarRating";

export default function ReviewForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [type, setType] = useState<"REVIEW" | "COMPLAINT">("REVIEW");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [livedThere, setLivedThere] = useState(true);
  const [moveInYear, setMoveInYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          type,
          rating: type === "REVIEW" ? rating : undefined,
          title,
          body,
          livedThere,
          moveInYear: moveInYear ? Number(moveInYear) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit");
        return;
      }
      setSubmitted(true);
      setTitle("");
      setBody("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <p className="rounded-md bg-brand-50 p-3 text-sm text-brand-700">
        Thanks — your feedback is live and will help other tenants make an informed decision.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("REVIEW")}
          className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${type === "REVIEW" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-600"}`}
        >
          Review
        </button>
        <button
          type="button"
          onClick={() => setType("COMPLAINT")}
          className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${type === "COMPLAINT" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-300 text-gray-600"}`}
        >
          Complaint
        </button>
      </div>

      {type === "REVIEW" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Your rating</label>
          <StarRating value={rating} onChange={setRating} />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === "COMPLAINT" ? "e.g. Water supply issue" : "e.g. Great value, responsive owner"}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Details</label>
        <textarea
          required
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={livedThere} onChange={(e) => setLivedThere(e.target.checked)} />
          I lived/live here
        </label>
        <input
          type="number"
          placeholder="Move-in year"
          value={moveInYear}
          onChange={(e) => setMoveInYear(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
