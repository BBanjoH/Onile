/**
 * Creates (or promotes) an Onile administrator account.
 *
 * Admins get the Trust & Safety dashboard at /admin, where ownership
 * documents are approved, owners are marked as confirmed by phone call,
 * and reports of agents posing as landlords are handled. There is
 * deliberately no way to sign up as an admin through the website, so this
 * script is how the first one is made.
 *
 * Run it with:   npm run create-admin
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

  console.log("\n=== Create an Onile administrator ===\n");
  console.log("This account can approve ownership documents and handle reports of fake landlords.\n");

  const name = (process.env.ADMIN_NAME ?? (await rl.question("Full name: "))).trim();
  const email = (process.env.ADMIN_EMAIL ?? (await rl.question("Email address: "))).trim().toLowerCase();
  const phoneRaw = process.env.ADMIN_PHONE ?? (await rl.question("Phone number: "));
  const password = process.env.ADMIN_PASSWORD ?? (await rl.question("Password (at least 8 characters): "));

  rl.close();

  const phone = normalizePhone(phoneRaw);
  const problems: string[] = [];
  if (name.length < 2) problems.push("Name is too short.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) problems.push("That does not look like an email address.");
  if (phone.length < 10) problems.push("That does not look like a phone number.");
  if (password.length < 8) problems.push("Password must be at least 8 characters.");

  if (problems.length > 0) {
    console.error("\nCould not create the account:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    // Someone already has this email/phone — promote them rather than
    // failing, which is what you want when turning your own account into
    // an admin.
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", passwordHash, name },
    });
    console.log(`\n✅ Existing account "${existing.email}" is now an administrator (password updated).`);
  } else {
    await prisma.user.create({ data: { name, email, phone, passwordHash, role: "ADMIN" } });
    console.log(`\n✅ Administrator account created for ${email}.`);
  }

  console.log("   Log in at /login, then go to /admin.\n");
}

main()
  .catch((e) => {
    console.error("\nSomething went wrong:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
