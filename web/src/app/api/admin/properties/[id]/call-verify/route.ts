import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { callVerifySchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = callVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const updated = await prisma.property.update({
    where: { id },
    data: {
      ownerCallVerifiedAt: new Date(),
      ownerCallVerifiedById: admin.id,
      ownerCallNote: parsed.data.note,
    },
  });

  return NextResponse.json({ property: updated });
}
