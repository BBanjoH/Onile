import { prisma } from "@/lib/db";
import { verifyTransaction, transactionSatisfiesPayment, mapPaymentTypeToMethod } from "@/lib/flutterwave";

// How far ahead of a lease's start/last-generated payment we pre-create the
// next rent installment, so a landlord always has an upcoming due date on
// their schedule instead of having to remember to add one.
const GENERATE_HORIZON_DAYS = 30;
// A pending payment flips to OVERDUE this many days after its due date,
// giving a small grace window before it's surfaced as late.
const OVERDUE_GRACE_DAYS = 3;
// Leases surfaced as "expiring soon" in the automation summary.
const LEASE_EXPIRY_WARNING_DAYS = 60;

function addInterval(date: Date, frequency: string): Date {
  const next = new Date(date);
  if (frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else if (frequency === "QUARTERLY") next.setMonth(next.getMonth() + 3);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Ensures an ACTIVE lease has its next rent installment on the schedule.
 * Called opportunistically (dashboard load, cron hit) rather than requiring
 * a landlord to manually add each period's rent row — this is the
 * automation that replaces a spreadsheet or an agent's rent-collection
 * calendar.
 */
export async function ensureUpcomingRentPayment(leaseId: string) {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: { payments: { orderBy: { dueDate: "desc" }, take: 1 } },
  });
  if (!lease || lease.status !== "ACTIVE") return;

  const lastPayment = lease.payments[0];
  const nextDueDate = lastPayment ? addInterval(lastPayment.dueDate, lease.rentFrequency) : lease.startDate;

  if (nextDueDate > lease.endDate) return;
  if (nextDueDate > daysFromNow(GENERATE_HORIZON_DAYS)) return;

  await prisma.rentPayment.create({
    data: { leaseId: lease.id, amount: lease.rentAmount, dueDate: nextDueDate, status: "PENDING" },
  });
}

/** Runs ensureUpcomingRentPayment for every active lease belonging to a landlord. */
export async function ensureUpcomingRentPaymentsForLandlord(landlordId: string) {
  const leases = await prisma.lease.findMany({ where: { landlordId, status: "ACTIVE" }, select: { id: true } });
  for (const lease of leases) {
    await ensureUpcomingRentPayment(lease.id);
  }
}

/** Flips any PENDING payment past its grace period to OVERDUE. Safe to call repeatedly. */
export async function flagOverduePayments() {
  const cutoff = daysFromNow(-OVERDUE_GRACE_DAYS);
  const result = await prisma.rentPayment.updateMany({
    where: { status: "PENDING", dueDate: { lt: cutoff } },
    data: { status: "OVERDUE" },
  });
  return result.count;
}

export type SettlementResult = { ok: boolean; reason?: string; alreadyPaid?: boolean };

/**
 * The single place a RentPayment is ever flipped to PAID by an online
 * transaction. Called from both the checkout redirect callback and the
 * webhook, since either can arrive first (or the webhook can arrive
 * without a redirect ever completing) — both paths must independently
 * re-verify with Flutterwave rather than trusting whichever caller got
 * there first, and neither should double-process if the other already
 * settled it.
 */
export async function settlePaymentByTxRef(txRef: string, transactionId: string | number): Promise<SettlementResult> {
  const payment = await prisma.rentPayment.findFirst({ where: { flwTxRef: txRef } });
  if (!payment) return { ok: false, reason: "No payment found for this reference" };
  if (payment.status === "PAID") return { ok: true, alreadyPaid: true };

  let txn;
  try {
    txn = await verifyTransaction(transactionId);
  } catch {
    return { ok: false, reason: "Could not verify transaction with Flutterwave" };
  }
  if (!transactionSatisfiesPayment(txn, { txRef, amount: payment.amount })) {
    return { ok: false, reason: "Transaction did not verify against the expected payment" };
  }

  // Re-check status right before writing — the webhook and the redirect
  // callback race each other, and both call this function.
  const current = await prisma.rentPayment.findUnique({ where: { id: payment.id } });
  if (current?.status === "PAID") return { ok: true, alreadyPaid: true };

  await prisma.rentPayment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      paidAt: new Date(txn.created_at),
      method: mapPaymentTypeToMethod(txn.payment_type),
      note: "Paid online via Flutterwave",
      flwTransactionId: String(txn.id),
    },
  });
  return { ok: true };
}

export type LandlordAutomationSummary = {
  overduePayments: { id: string; leaseId: string; propertyTitle: string; tenantName: string; amount: number; dueDate: Date }[];
  upcomingPayments: { id: string; leaseId: string; propertyTitle: string; tenantName: string; amount: number; dueDate: Date }[];
  expiringLeases: { id: string; propertyTitle: string; tenantName: string; endDate: Date }[];
  openMaintenanceCount: number;
  pendingOfferCount: number;
};

/**
 * Everything a landlord needs to see at a glance to run their portfolio
 * without an agent or manual bookkeeping: what's overdue, what's coming up,
 * which leases need renewing, and what needs a response. This is the panel
 * that makes the automation visible on the dashboard.
 */
export async function getLandlordAutomationSummary(landlordId: string): Promise<LandlordAutomationSummary> {
  await ensureUpcomingRentPaymentsForLandlord(landlordId);
  await flagOverduePayments();

  const [overdue, upcoming, expiring, openMaintenanceCount, pendingOfferCount] = await Promise.all([
    prisma.rentPayment.findMany({
      where: { status: "OVERDUE", lease: { landlordId } },
      include: { lease: { include: { property: { select: { title: true } }, tenant: { select: { name: true } } } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.rentPayment.findMany({
      where: { status: "PENDING", dueDate: { gte: daysFromNow(-OVERDUE_GRACE_DAYS), lte: daysFromNow(GENERATE_HORIZON_DAYS) }, lease: { landlordId } },
      include: { lease: { include: { property: { select: { title: true } }, tenant: { select: { name: true } } } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.lease.findMany({
      where: { landlordId, status: "ACTIVE", endDate: { lte: daysFromNow(LEASE_EXPIRY_WARNING_DAYS) } },
      include: { property: { select: { title: true } }, tenant: { select: { name: true } } },
      orderBy: { endDate: "asc" },
    }),
    prisma.maintenanceRequest.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, property: { landlordId } } }),
    prisma.purchaseOffer.count({ where: { status: { in: ["PENDING", "COUNTERED"] }, property: { landlordId } } }),
  ]);

  return {
    overduePayments: overdue.map((p) => ({
      id: p.id,
      leaseId: p.leaseId,
      propertyTitle: p.lease.property.title,
      tenantName: p.lease.tenant.name,
      amount: p.amount,
      dueDate: p.dueDate,
    })),
    upcomingPayments: upcoming.map((p) => ({
      id: p.id,
      leaseId: p.leaseId,
      propertyTitle: p.lease.property.title,
      tenantName: p.lease.tenant.name,
      amount: p.amount,
      dueDate: p.dueDate,
    })),
    expiringLeases: expiring.map((l) => ({
      id: l.id,
      propertyTitle: l.property.title,
      tenantName: l.tenant.name,
      endDate: l.endDate,
    })),
    openMaintenanceCount,
    pendingOfferCount,
  };
}

export type TenantSummary = {
  leases: {
    id: string;
    propertyTitle: string;
    propertyId: string;
    landlordName: string;
    rentAmount: number;
    rentFrequency: string;
    endDate: Date;
    status: string;
    nextPayment: { id: string; amount: number; dueDate: Date; status: string } | null;
  }[];
};

/** The tenant-side mirror of the automation summary: my leases and what I owe next. */
export async function getTenantSummary(tenantId: string): Promise<TenantSummary> {
  const leases = await prisma.lease.findMany({
    where: { tenantId },
    include: {
      property: { select: { id: true, title: true } },
      landlord: { select: { name: true } },
      payments: { orderBy: { dueDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  for (const lease of leases.filter((l) => l.status === "ACTIVE")) {
    await ensureUpcomingRentPayment(lease.id);
  }
  await flagOverduePayments();

  return {
    leases: leases.map((l) => {
      const nextPayment = l.payments.find((p) => p.status !== "PAID") ?? null;
      return {
        id: l.id,
        propertyTitle: l.property.title,
        propertyId: l.property.id,
        landlordName: l.landlord.name,
        rentAmount: l.rentAmount,
        rentFrequency: l.rentFrequency,
        endDate: l.endDate,
        status: l.status,
        nextPayment: nextPayment
          ? { id: nextPayment.id, amount: nextPayment.amount, dueDate: nextPayment.dueDate, status: nextPayment.status }
          : null,
      };
    }),
  };
}
