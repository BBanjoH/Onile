import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updatePropertySchema } from "@/lib/validation";
import { getPropertyById } from "@/lib/properties";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const user = await getCurrentUser();
  const isOwnerOrAdmin = !!user && (user.id === property.landlordId || user.role === "ADMIN");

  // Only reveal phone numbers (landlord's and, for on-behalf listings, the
  // owner's) to logged-in users. This is a light friction point that
  // discourages scraping/spam while still making direct contact possible
  // for real, interested tenants.
  const { landlord, verificationDocs, ownerPhone, ...rest } = property;
  const responseLandlord = user
    ? landlord
    : { id: landlord.id, name: landlord.name, isVerifiedOwner: landlord.isVerifiedOwner, createdAt: landlord.createdAt };

  // Document file URLs can contain personal ID/ownership scans — only the
  // listing's own landlord or an admin should be able to see the file
  // itself; everyone else just sees the verification status.
  const responseDocs = verificationDocs.map((d) =>
    isOwnerOrAdmin
      ? d
      : { id: d.id, docType: d.docType, status: d.status, createdAt: d.createdAt },
  );

  return NextResponse.json({
    property: { ...rest, ownerPhone: user ? ownerPhone : "", landlord: responseLandlord, verificationDocs: responseDocs },
    contactRequiresLogin: !user,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.landlordId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "You can only edit your own listings" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updatePropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.property.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ property: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.landlordId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "You can only delete your own listings" }, { status: 403 });
  }

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
