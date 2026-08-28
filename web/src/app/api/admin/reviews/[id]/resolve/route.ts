import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { resolveReviewSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = resolveReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const updated = await prisma.review.update({
    where: { id },
    data: { moderatorResolvedAt: new Date(), moderatorNote: parsed.data.moderatorNote },
  });

  return NextResponse.json({ review: updated });
}
