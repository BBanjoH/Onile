import { prisma } from "@/lib/db";

// Making the very first administrator, without a terminal.
//
// Onile deliberately has no "sign up as an admin" option — otherwise
// anyone could award themselves the power to approve ownership documents.
// That left one problem: the person who owns the site had no way to make
// their own admin account except by running a command, which is the one
// thing a non-technical owner cannot do.
//
// So: set BOOTSTRAP_ADMIN_EMAIL to your own email address in your hosting
// settings, and that one account becomes an administrator when it signs up
// or next logs in. Whoever can set environment variables already controls
// the whole deployment, so this grants nothing they did not already have.
//
// Leave it unset and nothing happens at all.
export async function promoteBootstrapAdmin(user: { id: string; email: string; role: string }): Promise<boolean> {
  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (!bootstrapEmail) return false;
  if (user.email.toLowerCase() !== bootstrapEmail) return false;
  if (user.role === "ADMIN") return false;

  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  console.log(`[onile] promoted ${user.email} to ADMIN via BOOTSTRAP_ADMIN_EMAIL`);
  return true;
}
