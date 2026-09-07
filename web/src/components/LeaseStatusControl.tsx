"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEASE_STATUSES } from "@/lib/constants";

export default function LeaseStatusControl({ leaseId, status }: { leaseId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function updateStatus(newStatus: string) {
    if (newStatus === status) return;
    if (newStatus !== "ACTIVE" && !confirm(`Mark this lease as ${newStatus}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/leases/${leaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={status}
      disabled={busy}
      onChange={(e) => updateStatus(e.target.value)}
      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
    >
      {LEASE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
