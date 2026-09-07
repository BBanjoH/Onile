import Link from "next/link";
import { formatNaira } from "@/lib/constants";
import type { LandlordAutomationSummary } from "@/lib/rentAutomation";

export default function AutomationSummary({ summary }: { summary: LandlordAutomationSummary }) {
  const nothingDue =
    summary.overduePayments.length === 0 &&
    summary.upcomingPayments.length === 0 &&
    summary.expiringLeases.length === 0 &&
    summary.openMaintenanceCount === 0 &&
    summary.pendingOfferCount === 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Automation Center</h2>
        <span className="text-xs text-gray-400">Auto-updated on every visit</span>
      </div>

      {nothingDue ? (
        <p className="text-sm text-gray-500">Nothing needs your attention right now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.overduePayments.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                {summary.overduePayments.length} rent payment{summary.overduePayments.length === 1 ? "" : "s"} overdue
              </p>
              <ul className="mt-1 space-y-1 text-sm text-red-800">
                {summary.overduePayments.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <Link href={`/dashboard/leases/${p.leaseId}`} className="hover:underline">
                      {p.tenantName} — {p.propertyTitle} ({formatNaira(p.amount)})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.upcomingPayments.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                {summary.upcomingPayments.length} payment{summary.upcomingPayments.length === 1 ? "" : "s"} due soon
              </p>
              <ul className="mt-1 space-y-1 text-sm text-amber-800">
                {summary.upcomingPayments.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <Link href={`/dashboard/leases/${p.leaseId}`} className="hover:underline">
                      {p.tenantName} — {formatNaira(p.amount)} due {new Date(p.dueDate).toLocaleDateString("en-NG")}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.expiringLeases.length > 0 && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                {summary.expiringLeases.length} lease{summary.expiringLeases.length === 1 ? "" : "s"} expiring soon
              </p>
              <ul className="mt-1 space-y-1 text-sm text-blue-800">
                {summary.expiringLeases.slice(0, 4).map((l) => (
                  <li key={l.id}>
                    <Link href={`/dashboard/leases/${l.id}`} className="hover:underline">
                      {l.tenantName} — {l.propertyTitle} (ends {new Date(l.endDate).toLocaleDateString("en-NG")})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.openMaintenanceCount > 0 && (
            <div className="rounded-md border border-purple-200 bg-purple-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Maintenance</p>
              <p className="mt-1 text-sm text-purple-800">
                <Link href="/dashboard/maintenance" className="hover:underline">
                  {summary.openMaintenanceCount} open request{summary.openMaintenanceCount === 1 ? "" : "s"}
                </Link>
              </p>
            </div>
          )}

          {summary.pendingOfferCount > 0 && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Purchase offers</p>
              <p className="mt-1 text-sm text-emerald-800">
                <Link href="/dashboard/offers" className="hover:underline">
                  {summary.pendingOfferCount} awaiting your response
                </Link>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
