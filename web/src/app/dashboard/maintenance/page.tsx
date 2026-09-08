import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MAINTENANCE_CATEGORY_LABELS, type MaintenanceCategory } from "@/lib/constants";
import { repairPriorityLabel, friendlyDate } from "@/lib/labels";
import MaintenanceStatusControl from "@/components/MaintenanceStatusControl";

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH: "bg-amber-50 text-amber-800",
  URGENT: "bg-red-50 text-red-700",
};

export default async function MaintenancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "LANDLORD" && user.role !== "ADMIN") redirect("/");

  const requests = await prisma.maintenanceRequest.findMany({
    where: user.role === "ADMIN" ? {} : { property: { landlordId: user.id } },
    include: { property: { select: { title: true, area: true } }, tenant: { select: { name: true, phone: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Repairs</h1>
      <p className="text-gray-600">
        Problems your tenants have reported. Change the box under each one to tell your tenant what is happening.
      </p>

      {requests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No maintenance requests yet.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${PRIORITY_STYLES[r.priority] ?? "bg-gray-100"}`}>
                      {repairPriorityLabel(r.priority)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {MAINTENANCE_CATEGORY_LABELS[r.category as MaintenanceCategory] ?? r.category} &middot; reported{" "}
                      {friendlyDate(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 font-medium text-gray-900">{r.title}</p>
                  <p className="text-sm text-gray-500">
                    {r.property.title}, {r.property.area} &middot; {r.tenant.name} ({r.tenant.phone})
                  </p>
                  <p className="mt-2 text-sm text-gray-700">{r.description}</p>
                </div>
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3">
                <MaintenanceStatusControl id={r.id} status={r.status} landlordNote={r.landlordNote} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
