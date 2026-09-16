/**
 * Sets a new password for an existing account.
 *
 * This is the path for support: a landlord calls the number on the Help
 * page saying they can't get in, and whoever answers can fix it on the
 * spot — useful before text messages are switched on, and as a fallback
 * for anyone who has changed phone number and so can't receive a code.
 *
 * Unlike create-admin, this never changes what the account is allowed to
 * do — it only sets the password.
 *
 * Run it with:   npm run reset-password
 */
import { createInterface } from "readline/promises";
import { stdin, stdout } from "process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function normalizePhone(input: string): string {
  const digits = input.replace(/[^0-9]/g, "");
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.length === 10 && /^[789]/.test(digits)) return `234${digits}`;
  if (digits.startsWith("00")) return digits.slice(2);
  return digits;
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("\n=== Reset a password for an Onile user ===\n");

  const identifier = (process.env.RESET_IDENTIFIER ?? (await rl.question("Their phone number or email: "))).trim();
  const newPassword = process.env.RESET_PASSWORD ?? (await rl.question("New password (at least 8 characters): "));
  rl.close();

  if (newPassword.length < 8) {
    console.error("\nPassword must be at least 8 characters.");
    process.exit(1);
  }

  const user = identifier.includes("@")
    ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
    : await prisma.user.findUnique({ where: { phone: normalizePhone(identifier) } });

  if (!user) {
    console.error(`\nNo account found for "${identifier}".`);
    console.error("Check the spelling, and remember they may have signed up with the other one.");
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  // Any outstanding reset codes are now meaningless.
  await prisma.passwordResetCode.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  console.log(`\n✅ Password changed for ${user.name} (${user.email}).`);
  console.log("   Tell them to log in with the new password, and to change it once they are in.\n");
}

main()
  .catch((e) => {
    console.error("\nSomething went wrong:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
