import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/constants";
import { getTenantSummary } from "@/lib/rentAutomation";
import MaintenanceRequestForm from "@/components/MaintenanceRequestForm";
import BuyerOfferActions from "@/components/BuyerOfferActions";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  COUNTERED: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-brand-50 text-brand-700",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};

export default async function MyRentalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ leases }, maintenanceRequests, offers] = await Promise.all([
    getTenantSummary(user.id),
    prisma.maintenanceRequest.findMany({
      where: { tenantId: user.id },
      include: { property: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.purchaseOffer.findMany({
      where: { buyerId: user.id },
      include: { property: { select: { id: true, title: true, price: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">My Rentals &amp; Purchases</h1>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900">My Leases</h2>
        {leases.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            No active leases. Once you and a landlord agree terms directly, they&apos;ll set up your lease here.
          </p>
        ) : (
          leases.map((lease) => (
            <div key={lease.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/dashboard/leases/${lease.id}`} className="font-medium text-gray-900 hover:text-brand-700">
                    {lease.propertyTitle}
                  </Link>
                  <p className="text-sm text-gray-500">Landlord: {lease.landlordName}</p>
                  <p className="text-sm text-gray-500">
                    {formatNaira(lease.rentAmount)} / {lease.rentFrequency.toLowerCase()} &middot; ends{" "}
                    {new Date(lease.endDate).toLocaleDateString("en-NG")}
                  </p>
                </div>
                <div className="text-right">
                  {lease.nextPayment ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{formatNaira(lease.nextPayment.amount)} due</p>
                      <p
                        className={`text-xs font-medium ${lease.nextPayment.status === "OVERDUE" ? "text-red-600" : "text-gray-500"}`}
                      >
                        {new Date(lease.nextPayment.dueDate).toLocaleDateString("en-NG")}
                        {lease.nextPayment.status === "OVERDUE" ? " — overdue" : ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">Fully paid up</p>
                  )}
                </div>
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3">
                <MaintenanceRequestForm propertyId={lease.propertyId} />
              </div>
            </div>
          ))
        )}
      </section>

      {maintenanceRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">My Maintenance Requests</h2>
          <div className="space-y-2">
            {maintenanceRequests.map((r) => (
              <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="text-sm text-gray-500">{r.property.title}</p>
                  </div>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{r.status.replace("_", " ")}</span>
                </div>
                {r.landlordNote && <p className="mt-1 text-sm text-gray-600">Landlord: {r.landlordNote}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {offers.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">My Purchase Offers</h2>
          <div className="space-y-2">
            {offers.map((o) => (
              <div key={o.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`/properties/${o.property.id}`} className="font-medium text-gray-900 hover:text-brand-700">
                      {o.property.title}
                    </Link>
                    <p className="text-sm text-gray-500">Listed at {formatNaira(o.property.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-700">{formatNaira(o.amount)}</p>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status] ?? "bg-gray-100"}`}>{o.status}</span>
                  </div>
                </div>
                {o.status === "COUNTERED" && o.counterAmount && (
                  <p className="mt-2 text-sm text-blue-700">
                    Landlord&apos;s counter: {formatNaira(o.counterAmount)} {o.counterMessage && `— "${o.counterMessage}"`}
                  </p>
                )}
                {(o.status === "PENDING" || o.status === "COUNTERED") && (
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    <BuyerOfferActions offerId={o.id} status={o.status} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
