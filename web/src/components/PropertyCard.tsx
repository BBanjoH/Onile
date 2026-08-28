import Link from "next/link";
import { formatNaira, priceFrequencyLabel, PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants";
import type { PropertyListItem } from "@/lib/types";

export default function PropertyCard({ property }: { property: PropertyListItem }) {
  const cover = property.images[0]?.url;
  return (
    <Link
      href={`/properties/${property.id}`}
      className="block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="h-40 w-full bg-gray-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={property.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">No photo</div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {property.purpose === "RENT" ? "For Rent" : property.purpose === "SALE" ? "For Sale" : "Shortlet"}
          </span>
          {property.isDirectOwner && (
            <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              Direct from Owner
            </span>
          )}
        </div>
        <h3 className="line-clamp-1 font-semibold text-gray-900">{property.title}</h3>
        <p className="line-clamp-1 text-sm text-gray-500">
          {property.area}, {property.city}
        </p>
        <p className="text-sm text-gray-600">
          {PROPERTY_TYPE_LABELS[property.propertyType as PropertyType] ?? property.propertyType}
          {property.bedrooms != null ? ` · ${property.bedrooms} bed` : ""}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-brand-700">
            {formatNaira(property.price)}
            <span className="text-xs font-normal text-gray-500">{priceFrequencyLabel(property.priceFrequency)}</span>
          </span>
          {property.avgRating != null ? (
            <span className="text-xs text-gray-600">
              ★ {property.avgRating.toFixed(1)} ({property.reviewCount})
            </span>
          ) : (
            <span className="text-xs text-gray-400">No reviews yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
