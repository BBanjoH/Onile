"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  PURPOSES,
  PRICE_FREQUENCIES,
  LAGOS_AREAS,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_LABELS,
  type PropertyType,
  type RelationshipType,
} from "@/lib/constants";

export default function NewPropertyPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("APARTMENT");
  const [purpose, setPurpose] = useState<(typeof PURPOSES)[number]>("RENT");
  const [price, setPrice] = useState("");
  const [priceFrequency, setPriceFrequency] = useState<(typeof PRICE_FREQUENCIES)[number]>("YEARLY");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState<string>(LAGOS_AREAS[0]);
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [amenities, setAmenities] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [postedOnBehalf, setPostedOnBehalf] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [posterRelationship, setPosterRelationship] = useState<RelationshipType>("CHILD");
  const [confirmIsOwner, setConfirmIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          propertyType,
          purpose,
          price: Number(price),
          priceFrequency,
          address,
          area,
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          bathrooms: bathrooms ? Number(bathrooms) : undefined,
          amenities: amenities
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          imageUrls: imageUrls
            .split("\n")
            .map((u) => u.trim())
            .filter(Boolean),
          postedOnBehalf,
          ownerName: postedOnBehalf ? ownerName : "",
          ownerPhone: postedOnBehalf ? ownerPhone : "",
          posterRelationship: postedOnBehalf ? posterRelationship : "",
          confirmIsOwner,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create listing");
        return;
      }
      router.push(`/properties/${data.property.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-bold">Post your property</h1>
      <p className="mb-4 text-sm text-gray-600">
        List directly to tenants and buyers — no agent commission. Only property owners/landlords can post.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
          <input
            required
            placeholder="e.g. Newly Renovated 2 Bedroom Flat, Off Admiralty Way"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <label className="mb-2 block text-sm font-medium text-gray-700">Who is the property owner?</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPostedOnBehalf(false)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${!postedOnBehalf ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-600"}`}
            >
              I am the owner
            </button>
            <button
              type="button"
              onClick={() => setPostedOnBehalf(true)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${postedOnBehalf ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-600"}`}
            >
              I&apos;m posting for the owner
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Many landlords (especially older ones) don&apos;t use apps themselves — that&apos;s fine. If you&apos;re a
            family member, caretaker, or property manager, say so honestly and give the actual owner&apos;s phone
            number below. We verify that number directly so tenants know it&apos;s real. Property agents charging a
            commission may not post on Onile.
          </p>

          {postedOnBehalf && (
            <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Your relationship to the owner</label>
                <select
                  value={posterRelationship}
                  onChange={(e) => setPosterRelationship(e.target.value as RelationshipType)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {RELATIONSHIP_TYPES.map((r) => (
                    <option key={r} value={r}>
                      {RELATIONSHIP_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Owner&apos;s full name</label>
                <input
                  required={postedOnBehalf}
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Owner&apos;s phone number (any phone — doesn&apos;t need to be a smartphone)
                </label>
                <input
                  required={postedOnBehalf}
                  placeholder="2348012345678"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  After posting, we&apos;ll send a one-time code by SMS to this number to confirm it&apos;s real.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Property type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as (typeof PURPOSES)[number])}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p === "RENT" ? "For Rent" : p === "SALE" ? "For Sale" : "Shortlet"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Price (₦)</label>
            <input
              required
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Billing</label>
            <select
              value={priceFrequency}
              onChange={(e) => setPriceFrequency(e.target.value as (typeof PRICE_FREQUENCIES)[number])}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="YEARLY">Per year</option>
              <option value="MONTHLY">Per month</option>
              <option value="ONE_TIME">One-time (sale)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Full address</label>
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Area</label>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            {LAGOS_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bedrooms</label>
            <input
              type="number"
              min={0}
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bathrooms</label>
            <input
              type="number"
              min={0}
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Amenities (comma-separated)</label>
          <input
            placeholder="24/7 Security, Backup Generator, Parking Space"
            value={amenities}
            onChange={(e) => setAmenities(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Photo URLs (one per line, optional)</label>
          <textarea
            rows={3}
            placeholder="https://..."
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={confirmIsOwner}
            onChange={(e) => setConfirmIsOwner(e.target.checked)}
            className="mt-0.5"
          />
          I confirm this listing is authorized by the property&apos;s actual owner, and that neither I nor anyone
          else is charging the tenant a commission or agency fee for it.
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Publishing..." : "Publish listing"}
        </button>
        <p className="text-center text-xs text-gray-500">
          After publishing, verify the owner&apos;s phone number from your dashboard — verified listings get a trust
          badge and get shown as more trustworthy to tenants.
        </p>
      </form>
    </div>
  );
}
