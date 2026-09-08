import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";
import { normalizePhone } from "@/lib/phone";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "signup", { limit: 5, windowMs: 60 * 60_000 });
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, email, password, role } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.email === email
            ? "An account with this email already exists. Try logging in instead."
            : "An account with this phone number already exists. Try logging in instead.",
      },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role },
  });

  await setSessionCookie(user.id);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
