import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/constants";
import { repairStatusLabel, offerStatusLabel, friendlyDate, relativeDayPhrase } from "@/lib/labels";
import { getTenantSummary } from "@/lib/rentAutomation";
import { isFlutterwaveConfigured } from "@/lib/flutterwave";
import MaintenanceRequestForm from "@/components/MaintenanceRequestForm";
import BuyerOfferActions from "@/components/BuyerOfferActions";
import PayNowButton from "@/components/PayNowButton";

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

  const canPayOnline = isFlutterwaveConfigured();

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
      <h1 className="text-2xl font-bold text-gray-900">My Home &amp; Payments</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">The place I rent</h2>
        {leases.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            You are not renting a place through Onile yet. When you and an owner agree, they will add you here and
            you will be able to pay your rent and report problems from this page.
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
                    {friendlyDate(lease.endDate)}
                  </p>
                </div>
                <div className="space-y-1.5 text-right">
                  {lease.nextPayment ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{formatNaira(lease.nextPayment.amount)} to pay</p>
                      <p
                        className={`text-xs font-medium ${lease.nextPayment.status === "OVERDUE" ? "text-red-600" : "text-gray-500"}`}
                      >
                        {lease.nextPayment.status === "OVERDUE"
                          ? `Late — was due ${relativeDayPhrase(lease.nextPayment.dueDate, { latePrefix: "ago" })}`
                          : `Due ${relativeDayPhrase(lease.nextPayment.dueDate)}`}
                      </p>
                      {canPayOnline && <PayNowButton paymentId={lease.nextPayment.id} />}
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
          <h2 className="text-lg font-semibold text-gray-900">Problems I reported</h2>
          <div className="space-y-2">
            {maintenanceRequests.map((r) => (
              <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="text-sm text-gray-500">{r.property.title}</p>
                  </div>
                  <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                    {repairStatusLabel(r.status)}
                  </span>
                </div>
                {r.landlordNote && <p className="mt-1 text-sm text-gray-600">Landlord says: {r.landlordNote}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {offers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Houses I offered to buy</h2>
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
                    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLES[o.status] ?? "bg-gray-100"}`}>
                      {offerStatusLabel(o.status, "buyer")}
                    </span>
                  </div>
                </div>
                {o.status === "COUNTERED" && o.counterAmount && (
                  <p className="mt-2 text-sm text-blue-700">
                    The owner is asking for {formatNaira(o.counterAmount)} instead
                    {o.counterMessage && ` — "${o.counterMessage}"`}
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
