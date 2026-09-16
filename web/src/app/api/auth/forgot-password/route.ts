import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone, looksLikeEmail } from "@/lib/phone";
import { sendSms, generateOtp, isSmsConfigured } from "@/lib/sms";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { forgotPasswordSchema } from "@/lib/validation";

const CODE_TTL_MINUTES = 15;

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "forgot-password", { limit: 5, windowMs: 15 * 60_000 });
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { identifier } = parsed.data;

  const user = looksLikeEmail(identifier)
    ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
    : await prisma.user.findUnique({ where: { phone: normalizePhone(identifier) } });

  // Always answer the same way whether or not the account exists, so this
  // can't be used to discover which numbers are registered.
  const genericResponse: Record<string, unknown> = {
    ok: true,
    message: "If that account exists, we have sent a 6-digit code to the phone number on it.",
    smsConfigured: isSmsConfigured(),
  };

  if (user) {
    // Retire any earlier unused codes so only the newest one works.
    await prisma.passwordResetCode.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = generateOtp();
    await prisma.passwordResetCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
      },
    });

    const { devCode } = await sendSms(
      user.phone,
      `Your Onile password reset code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes. Do not share this code with anyone.`,
    );

    // Outside production, hand the code back so the flow is testable
    // without paying for SMS — same approach as owner phone verification.
    if (process.env.NODE_ENV !== "production") {
      genericResponse.devCode = devCode ?? code;
    }
  }

  return NextResponse.json(genericResponse);
}
