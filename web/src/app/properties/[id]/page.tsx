import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPropertyById } from "@/lib/properties";
import { effectiveOwner } from "@/lib/verification";
import { formatNaira, priceFrequencyLabel, PROPERTY_TYPE_LABELS, RELATIONSHIP_LABELS, DOC_TYPE_LABELS, type PropertyType, type RelationshipType, type DocType } from "@/lib/constants";
import { StarRating } from "@/components/StarRating";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import TrustBadge from "@/components/TrustBadge";
import OfferForm from "@/components/OfferForm";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();

  const user = await getCurrentUser();
  const amenities = property.amenities.split(",").map((a) => a.trim()).filter(Boolean);
  const owner = effectiveOwner(property, property.landlord);
  const posterIsDifferentFromOwner = property.postedOnBehalf && property.landlord.phone !== owner.phone;

  const ownerWhatsappMessage = encodeURIComponent(
    `Hi ${owner.name}, I saw your listing "${property.title}" on Onile and I'm interested.`,
  );
  const posterWhatsappMessage = encodeURIComponent(
    `Hi ${property.landlord.name}, I saw the listing "${property.title}" you posted on Onile and I'm interested.`,
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="h-64 w-full bg-gray-100 sm:h-80">
            {property.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={property.images[0].url} alt={property.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">No photo available</div>
            )}
          </div>
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {property.purpose === "RENT" ? "For Rent" : property.purpose === "SALE" ? "For Sale" : "Shortlet"}
              </span>
              <TrustBadge tier={property.trustTier} />
              {property.status !== "AVAILABLE" && (
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {property.status}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{property.title}</h1>
            <p className="text-gray-600">
              {property.address}, {property.area}, {property.city}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {property.avgRating != null ? (
                <>
                  <StarRating value={property.avgRating} size="sm" />
                  <span className="text-sm text-gray-600">
                    {property.avgRating.toFixed(1)} ({property.reviewCount} review{property.reviewCount === 1 ? "" : "s"})
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-400">No reviews yet</span>
              )}
            </div>

            <p className="mt-4 text-2xl font-bold text-brand-700">
              {formatNaira(property.price)}
              <span className="text-sm font-normal text-gray-500">{priceFrequencyLabel(property.priceFrequency)}</span>
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium">{PROPERTY_TYPE_LABELS[property.propertyType as PropertyType] ?? property.propertyType}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Bedrooms</dt>
                <dd className="font-medium">{property.bedrooms ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Bathrooms</dt>
                <dd className="font-medium">{property.bathrooms ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Listed</dt>
                <dd className="font-medium">{new Date(property.createdAt).toLocaleDateString("en-NG")}</dd>
              </div>
            </dl>

            <p className="mt-4 whitespace-pre-line text-sm text-gray-700">{property.description}</p>

            {amenities.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span key={a} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                    {a}
                  </span>
                ))}
              </div>
            )}

            {property.verificationDocs.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="mb-1.5 text-xs font-medium text-gray-500">Ownership documents submitted</p>
                <div className="flex flex-wrap gap-2">
                  {property.verificationDocs.map((doc) => (
                    <span
                      key={doc.id}
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        doc.status === "APPROVED"
                          ? "bg-brand-50 text-brand-700"
                          : doc.status === "REJECTED"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {DOC_TYPE_LABELS[doc.docType as DocType] ?? doc.docType} —{" "}
                      {doc.status === "APPROVED" ? "Verified" : doc.status === "REJECTED" ? "Rejected" : "Pending review"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Tenant Reviews &amp; Complaints</h2>
          <p className="mb-3 text-sm text-gray-600">
            Honest feedback from people who have actually lived here, so you know what to expect before you sign a
            lease or pay agency fees to view.
          </p>
          <ReviewList reviews={property.reviews} />
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Share your experience</h2>
          {user ? (
            <ReviewForm propertyId={property.id} />
          ) : (
            <p className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-600">
              <Link href="/login" className="font-medium text-brand-700">
                Log in
              </Link>{" "}
              to leave a review, complaint, or agent report about this property.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {property.postedOnBehalf && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
            This listing was posted by <strong>{property.landlord.name}</strong> (
            {RELATIONSHIP_LABELS[property.posterRelationship as RelationshipType] ?? property.posterRelationship}) on
            behalf of the owner, <strong>{owner.name}</strong>.
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 font-semibold text-gray-900">Contact the owner directly</h3>
          <p className="text-sm text-gray-600">{owner.name}</p>
          <TrustBadge tier={property.trustTier} className="mt-1" />
          <p className="mt-1 text-xs text-gray-500">
            Member since {new Date(property.landlord.createdAt).getFullYear()}
          </p>

          {user ? (
            owner.phone && (
              <a
                href={`https://wa.me/${owner.phone.replace(/[^0-9]/g, "")}?text=${ownerWhatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full rounded-md bg-brand-600 py-2 text-center text-sm font-medium text-white hover:bg-brand-700"
              >
                Chat with the Owner on WhatsApp
              </a>
            )
          ) : (
            <Link
              href="/login"
              className="mt-4 block w-full rounded-md bg-brand-600 py-2 text-center text-sm font-medium text-white hover:bg-brand-700"
            >
              Log in to contact owner
            </Link>
          )}

          {user && posterIsDifferentFromOwner && property.landlord.phone && (
            <a
              href={`https://wa.me/${property.landlord.phone.replace(/[^0-9]/g, "")}?text=${posterWhatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block w-full rounded-md border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Contact {property.landlord.name} (posted this listing)
            </a>
          )}

          <p className="mt-3 text-xs text-gray-500">
            No agent, no viewing fees. You&apos;re speaking directly with the owner or someone they&apos;ve
            authorized.
          </p>

          {property.purpose === "SALE" && user && user.id !== property.landlordId && <OfferForm propertyId={property.id} />}
        </div>
      </div>
    </div>
  );
}
