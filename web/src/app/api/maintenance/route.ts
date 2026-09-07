import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createMaintenanceRequestSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await prisma.maintenanceRequest.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : user.role === "LANDLORD"
          ? { property: { landlordId: user.id } }
          : { tenantId: user.id },
    include: {
      property: { select: { id: true, title: true, area: true, landlordId: true } },
      tenant: { select: { name: true, phone: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createMaintenanceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { propertyId, ...data } = parsed.data;

  const activeLease = await prisma.lease.findFirst({
    where: { propertyId, tenantId: user.id, status: "ACTIVE" },
  });
  if (!activeLease && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "You can only raise a maintenance request for a property you have an active lease on" },
      { status: 403 },
    );
  }

  const request_ = await prisma.maintenanceRequest.create({
    data: { ...data, propertyId, tenantId: user.id },
    include: { property: { select: { id: true, title: true } } },
  });

  return NextResponse.json({ request: request_ }, { status: 201 });
}
