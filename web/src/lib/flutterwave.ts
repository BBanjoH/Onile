// Flutterwave integration for in-app rent payment. Uses Flutterwave's
// hosted "Standard" checkout (POST /v3/payments returns a link the tenant
// is redirected to) rather than driving raw card/bank-transfer charges
// ourselves — that keeps card data off our servers entirely and gives
// tenants card, bank transfer, and USSD in one flow without us building a
// UI for each rail's OTP/PIN step.
//
// Nothing here is trusted on its own: a successful payment is only ever
// recorded after we independently call verifyTransaction against
// Flutterwave's API (see src/app/api/payments/callback/route.ts and
// src/app/api/webhooks/flutterwave/route.ts) — never from a redirect query
// string or a webhook body alone.
const FLW_V3_BASE_URL = process.env.FLW_V3_BASE_URL ?? "https://api.flutterwave.com/v3";

type FlwResponse<T> = {
  status: "success" | "error";
  message: string;
  data: T;
};

export class FlutterwaveApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "FlutterwaveApiError";
  }
}

function getSecretKey(): string {
  const key = process.env.FLW_SECRET_KEY;
  if (!key) throw new Error("FLW_SECRET_KEY environment variable is not set");
  return key;
}

/** Online rent payment is optional — the manual "Mark Paid" flow always works regardless. */
export function isFlutterwaveConfigured(): boolean {
  return Boolean(process.env.FLW_SECRET_KEY && process.env.FLW_PUBLIC_KEY);
}

async function flwRequest<T>(path: string, init: RequestInit = {}): Promise<FlwResponse<T>> {
  const response = await fetch(`${FLW_V3_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getSecretKey()}`,
      ...(init.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => null)) as FlwResponse<T> | null;
  if (!response.ok || !body || body.status === "error") {
    throw new FlutterwaveApiError(body?.message || "Flutterwave API request failed", response.status, body);
  }
  return body;
}

export type CreatePaymentLinkInput = {
  txRef: string;
  amount: number;
  redirectUrl: string;
  customer: { email: string; phone: string; name: string };
  title: string;
  description: string;
  meta?: Record<string, string>;
};

export type FlwPaymentLinkData = { link: string };

export async function createPaymentLink(input: CreatePaymentLinkInput): Promise<FlwPaymentLinkData> {
  const res = await flwRequest<FlwPaymentLinkData>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: input.amount,
      currency: "NGN",
      redirect_url: input.redirectUrl,
      customer: input.customer,
      customizations: { title: input.title, description: input.description },
      meta: input.meta ?? {},
    }),
  });
  return res.data;
}

export type FlwTransactionData = {
  id: number;
  tx_ref: string;
  amount: number;
  currency: string;
  status: string; // "successful" | "failed" | ...
  payment_type: string; // "card" | "banktransfer" | "ussd" | ...
  created_at: string;
};

export async function verifyTransaction(transactionId: string | number): Promise<FlwTransactionData> {
  const res = await flwRequest<FlwTransactionData>(`/transactions/${transactionId}/verify`, { method: "GET" });
  return res.data;
}

/** Maps Flutterwave's payment_type to our RentPayment.method free-text convention. */
export function mapPaymentTypeToMethod(paymentType: string): string {
  const type = paymentType.toLowerCase();
  if (type.includes("card")) return "CARD";
  if (type.includes("bank") || type.includes("transfer")) return "BANK_TRANSFER";
  return "OTHER";
}

/**
 * Confirms a transaction actually paid for the RentPayment it claims to,
 * by amount and reference — not just that Flutterwave marked *some*
 * transaction successful. Call this before ever flipping a payment to PAID.
 */
export function transactionSatisfiesPayment(
  txn: FlwTransactionData,
  expected: { txRef: string; amount: number },
): boolean {
  return (
    txn.status === "successful" &&
    txn.currency === "NGN" &&
    txn.tx_ref === expected.txRef &&
    txn.amount >= expected.amount
  );
}
