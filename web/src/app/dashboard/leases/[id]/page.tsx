import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/constants";
import { ensureUpcomingRentPayment, flagOverduePayments } from "@/lib/rentAutomation";
import { isFlutterwaveConfigured } from "@/lib/flutterwave";
import PaymentRow from "@/components/PaymentRow";
import LeaseStatusControl from "@/components/LeaseStatusControl";

const PAYMENT_BANNER: Record<string, { text: string; style: string }> = {
  success: { text: "Payment received — thank you!", style: "bg-brand-50 text-brand-700" },
  failed: { text: "That payment didn't go through. You can try again below.", style: "bg-red-50 text-red-700" },
  cancelled: { text: "Payment cancelled.", style: "bg-gray-100 text-gray-600" },
  error: { text: "Something went wrong starting that payment.", style: "bg-red-50 text-red-700" },
};

export default async function LeaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { id } = await params;
  const { payment: paymentBannerKey } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const lease = await prisma.lease.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, title: true, address: true, area: true } },
      tenant: { select: { name: true, email: true, phone: true } },
      landlord: { select: { name: true, email: true, phone: true } },
    },
  });
  if (!lease) notFound();
  if (lease.landlordId !== user.id && lease.tenantId !== user.id && user.role !== "ADMIN") redirect("/");

  const isLandlord = lease.landlordId === user.id || user.role === "ADMIN";
  const isTenant = lease.tenantId === user.id;
  const canPayOnline = isTenant && isFlutterwaveConfigured();
  const banner = paymentBannerKey ? PAYMENT_BANNER[paymentBannerKey] : undefined;

  if (lease.status === "ACTIVE") await ensureUpcomingRentPayment(lease.id);
  await flagOverduePayments();

  const payments = await prisma.rentPayment.findMany({ where: { leaseId: id }, orderBy: { dueDate: "asc" } });

  return (
    <div className="space-y-4">
      {banner && <p className={`rounded-md p-3 text-sm ${banner.style}`}>{banner.text}</p>}

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{lease.property.title}</h1>
            <p className="text-sm text-gray-500">
              {lease.property.address}, {lease.property.area}
            </p>
          </div>
          {isLandlord && <LeaseStatusControl leaseId={lease.id} status={lease.status} />}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-gray-500">{isLandlord ? "Tenant" : "Landlord"}</dt>
            <dd className="font-medium">{isLandlord ? lease.tenant.name : lease.landlord.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Rent</dt>
            <dd className="font-medium">
              {formatNaira(lease.rentAmount)} / {lease.rentFrequency.toLowerCase()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Term</dt>
            <dd className="font-medium">
              {new Date(lease.startDate).toLocaleDateString("en-NG")} – {new Date(lease.endDate).toLocaleDateString("en-NG")}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Deposit</dt>
            <dd className="font-medium">{formatNaira(lease.depositAmount)}</dd>
          </div>
        </dl>
        {lease.notes && <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{lease.notes}</p>}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-gray-900">Rent Payment Schedule</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500">No payments scheduled yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2">Due</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Paid</th>
                  {(isLandlord || canPayOnline) && <th className="pb-2 text-right">Action</th>}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <PaymentRow
                    key={p.id}
                    canEdit={isLandlord}
                    canPayOnline={canPayOnline}
                    payment={{
                      id: p.id,
                      amount: p.amount,
                      dueDate: p.dueDate.toISOString(),
                      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
                      status: p.status,
                      method: p.method,
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLandlord && canPayOnline && (
          <p className="mt-3 text-xs text-gray-500">
            "Pay Now" goes straight to your landlord via Flutterwave (card, bank transfer, or USSD) — no agent
            collecting on their behalf.
          </p>
        )}
        {!isLandlord && !canPayOnline && (
          <p className="mt-3 text-xs text-gray-500">
            Your landlord marks payments received here — pay them directly (bank transfer/cash), no agent commission
            involved.
          </p>
        )}
      </div>
    </div>
  );
}
