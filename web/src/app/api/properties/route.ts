import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createPropertySchema, searchPropertiesSchema } from "@/lib/validation";
import { searchProperties } from "@/lib/properties";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = searchPropertiesSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  const properties = await searchProperties(parsed.data);
  return NextResponse.json({ properties });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to list a property" }, { status: 401 });
  }
  if (user.role !== "LANDLORD" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only landlord accounts can post listings. Sign up as a landlord to continue." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { imageUrls, amenities, confirmIsOwner: _confirmIsOwner, ...data } = parsed.data;

  const property = await prisma.property.create({
    data: {
      ...data,
      amenities: amenities.join(","),
      landlordId: user.id,
      images: { create: imageUrls.map((url) => ({ url })) },
    },
    include: { images: true },
  });

  return NextResponse.json({ property }, { status: 201 });
}
