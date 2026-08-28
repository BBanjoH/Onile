import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPropertyById } from "@/lib/properties";
import { formatNaira, priceFrequencyLabel, PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants";
import { StarRating } from "@/components/StarRating";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();

  const user = await getCurrentUser();
  const amenities = property.amenities.split(",").map((a) => a.trim()).filter(Boolean);
  const whatsappMessage = encodeURIComponent(
    `Hi ${property.landlord.name}, I saw your listing "${property.title}" on Onile and I'm interested.`,
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
              {property.isDirectOwner && (
                <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Direct from Owner — No Agent Fees
                </span>
              )}
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
              to leave a review or complaint about this property.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 font-semibold text-gray-900">Contact the owner directly</h3>
          <p className="text-sm text-gray-600">{property.landlord.name}</p>
          {property.landlord.isVerifiedOwner && (
            <p className="mt-1 text-xs font-medium text-brand-700">✓ Verified owner</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Member since {new Date(property.landlord.createdAt).getFullYear()}
          </p>

          {user ? (
            property.landlord.phone ? (
              <a
                href={`https://wa.me/${property.landlord.phone.replace(/[^0-9]/g, "")}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full rounded-md bg-brand-600 py-2 text-center text-sm font-medium text-white hover:bg-brand-700"
              >
                Chat on WhatsApp
              </a>
            ) : null
          ) : (
            <Link
              href="/login"
              className="mt-4 block w-full rounded-md bg-brand-600 py-2 text-center text-sm font-medium text-white hover:bg-brand-700"
            >
              Log in to contact owner
            </Link>
          )}
          <p className="mt-3 text-xs text-gray-500">
            No agent, no viewing fees. You&apos;re speaking directly with the person who owns this property.
          </p>
        </div>
      </div>
    </div>
  );
}
