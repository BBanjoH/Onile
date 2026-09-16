import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { normalizePhone, looksLikeEmail } from "@/lib/phone";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resetPasswordSchema } from "@/lib/validation";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, "reset-password", { limit: 10, windowMs: 15 * 60_000 });
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { identifier, code, newPassword } = parsed.data;

  const invalid = NextResponse.json(
    { error: "That code is wrong or has expired. Please ask for a new one." },
    { status: 400 },
  );

  const user = looksLikeEmail(identifier)
    ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
    : await prisma.user.findUnique({ where: { phone: normalizePhone(identifier) } });
  if (!user) return invalid;

  const reset = await prisma.passwordResetCode.findFirst({
    where: { userId: user.id, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!reset || reset.expiresAt < new Date()) return invalid;

  // Count the guess before checking it, so a wrong code always costs an
  // attempt — otherwise a 6-digit code could be walked through.
  if (reset.attempts + 1 > MAX_ATTEMPTS) {
    await prisma.passwordResetCode.update({ where: { id: reset.id }, data: { consumedAt: new Date() } });
    return NextResponse.json(
      { error: "Too many wrong tries. Please ask for a new code." },
      { status: 429 },
    );
  }
  await prisma.passwordResetCode.update({ where: { id: reset.id }, data: { attempts: { increment: 1 } } });

  if (reset.code !== code) return invalid;

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordResetCode.update({ where: { id: reset.id }, data: { consumedAt: new Date() } }),
  ]);

  // Log them straight in — making someone who just proved they own the
  // number type the brand-new password again is needless friction.
  await setSessionCookie(user.id);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
