import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { effectiveOwner, otpExpiryDate } from "@/lib/verification";
import { sendSms, generateOtp } from "@/lib/sms";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Each SMS costs real money once a provider is wired up, so cap how fast
  // one person can trigger them.
  const limit = rateLimit(req, "otp-send", { limit: 5, windowMs: 15 * 60_000 });
  if (!limit.ok) return rateLimitResponse(limit);

  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id }, include: { landlord: true } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.landlordId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "You can only verify your own listings" }, { status: 403 });
  }

  const owner = effectiveOwner(property, property.landlord);
  if (!owner.phone) {
    return NextResponse.json({ error: "No owner phone number on this listing to verify" }, { status: 400 });
  }

  const code = generateOtp();
  await prisma.otpCode.create({
    data: { propertyId: property.id, phone: owner.phone, code, expiresAt: otpExpiryDate() },
  });

  const { devCode } = await sendSms(
    owner.phone,
    `Your Onile verification code is ${code}. It expires in 10 minutes. Do not share this code.`,
  );

  return NextResponse.json({
    ok: true,
    sentTo: owner.phone,
    // Only present outside production — see src/lib/sms.ts.
    devCode: devCode ?? (process.env.NODE_ENV !== "production" ? code : undefined),
  });
}
