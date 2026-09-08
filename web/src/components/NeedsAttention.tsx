import Link from "next/link";
import { formatNaira } from "@/lib/constants";
import { relativeDayPhrase, friendlyDate } from "@/lib/labels";
import type { LandlordAutomationSummary } from "@/lib/rentAutomation";

// Everything the app has worked out on the landlord's behalf, written as
// full sentences a person can act on, one big tappable row each. This is
// deliberately not a dashboard of numbers: the point is that a landlord
// opens Onile and is *told* what to do next, rather than having to work it
// out from a table.

type Item = { key: string; href: string; icon: string; text: string; tone: "red" | "amber" | "blue" | "purple" | "green" };

const TONES: Record<Item["tone"], string> = {
  red: "border-red-200 bg-red-50 text-red-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  blue: "border-blue-200 bg-blue-50 text-blue-900",
  purple: "border-purple-200 bg-purple-50 text-purple-900",
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

export default function NeedsAttention({ summary }: { summary: LandlordAutomationSummary }) {
  const items: Item[] = [];

  for (const p of summary.overduePayments.slice(0, 5)) {
    items.push({
      key: `overdue-${p.id}`,
      href: `/dashboard/leases/${p.leaseId}`,
      icon: "⚠️",
      tone: "red",
      text: `${p.tenantName} has not paid ${formatNaira(p.amount)} rent for ${p.propertyTitle}. It was due ${relativeDayPhrase(p.dueDate, { latePrefix: "ago" })}.`,
    });
  }

  for (const p of summary.upcomingPayments.slice(0, 5)) {
    items.push({
      key: `upcoming-${p.id}`,
      href: `/dashboard/leases/${p.leaseId}`,
      icon: "🗓️",
      tone: "amber",
      text: `${p.tenantName} owes ${formatNaira(p.amount)} rent for ${p.propertyTitle} ${relativeDayPhrase(p.dueDate)}.`,
    });
  }

  for (const l of summary.expiringLeases.slice(0, 5)) {
    items.push({
      key: `lease-${l.id}`,
      href: `/dashboard/leases/${l.id}`,
      icon: "📄",
      tone: "blue",
      text: `${l.tenantName}'s rent agreement for ${l.propertyTitle} finishes on ${friendlyDate(l.endDate)}. Ask if they are staying.`,
    });
  }

  if (summary.openMaintenanceCount > 0) {
    items.push({
      key: "repairs",
      href: "/dashboard/maintenance",
      icon: "🔧",
      tone: "purple",
      text: `${summary.openMaintenanceCount} repair${summary.openMaintenanceCount === 1 ? "" : "s"} your tenants reported ${summary.openMaintenanceCount === 1 ? "is" : "are"} still waiting.`,
    });
  }

  if (summary.pendingOfferCount > 0) {
    items.push({
      key: "offers",
      href: "/dashboard/offers",
      icon: "🤝",
      tone: "green",
      text: `${summary.pendingOfferCount} ${summary.pendingOfferCount === 1 ? "person wants" : "people want"} to buy your property. They are waiting for your answer.`,
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-brand-100 bg-brand-50 p-5">
        <p className="text-lg font-semibold text-brand-700">✅ Everything is up to date</p>
        <p className="mt-1 text-gray-700">
          No late rent, no repairs waiting, nothing needs you right now. We will tell you here when something does.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="needs-attention-heading" className="space-y-3">
      <h2 id="needs-attention-heading" className="text-lg font-bold text-gray-900">
        What needs you today
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              data-tap
              className={`flex items-center gap-3 rounded-xl border-2 p-4 hover:brightness-95 ${TONES[item.tone]}`}
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                {item.icon}
              </span>
              <span className="flex-1 font-medium">{item.text}</span>
              <span aria-hidden="true" className="text-xl font-bold opacity-60">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
