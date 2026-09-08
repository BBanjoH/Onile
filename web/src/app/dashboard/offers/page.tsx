import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/constants";
import { offerStatusLabel } from "@/lib/labels";
import OfferResponseForm from "@/components/OfferResponseForm";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  COUNTERED: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-brand-50 text-brand-700",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};

export default async function OffersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "LANDLORD" && user.role !== "ADMIN") redirect("/");

  const offers = await prisma.purchaseOffer.findMany({
    where: user.role === "ADMIN" ? {} : { property: { landlordId: user.id } },
    include: { property: { select: { id: true, title: true, price: true } }, buyer: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Offers to Buy</h1>
      <p className="text-gray-600">
        People who want to buy your property make their offer here. You can accept it, turn it down, or ask for a
        higher price — with no agent taking a cut of your sale.
      </p>

      {offers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No offers yet.
        </p>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <div key={o.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/properties/${o.property.id}`} className="font-medium text-gray-900 hover:text-brand-700">
                    {o.property.title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    Listed at {formatNaira(o.property.price)} &middot; Offer from {o.buyer.name} ({o.buyer.phone})
                  </p>
                  {o.message && <p className="mt-1 text-sm text-gray-700">&ldquo;{o.message}&rdquo;</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-700">{formatNaira(o.amount)}</p>
                  <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLES[o.status] ?? "bg-gray-100"}`}>
                    {offerStatusLabel(o.status, "seller")}
                  </span>
                </div>
              </div>
              {o.status === "COUNTERED" && o.counterAmount && (
                <p className="mt-2 text-sm text-blue-700">
                  You asked for {formatNaira(o.counterAmount)} {o.counterMessage && `— "${o.counterMessage}"`}. Waiting for
                  the buyer to reply.
                </p>
              )}
              {(o.status === "PENDING" || o.status === "COUNTERED") && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <OfferResponseForm offerId={o.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
