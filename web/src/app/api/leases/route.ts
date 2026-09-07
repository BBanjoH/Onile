import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createLeaseSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leases = await prisma.lease.findMany({
    where: user.role === "ADMIN" ? {} : { OR: [{ landlordId: user.id }, { tenantId: user.id }] },
    include: {
      property: { select: { id: true, title: true, area: true } },
      tenant: { select: { id: true, name: true, email: true, phone: true } },
      landlord: { select: { id: true, name: true, email: true, phone: true } },
      payments: { orderBy: { dueDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leases });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "LANDLORD" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only landlord accounts can create leases" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createLeaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { propertyId, tenantEmail, ...data } = parsed.data;

  if (data.endDate <= data.startDate) {
    return NextResponse.json({ error: "End date must be after the start date" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.landlordId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "You can only create leases for your own properties" }, { status: 403 });
  }

  const tenant = await prisma.user.findUnique({ where: { email: tenantEmail } });
  if (!tenant) {
    return NextResponse.json(
      { error: "No Onile account found with that tenant email. Ask them to sign up first." },
      { status: 404 },
    );
  }

  const lease = await prisma.lease.create({
    data: { ...data, propertyId, tenantId: tenant.id, landlordId: property.landlordId },
    include: {
      property: { select: { id: true, title: true } },
      tenant: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.rentPayment.create({
    data: { leaseId: lease.id, amount: lease.rentAmount, dueDate: lease.startDate, status: "PENDING" },
  });

  await prisma.property.update({ where: { id: propertyId }, data: { status: "RENTED" } });

  return NextResponse.json({ lease }, { status: 201 });
}
