// Pluggable SMS delivery for phone verification codes.
//
// There's no SMS provider wired up yet, so this dev-mode implementation
// just logs the code server-side and (outside production) echoes it back
// in the API response so the flow is fully testable without paying for
// SMS credits. To go live, replace the body of `sendSms` with a call to
// a real provider that covers Nigerian numbers well — Termii and Africa's
// Talking are the common choices — and remove the devCode passthrough in
// the API routes that call this.
export async function sendSms(phone: string, message: string): Promise<{ devCode?: string }> {
  console.log(`[sms:dev] to=${phone} message="${message}"`);
  return {};
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
