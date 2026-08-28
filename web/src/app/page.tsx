import SearchFilters from "@/components/SearchFilters";
import PropertyCard from "@/components/PropertyCard";
import { searchProperties } from "@/lib/properties";
import type { PropertyListItem } from "@/lib/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const properties = await searchProperties({
    q: sp.q,
    area: sp.area,
    propertyType: sp.propertyType,
    purpose: sp.purpose,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    bedrooms: sp.bedrooms ? Number(sp.bedrooms) : undefined,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-brand-700 px-6 py-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Rent or buy directly from the owner. No agent fees.</h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-50">
          Onile connects you straight to Lagos landlords and property owners, and lets past tenants share honest
          reviews so you know exactly what you&apos;re moving into.
        </p>
      </section>

      <SearchFilters />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{properties.length} propert{properties.length === 1 ? "y" : "ies"} available</h2>
      </div>

      {properties.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No listings match your search yet. Try widening your filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p as unknown as PropertyListItem} />
          ))}
        </div>
      )}
    </div>
  );
}
