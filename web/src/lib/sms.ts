// Text messages: verification codes, password resets, and rent reminders.
//
// SMS matters more here than it would in most apps. Onile's landlords are
// often not in the habit of opening an app to check anything, and many of
// the older ones are on a feature phone or a basic Android they use mostly
// for calls and WhatsApp. A text is the one channel that reliably reaches
// them, so "your tenant's rent is late" needs to arrive as a text, not as
// a badge nobody sees.
//
// Two Nigerian providers are supported because they're the two with good
// local delivery rates. Set SMS_PROVIDER plus the matching key:
//
//   SMS_PROVIDER=termii            TERMII_API_KEY=...   TERMII_SENDER_ID=Onile
//   SMS_PROVIDER=africastalking    AT_API_KEY=...       AT_USERNAME=...
//                                  AT_SENDER_ID=Onile   (optional)
//
// With nothing configured, messages are written to the server log and the
// calling route hands the code back outside production, so every flow
// stays testable without spending money on SMS credits.

export type SendSmsResult = { devCode?: string; delivered: boolean; error?: string };

export function isSmsConfigured(): boolean {
  const provider = process.env.SMS_PROVIDER;
  if (provider === "termii") return Boolean(process.env.TERMII_API_KEY);
  if (provider === "africastalking") return Boolean(process.env.AT_API_KEY && process.env.AT_USERNAME);
  return false;
}

/** Nigerian providers expect the international form without a plus. */
function toInternational(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.length === 10 && /^[789]/.test(digits)) return `234${digits}`;
  return digits;
}

async function sendViaTermii(phone: string, message: string): Promise<void> {
  const res = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: toInternational(phone),
      from: process.env.TERMII_SENDER_ID ?? "N-Alert",
      sms: message,
      type: "plain",
      channel: process.env.TERMII_CHANNEL ?? "generic",
      api_key: process.env.TERMII_API_KEY,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Termii responded ${res.status}: ${detail.slice(0, 200)}`);
  }
}

async function sendViaAfricasTalking(phone: string, message: string): Promise<void> {
  const params = new URLSearchParams({
    username: process.env.AT_USERNAME!,
    to: `+${toInternational(phone)}`,
    message,
  });
  if (process.env.AT_SENDER_ID) params.set("from", process.env.AT_SENDER_ID);

  const res = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey: process.env.AT_API_KEY!,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Africa's Talking responded ${res.status}: ${detail.slice(0, 200)}`);
  }
}

/**
 * Sends one text message. Never throws: a failed reminder must not break
 * the page or job that triggered it, so problems are logged and reported
 * in the return value instead.
 */
export async function sendSms(phone: string, message: string): Promise<SendSmsResult> {
  if (!isSmsConfigured()) {
    console.log(`[sms:not-configured] to=${phone} message="${message}"`);
    return { delivered: false };
  }

  try {
    if (process.env.SMS_PROVIDER === "termii") {
      await sendViaTermii(phone, message);
    } else {
      await sendViaAfricasTalking(phone, message);
    }
    return { delivered: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown SMS error";
    console.error(`[sms:failed] to=${phone}: ${error}`);
    return { delivered: false, error };
  }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
