import { prisma } from "@/lib/db";
import { effectiveOwner } from "@/lib/verification";
import { DOC_TYPE_LABELS, type DocType } from "@/lib/constants";
import DocumentReviewActions from "@/components/admin/DocumentReviewActions";
import CallVerifyForm from "@/components/admin/CallVerifyForm";

export default async function AdminVerificationsPage() {
  const pendingDocs = await prisma.propertyVerificationDocument.findMany({
    where: { status: "PENDING" },
    include: { property: { include: { landlord: { select: { name: true, phone: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  const notCallVerified = await prisma.property.findMany({
    where: { ownerCallVerifiedAt: null, status: { not: "TAKEN_DOWN" } },
    include: { landlord: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Pending ownership documents ({pendingDocs.length})
        </h2>
        {pendingDocs.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing waiting on review.</p>
        ) : (
          <div className="space-y-3">
            {pendingDocs.map((doc) => {
              const owner = effectiveOwner(doc.property, doc.property.landlord);
              return (
                <div key={doc.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-900">{doc.property.title}</p>
                  <p className="text-xs text-gray-500">
                    Claimed owner: {owner.name} ({owner.phone}) · Submitted by {doc.property.landlord.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    Document type: <strong>{DOC_TYPE_LABELS[doc.docType as DocType] ?? doc.docType}</strong>
                  </p>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-brand-700 underline"
                  >
                    View submitted file
                  </a>
                  <DocumentReviewActions documentId={doc.id} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Listings not yet confirmed by phone call ({notCallVerified.length})
        </h2>
        <p className="mb-3 text-sm text-gray-600">
          Call the owner directly (not the poster, if different) and confirm they own the property and authorized
          this listing.
        </p>
        <div className="space-y-3">
          {notCallVerified.map((p) => {
            const owner = effectiveOwner(p, p.landlord);
            return (
              <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-900">{p.title}</p>
                <p className="text-xs text-gray-500">
                  Call: {owner.name} — {owner.phone || "no phone on file"}
                  {p.postedOnBehalf && ` (posted by ${p.landlord.name}, ${p.landlord.phone})`}
                </p>
                <CallVerifyForm propertyId={p.id} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
