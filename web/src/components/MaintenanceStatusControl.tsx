"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAINTENANCE_STATUSES } from "@/lib/constants";

export default function MaintenanceStatusControl({ id, status, landlordNote }: { id: string; status: string; landlordNote: string }) {
  const router = useRouter();
  const [note, setNote] = useState(landlordNote);
  const [busy, setBusy] = useState(false);

  async function update(newStatus?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(newStatus ? { status: newStatus } : {}), landlordNote: note }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <select
        value={status}
        disabled={busy}
        onChange={(e) => update(e.target.value)}
        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      >
        {MAINTENANCE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => update()}
        placeholder="Note to tenant (optional)"
        className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      />
    </div>
  );
}
