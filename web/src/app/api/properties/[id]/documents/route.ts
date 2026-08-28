import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { submitVerificationDocSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.landlordId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "You can only submit documents for your own listings" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = submitVerificationDocSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const doc = await prisma.propertyVerificationDocument.create({
    data: { ...parsed.data, propertyId: property.id, submittedById: user.id },
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
