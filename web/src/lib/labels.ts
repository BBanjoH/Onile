// Plain-English labels.
//
// The database stores blunt codes (OVERDUE, IN_PROGRESS, TAKEN_DOWN) because
// that's what code needs. Nobody should ever *see* those. Onile's landlords
// are frequently 55+ and not confident with technology or with English
// software jargon, so every status a person can see is translated here into
// a short phrase that says what actually happened, in the words someone
// would use out loud.
//
// Rule of thumb when adding to this file: if you wouldn't say it to
// somebody's grandmother over the phone, don't put it on the screen.

export function rentStatusLabel(status: string): string {
  switch (status) {
    case "PAID":
      return "Paid";
    case "OVERDUE":
      return "Late — not paid";
    case "PENDING":
    default:
      return "Not paid yet";
  }
}

export function leaseStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Tenant is living there";
    case "ENDED":
      return "Finished";
    case "TERMINATED":
      return "Ended early";
    default:
      return status;
  }
}

export function repairStatusLabel(status: string): string {
  switch (status) {
    case "OPEN":
      return "New — not started";
    case "IN_PROGRESS":
      return "Being fixed now";
    case "RESOLVED":
      return "Fixed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

export function repairPriorityLabel(priority: string): string {
  switch (priority) {
    case "LOW":
      return "Can wait";
    case "MEDIUM":
      return "Normal";
    case "HIGH":
      return "Important";
    case "URGENT":
      return "Very urgent";
    default:
      return priority;
  }
}

/** Offers read differently depending on which side of the deal you're on. */
export function offerStatusLabel(status: string, viewpoint: "seller" | "buyer" = "seller"): string {
  switch (status) {
    case "PENDING":
      return viewpoint === "seller" ? "Waiting for your answer" : "Waiting for the owner's answer";
    case "COUNTERED":
      return viewpoint === "seller" ? "You asked for a higher price" : "Owner asked for a higher price";
    case "ACCEPTED":
      return "Accepted";
    case "REJECTED":
      return "Turned down";
    case "WITHDRAWN":
      return "Withdrawn";
    default:
      return status;
  }
}

export function listingStatusLabel(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "Showing to people looking";
    case "RENTED":
      return "Rented out";
    case "SOLD":
      return "Sold";
    case "TAKEN_DOWN":
      return "Hidden — nobody can see it";
    default:
      return status;
  }
}

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case "CASH":
      return "Cash";
    case "BANK_TRANSFER":
      return "Bank transfer";
    case "CARD":
      return "Card";
    case "OTHER":
      return "Other";
    default:
      return method;
  }
}

/** e.g. "12 January 2027" — spelled out, never 12/01/27 which is ambiguous. */
export function friendlyDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Says how far away a date is in words: "today", "in 5 days", "3 days
 * late". Far more meaningful at a glance than a bare date, especially for
 * rent that's due.
 */
export function relativeDayPhrase(date: Date | string, opts: { latePrefix?: string } = {}): string {
  const target = new Date(date);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(target) - startOfDay(new Date())) / 86_400_000);

  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return opts.latePrefix ? `1 day ${opts.latePrefix}` : "yesterday";
  if (days > 1) return `in ${days} days`;
  return `${Math.abs(days)} days ${opts.latePrefix ?? "ago"}`;
}
