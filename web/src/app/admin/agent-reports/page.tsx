import Link from "next/link";
import { prisma } from "@/lib/db";
import ResolveReportForm from "@/components/admin/ResolveReportForm";

export default async function AgentReportsPage() {
  const reports = await prisma.review.findMany({
    where: { type: "AGENT_REPORT" },
    include: { property: { select: { id: true, title: true, area: true } }, author: { select: { name: true, email: true } } },
    orderBy: [{ moderatorResolvedAt: "asc" }, { createdAt: "desc" }],
  });

  const open = reports.filter((r) => !r.moderatorResolvedAt);
  const resolved = reports.filter((r) => r.moderatorResolvedAt);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Open agent reports ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-sm text-gray-500">No open reports.</p>
        ) : (
          <div className="space-y-3">
            {open.map((r) => (
              <div key={r.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <Link href={`/properties/${r.property.id}`} className="font-medium text-brand-700 hover:underline">
                  {r.property.title}
                </Link>
                <span className="text-xs text-amber-800"> — {r.property.area}</span>
                <p className="mt-1 text-sm font-semibold text-gray-900">{r.title}</p>
                <p className="text-sm text-gray-700">{r.body}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Reported by {r.author.name} ({r.author.email}) on {new Date(r.createdAt).toLocaleDateString()}
                </p>
                <ResolveReportForm reviewId={r.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {resolved.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Resolved ({resolved.length})</h2>
          <div className="space-y-2">
            {resolved.map((r) => (
              <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600">
                <Link href={`/properties/${r.property.id}`} className="font-medium text-gray-800 hover:underline">
                  {r.property.title}
                </Link>{" "}
                — {r.title}
                {r.moderatorNote && <span className="text-gray-500"> · Resolution: {r.moderatorNote}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
