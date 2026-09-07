import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createOfferSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offers = await prisma.purchaseOffer.findMany({
    where: user.role === "ADMIN" ? {} : { OR: [{ buyerId: user.id }, { property: { landlordId: user.id } }] },
    include: {
      property: { select: { id: true, title: true, price: true, landlordId: true } },
      buyer: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ offers });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { propertyId, ...data } = parsed.data;

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.purpose !== "SALE") {
    return NextResponse.json({ error: "Purchase offers can only be made on properties listed for sale" }, { status: 400 });
  }
  if (property.landlordId === user.id) {
    return NextResponse.json({ error: "You can't make an offer on your own listing" }, { status: 400 });
  }

  const offer = await prisma.purchaseOffer.create({
    data: { ...data, propertyId, buyerId: user.id },
    include: { property: { select: { id: true, title: true } } },
  });

  return NextResponse.json({ offer }, { status: 201 });
}
