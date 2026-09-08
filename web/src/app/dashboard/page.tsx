import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NeedsAttention from "@/components/NeedsAttention";
import BigActionCard from "@/components/BigActionCard";
import { getLandlordAutomationSummary } from "@/lib/rentAutomation";

export const metadata = { title: "My Home" };

/**
 * The landlord's home screen.
 *
 * Deliberately plain: a greeting, a short list of things that actually
 * need doing today, then a handful of large buttons. Everything else in
 * the app is one tap from here. An older landlord should be able to open
 * this and know what to do without reading a manual or learning any
 * vocabulary.
 */
function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-NG", { hour: "numeric", hour12: false, timeZone: "Africa/Lagos" }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "LANDLORD" && user.role !== "ADMIN") redirect("/my-rentals");

  const [summary, propertyCount] = await Promise.all([
    getLandlordAutomationSummary(user.id),
    prisma.property.count({ where: { landlordId: user.id } }),
  ]);

  const firstName = user.name.split(" ")[0];
  const lateCount = summary.overduePayments.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {firstName}
        </h1>
        <p className="text-gray-600">This is your property, rent and repairs in one place.</p>
      </div>

      <NeedsAttention summary={summary} />

      <section aria-labelledby="menu-heading" className="space-y-3">
        <h2 id="menu-heading" className="text-lg font-bold text-gray-900">
          What would you like to do?
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <BigActionCard
            href="/dashboard/properties"
            icon="🏠"
            title="My Properties"
            description={
              propertyCount === 0
                ? "Add your first house or flat"
                : `${propertyCount} propert${propertyCount === 1 ? "y" : "ies"} on Onile`
            }
          />
          <BigActionCard
            href="/dashboard/leases"
            icon="💰"
            title="Rent & Tenants"
            description="See who has paid and who has not"
            badge={lateCount}
          />
          <BigActionCard
            href="/dashboard/maintenance"
            icon="🔧"
            title="Repairs"
            description="Problems your tenants reported"
            badge={summary.openMaintenanceCount}
          />
          <BigActionCard
            href="/dashboard/offers"
            icon="🤝"
            title="Offers to Buy"
            description="People who want to buy your property"
            badge={summary.pendingOfferCount}
          />
          <BigActionCard
            href="/properties/new"
            icon="➕"
            title="Add a Property"
            description="Put a house or flat on Onile — it's free"
            highlight
          />
          <BigActionCard href="/help" icon="❓" title="Get Help" description="How to use Onile, and how to reach us" />
        </div>
      </section>
    </div>
  );
}
