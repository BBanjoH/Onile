"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatNaira, priceFrequencyLabel, LISTING_STATUSES } from "@/lib/constants";
import { listingStatusLabel } from "@/lib/labels";
import TrustBadge from "@/components/TrustBadge";
import VerificationPanel from "@/components/VerificationPanel";
import type { TrustTier } from "@/lib/verification";

type Props = {
  property: {
    id: string;
    title: string;
    status: string;
    price: number;
    priceFrequency: string;
    area: string;
    imageUrl?: string;
    avgRating: number | null;
    reviewCount: number;
    complaintCount: number;
    trustTier: TrustTier;
    ownerPhone: string;
    ownerPhoneVerifiedAt: string | null;
    ownerCallVerifiedAt: string | null;
    documents: { id: string; docType: string; status: string; reviewerNote: string }[];
  };
};

export default function DashboardListingRow({ property }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(property.status);
  const [busy, setBusy] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  async function updateStatus(newStatus: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setStatus(newStatus);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this listing permanently?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/properties/${property.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded bg-gray-100">
          {property.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={property.imageUrl} alt={property.title} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex-1">
          <Link href={`/properties/${property.id}`} className="font-medium text-gray-900 hover:text-brand-700">
            {property.title}
          </Link>
          <p className="text-sm text-gray-500">{property.area}</p>
          <p className="text-sm font-medium text-brand-700">
            {formatNaira(property.price)}
            <span className="text-xs font-normal text-gray-500">{priceFrequencyLabel(property.priceFrequency)}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>{property.avgRating != null ? `★ ${property.avgRating.toFixed(1)} (${property.reviewCount})` : "No reviews yet"}</span>
            {property.complaintCount > 0 && (
              <span className="text-red-600">{property.complaintCount} complaint{property.complaintCount === 1 ? "" : "s"}</span>
            )}
            <TrustBadge tier={property.trustTier} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            disabled={busy}
            onChange={(e) => updateStatus(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            {LISTING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {listingStatusLabel(s)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowVerification((v) => !v)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {showVerification ? "Hide verification" : "Verify"}
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="rounded-md border border-red-200 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {showVerification && (
        <div className="mt-3">
          <VerificationPanel
            propertyId={property.id}
            ownerPhone={property.ownerPhone}
            ownerPhoneVerifiedAt={property.ownerPhoneVerifiedAt}
            ownerCallVerifiedAt={property.ownerCallVerifiedAt}
            trustTier={property.trustTier}
            documents={property.documents}
          />
        </div>
      )}
    </div>
  );
}
