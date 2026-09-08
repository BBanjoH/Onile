// Phone numbers are the primary identity for a lot of Onile's landlords.
//
// A great many older Nigerian landlords either have no email address or
// can't reliably recall it, but every one of them knows their phone
// number. So Onile lets people sign in with the phone number they already
// give out — which only works if we agree on one canonical way to write it.
//
// Everyone writes theirs differently: 0803 123 4567, +234 803 123 4567,
// 234-803-123-4567. All of those are the same person, so we normalise to
// international form without the plus (2348031234567) on the way into the
// database and on every lookup.

export function normalizePhone(input: string): string {
  const digits = input.replace(/[^0-9]/g, "");

  // 08031234567 -> 2348031234567 (local Nigerian format)
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  // 8031234567 -> 2348031234567 (leading zero dropped)
  if (digits.length === 10 && /^[789]/.test(digits)) return `234${digits}`;
  // 002348031234567 -> 2348031234567 (international dialling prefix)
  if (digits.startsWith("00")) return digits.slice(2);

  return digits;
}

/** True when the text looks like an email address rather than a phone number. */
export function looksLikeEmail(input: string): boolean {
  return input.includes("@");
}

/** Renders a stored number the friendly way: 0803 123 4567. */
export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("234") && digits.length === 13) {
    const local = `0${digits.slice(3)}`;
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return phone;
}
