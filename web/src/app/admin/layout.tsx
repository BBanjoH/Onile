import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Trust &amp; Safety</h1>
        <nav className="mt-2 flex gap-4 border-b border-gray-200 text-sm">
          <Link href="/admin/verifications" className="border-b-2 border-transparent pb-2 text-gray-600 hover:border-brand-600 hover:text-brand-700">
            Verification queue
          </Link>
          <Link href="/admin/fraud-signals" className="border-b-2 border-transparent pb-2 text-gray-600 hover:border-brand-600 hover:text-brand-700">
            Duplicate-phone signals
          </Link>
          <Link href="/admin/agent-reports" className="border-b-2 border-transparent pb-2 text-gray-600 hover:border-brand-600 hover:text-brand-700">
            Agent reports
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
