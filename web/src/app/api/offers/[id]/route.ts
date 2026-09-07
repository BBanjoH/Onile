import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { respondOfferSchema, buyerOfferActionSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offer = await prisma.purchaseOffer.findUnique({ where: { id }, include: { property: true } });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

  const isSeller = offer.property.landlordId === user.id || user.role === "ADMIN";
  const isBuyer = offer.buyerId === user.id;
  if (!isSeller && !isBuyer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);

  if (isSeller) {
    const parsed = respondOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    if (offer.status === "ACCEPTED" || offer.status === "REJECTED" || offer.status === "WITHDRAWN") {
      return NextResponse.json({ error: "This offer has already been settled" }, { status: 400 });
    }
    const updated = await prisma.purchaseOffer.update({
      where: { id },
      data: { ...parsed.data, respondedAt: new Date() },
    });
    if (parsed.data.status === "ACCEPTED") {
      await prisma.property.update({ where: { id: offer.propertyId }, data: { status: "SOLD" } });
    }
    return NextResponse.json({ offer: updated });
  }

  // Buyer path: accept a counter-offer, reject it, or withdraw their own pending offer.
  const parsed = buyerOfferActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  if (offer.status !== "PENDING" && offer.status !== "COUNTERED") {
    return NextResponse.json({ error: "This offer has already been settled" }, { status: 400 });
  }
  if (parsed.data.status === "ACCEPTED" && offer.status !== "COUNTERED") {
    return NextResponse.json({ error: "There's no counter-offer to accept" }, { status: 400 });
  }

  const updated = await prisma.purchaseOffer.update({
    where: { id },
    data: { status: parsed.data.status, respondedAt: new Date() },
  });
  if (parsed.data.status === "ACCEPTED") {
    await prisma.property.update({ where: { id: offer.propertyId }, data: { status: "SOLD" } });
  }
  return NextResponse.json({ offer: updated });
}
