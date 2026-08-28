import Link from "next/link";
import { findDuplicatePhoneSignals } from "@/lib/verification";

export default async function FraudSignalsPage() {
  const signals = await findDuplicatePhoneSignals();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Duplicate-phone signals ({signals.length})</h2>
        <p className="text-sm text-gray-600">
          The same phone number claimed as the property owner across listings from different accounts or under
          different owner names is the classic fingerprint of an agent posing as multiple different landlords. These
          are worth a closer look — and a call — before trusting either listing.
        </p>
      </div>

      {signals.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No duplicate-phone patterns detected right now.
        </p>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <div key={signal.phone} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Phone {signal.phone}</p>
              <p className="mb-2 text-xs text-amber-800">
                Appears as the owner on {signal.properties.length} listings across{" "}
                {new Set(signal.properties.map((p) => p.landlordId)).size} account(s) and{" "}
                {new Set(signal.properties.map((p) => p.ownerName.toLowerCase())).size} claimed owner name(s).
              </p>
              <ul className="space-y-1">
                {signal.properties.map((p) => (
                  <li key={p.id} className="text-sm text-gray-800">
                    <Link href={`/properties/${p.id}`} className="font-medium text-brand-700 hover:underline">
                      {p.title}
                    </Link>{" "}
                    — {p.area} · claimed owner &ldquo;{p.ownerName}&rdquo; · posted by {p.landlordName} (
                    {p.landlordEmail})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
