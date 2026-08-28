import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardListingRow from "@/components/DashboardListingRow";
import { effectiveOwner, getPropertyTrustTier } from "@/lib/verification";

export default async function DashboardPage() {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Listings</h1>
        <Link href="/properties/new" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Post a Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          You haven&apos;t posted any properties yet.
        </p>
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
