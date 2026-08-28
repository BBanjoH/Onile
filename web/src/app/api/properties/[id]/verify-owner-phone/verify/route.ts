import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { effectiveOwner } from "@/lib/verification";
import { verifyOtpSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id }, include: { landlord: true } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.landlordId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "You can only verify your own listings" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid code" }, { status: 400 });
  }

  const owner = effectiveOwner(property, property.landlord);
  const otp = await prisma.otpCode.findFirst({
    where: { propertyId: property.id, phone: owner.phone, code: parsed.data.code, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.expiresAt < new Date()) {
    return NextResponse.json({ error: "That code is invalid or has expired. Request a new one." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.property.update({ where: { id: property.id }, data: { ownerPhoneVerifiedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
