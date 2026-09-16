import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/constants";
import { sendSms, isSmsConfigured } from "@/lib/sms";
import { relativeDayPhrase } from "@/lib/labels";

// Rent reminders by text message.
//
// This is the part that makes the automation real for an older landlord.
// Everything else in Onile assumes somebody opens the app; many of the
// landlords this is built for simply won't, week to week. A text saying
// "Bisi has not paid" is what actually gets the rent chased.
//
// Two rules keep it from becoming a nuisance, which is the fastest way to
// get a sender ID blocked and an app uninstalled:
//   • At most one message per payment every REMINDER_GAP_DAYS.
//   • Tenants are reminded shortly before rent is due and once it is late;
//     landlords are told only when it is actually late, because that is
//     the point at which they need to do something.

const REMINDER_GAP_DAYS = 7;
const DUE_SOON_DAYS = 3;

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function needsReminder(lastReminderAt: Date | null): boolean {
  if (!lastReminderAt) return true;
  return Date.now() - lastReminderAt.getTime() > REMINDER_GAP_DAYS * 86_400_000;
}

export type ReminderRun = {
  smsConfigured: boolean;
  tenantsReminded: number;
  landlordsReminded: number;
  failures: number;
};

/**
 * Texts tenants about rent that is due or late, and landlords about rent
 * they have not been paid. Safe to run every day — it tracks who has
 * already been told.
 */
export async function sendRentReminders(): Promise<ReminderRun> {
  const result: ReminderRun = {
    smsConfigured: isSmsConfigured(),
    tenantsReminded: 0,
    landlordsReminded: 0,
    failures: 0,
  };

  const payments = await prisma.rentPayment.findMany({
    where: {
      status: { in: ["PENDING", "OVERDUE"] },
      dueDate: { lte: daysFromNow(DUE_SOON_DAYS) },
      lease: { status: "ACTIVE" },
    },
    include: {
      lease: {
        include: {
          property: { select: { title: true } },
          tenant: { select: { name: true, phone: true } },
          landlord: { select: { name: true, phone: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 500,
  });

  for (const payment of payments) {
    if (!needsReminder(payment.lastReminderAt)) continue;

    const { lease } = payment;
    const amount = formatNaira(payment.amount);
    const isLate = payment.status === "OVERDUE";
    let sentAnything = false;

    // The tenant: the one who can actually resolve it.
    const tenantMessage = isLate
      ? `Onile: Your rent of ${amount} for ${lease.property.title} is late (it was due ${relativeDayPhrase(payment.dueDate, { latePrefix: "ago" })}). Please pay your landlord ${lease.landlord.name} directly.`
      : `Onile: A reminder that your rent of ${amount} for ${lease.property.title} is due ${relativeDayPhrase(payment.dueDate)}.`;

    if (lease.tenant.phone) {
      const sent = await sendSms(lease.tenant.phone, tenantMessage);
      if (sent.delivered) {
        result.tenantsReminded += 1;
        sentAnything = true;
      } else if (sent.error) {
        result.failures += 1;
      }
    }

    // The landlord: only once it is genuinely late.
    if (isLate && lease.landlord.phone) {
      const sent = await sendSms(
        lease.landlord.phone,
        `Onile: ${lease.tenant.name} has not paid ${amount} rent for ${lease.property.title}. It was due ${relativeDayPhrase(payment.dueDate, { latePrefix: "ago" })}.`,
      );
      if (sent.delivered) {
        result.landlordsReminded += 1;
        sentAnything = true;
      } else if (sent.error) {
        result.failures += 1;
      }
    }

    // Only record a reminder that actually went out, so nobody is skipped
    // because of a provider outage.
    if (sentAnything) {
      await prisma.rentPayment.update({ where: { id: payment.id }, data: { lastReminderAt: new Date() } });
    }
  }

  return result;
}
