import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/constants";
import { leaseStatusLabel } from "@/lib/labels";
import LeaseForm from "@/components/LeaseForm";

export default async function LeasesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "LANDLORD" && user.role !== "ADMIN") redirect("/");

  const [leases, properties] = await Promise.all([
    prisma.lease.findMany({
      where: { landlordId: user.id },
      include: {
        property: { select: { title: true, area: true } },
        tenant: { select: { name: true, email: true } },
        payments: { where: { status: "OVERDUE" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.findMany({ where: { landlordId: user.id }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rent &amp; Tenants</h1>
        <p className="text-gray-600">
          Add a tenant once you have agreed with them. Onile then keeps track of every rent payment for you and tells
          you when someone has not paid.
        </p>
      </div>
      <LeaseForm properties={properties} />

      {leases.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          You have not added a tenant yet. Use the button above once you have agreed rent with someone.
        </p>
      ) : (
        <div className="space-y-2">
          {leases.map((lease) => (
            <Link
              key={lease.id}
              href={`/dashboard/leases/${lease.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-brand-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{lease.property.title}</p>
                  <p className="text-sm text-gray-500">
                    {lease.tenant.name} ({lease.tenant.email}) &middot; {lease.property.area}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-brand-700">
                    {formatNaira(lease.rentAmount)} / {lease.rentFrequency.toLowerCase()}
                  </p>
                  <div className="mt-1 flex items-center justify-end gap-2 text-xs">
                    <span
                      className={`rounded px-2 py-0.5 font-medium ${
                        lease.status === "ACTIVE"
                          ? "bg-brand-50 text-brand-700"
                          : lease.status === "ENDED"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {leaseStatusLabel(lease.status)}
                    </span>
                    {lease.payments.length > 0 && (
                      <span className="rounded bg-red-50 px-2 py-0.5 font-medium text-red-700">
                        {lease.payments.length} rent payment{lease.payments.length === 1 ? "" : "s"} late
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
