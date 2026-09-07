"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira, PAYMENT_METHODS } from "@/lib/constants";

type Payment = { id: string; amount: number; dueDate: string; paidAt: string | null; status: string; method: string };

export default function PaymentRow({ payment, canEdit = true }: { payment: Payment; canEdit?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>("BANK_TRANSFER");

  async function markPaid() {
    setBusy(true);
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAt: new Date().toISOString(), method }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const statusStyles: Record<string, string> = {
    PAID: "bg-brand-50 text-brand-700",
    OVERDUE: "bg-red-50 text-red-700",
    PENDING: "bg-gray-100 text-gray-600",
  };

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2 text-sm text-gray-700">{new Date(payment.dueDate).toLocaleDateString("en-NG")}</td>
      <td className="py-2 text-sm font-medium text-gray-900">{formatNaira(payment.amount)}</td>
      <td className="py-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyles[payment.status] ?? "bg-gray-100 text-gray-600"}`}>
          {payment.status}
        </span>
      </td>
      <td className="py-2 text-sm text-gray-500">
        {payment.paidAt ? `${new Date(payment.paidAt).toLocaleDateString("en-NG")}${payment.method ? ` (${payment.method})` : ""}` : "—"}
      </td>
      <td className="py-2 text-right">
        {canEdit && payment.status !== "PAID" && (
          <div className="flex items-center justify-end gap-1">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
              className="rounded-md border border-gray-300 px-1.5 py-1 text-xs"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace("_", " ")}
                </option>
              ))}
            </select>
            <button
              onClick={markPaid}
              disabled={busy}
              className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Mark Paid
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
