import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { normalizePhone, looksLikeEmail } from "@/lib/phone";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "login", { limit: 10, windowMs: 5 * 60_000 });
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { identifier, password } = parsed.data;

  // One box, either identity: whatever the person actually remembers.
  const user = looksLikeEmail(identifier)
    ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
    : await prisma.user.findUnique({ where: { phone: normalizePhone(identifier) } });

  // Same message either way, so this can't be used to discover which
  // phone numbers and emails have accounts.
  const invalid = NextResponse.json(
    { error: "That phone number/email and password do not match. Please check and try again." },
    { status: 401 },
  );
  if (!user) return invalid;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return invalid;

  await setSessionCookie(user.id);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
