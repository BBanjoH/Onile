"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LAGOS_AREAS, PROPERTY_TYPES, PROPERTY_TYPE_LABELS, PURPOSES, type PropertyType } from "@/lib/constants";

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [area, setArea] = useState(searchParams.get("area") ?? "");
  const [propertyType, setPropertyType] = useState(searchParams.get("propertyType") ?? "");
  const [purpose, setPurpose] = useState(searchParams.get("purpose") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (area) params.set("area", area);
    if (propertyType) params.set("propertyType", propertyType);
    if (purpose) params.set("purpose", purpose);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <input
        type="text"
        placeholder="Search by keyword, address, or area..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        <select value={area} onChange={(e) => setArea(e.target.value)} className="rounded-md border border-gray-300 px-2 py-2 text-sm">
          <option value="">Any area</option>
          {LAGOS_AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {PROPERTY_TYPE_LABELS[t as PropertyType]}
            </option>
          ))}
        </select>
        <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="rounded-md border border-gray-300 px-2 py-2 text-sm">
          <option value="">Rent or Sale</option>
          {PURPOSES.map((p) => (
            <option key={p} value={p}>
              {p === "RENT" ? "For Rent" : p === "SALE" ? "For Sale" : "Shortlet"}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          placeholder="Min beds"
          value={bedrooms}
          onChange={(e) => setBedrooms(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-2 text-sm"
        />
      </div>
      <button type="submit" className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:w-auto sm:px-6">
        Search
      </button>
    </form>
  );
}
