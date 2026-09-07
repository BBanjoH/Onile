import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateMaintenanceRequestSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const request_ = await prisma.maintenanceRequest.findUnique({ where: { id }, include: { property: true } });
  if (!request_) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request_.property.landlordId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the property's landlord can update this request" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateMaintenanceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const resolvingNow = parsed.data.status === "RESOLVED" && request_.status !== "RESOLVED";
  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: { ...parsed.data, ...(resolvingNow ? { resolvedAt: new Date() } : {}) },
  });

  return NextResponse.json({ request: updated });
}
