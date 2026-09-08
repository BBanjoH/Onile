import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardListingRow from "@/components/DashboardListingRow";
import { effectiveOwner, getPropertyTrustTier } from "@/lib/verification";

export const metadata = { title: "My Properties" };

export default async function MyPropertiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "LANDLORD" && user.role !== "ADMIN") redirect("/");

  const properties = await prisma.property.findMany({
    where: { landlordId: user.id },
    include: {
      images: true,
      reviews: { select: { rating: true, type: true } },
      verificationDocs: { orderBy: { createdAt: "desc" } },
      landlord: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-600">The houses and flats you have put on Onile.</p>
        </div>
        <Link
          href="/properties/new"
          data-tap
          className="rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
        >
          + Add a Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-lg font-medium text-gray-700">You have not added any property yet.</p>
          <p className="mt-1 text-gray-600">
            Adding your house or flat lets people looking for a home contact you directly — with no agent fee.
          </p>
          <Link
            href="/properties/new"
            data-tap
            className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Add my first property
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => {
            const ratings = p.reviews.map((r) => r.rating).filter((r): r is number => typeof r === "number");
            const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
            const complaintCount = p.reviews.filter((r) => r.type === "COMPLAINT" || r.type === "AGENT_REPORT").length;
            const owner = effectiveOwner(p, p.landlord);
            return (
              <DashboardListingRow
                key={p.id}
                property={{
                  id: p.id,
                  title: p.title,
                  status: p.status,
                  price: p.price,
                  priceFrequency: p.priceFrequency,
                  area: p.area,
                  imageUrl: p.images[0]?.url,
                  avgRating,
                  reviewCount: ratings.length,
                  complaintCount,
                  trustTier: getPropertyTrustTier(p),
                  ownerPhone: owner.phone,
                  ownerPhoneVerifiedAt: p.ownerPhoneVerifiedAt ? p.ownerPhoneVerifiedAt.toISOString() : null,
                  ownerCallVerifiedAt: p.ownerCallVerifiedAt ? p.ownerCallVerifiedAt.toISOString() : null,
                  documents: p.verificationDocs.map((d) => ({
                    id: d.id,
                    docType: d.docType,
                    status: d.status,
                    reviewerNote: d.reviewerNote,
                  })),
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
