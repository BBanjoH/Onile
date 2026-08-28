import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { reviewVerificationDocSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = reviewVerificationDocSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const doc = await prisma.propertyVerificationDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const updated = await prisma.propertyVerificationDocument.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewerNote: parsed.data.reviewerNote,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ document: updated });
}
