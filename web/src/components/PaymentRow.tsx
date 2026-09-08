"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira, PAYMENT_METHODS } from "@/lib/constants";
import { rentStatusLabel, paymentMethodLabel, friendlyDate, relativeDayPhrase } from "@/lib/labels";

type Payment = { id: string; amount: number; dueDate: string; paidAt: string | null; status: string; method: string };

type Props = { payment: Payment; canEdit?: boolean; canPayOnline?: boolean };

export default function PaymentRow({ payment, canEdit = true, canPayOnline = false }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>("BANK_TRANSFER");
  const [payError, setPayError] = useState<string | null>(null);

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

  async function payNow() {
    setPayError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/payments/${payment.id}/checkout`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error ?? "Could not start payment");
        return;
      }
      window.location.href = data.link;
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
      <td className="py-3 text-sm text-gray-700">
        {friendlyDate(payment.dueDate)}
        {payment.status !== "PAID" && (
          <span className="block text-xs text-gray-500">
            {relativeDayPhrase(payment.dueDate, { latePrefix: "late" })}
          </span>
        )}
      </td>
      <td className="py-3 text-sm font-medium text-gray-900">{formatNaira(payment.amount)}</td>
      <td className="py-3">
        <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${statusStyles[payment.status] ?? "bg-gray-100 text-gray-600"}`}>
          {rentStatusLabel(payment.status)}
        </span>
      </td>
      <td className="py-3 text-sm text-gray-500">
        {payment.paidAt
          ? `${friendlyDate(payment.paidAt)}${payment.method ? ` (${paymentMethodLabel(payment.method)})` : ""}`
          : "—"}
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
                  {paymentMethodLabel(m)}
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
        {canPayOnline && payment.status !== "PAID" && (
          <div className="flex flex-col items-end gap-1">
            {payError && <p className="text-xs text-red-600">{payError}</p>}
            <button
              onClick={payNow}
              disabled={busy}
              className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? "Redirecting..." : "Pay Now"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
