"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import TextSizeControl from "@/components/TextSizeControl";

// Kept deliberately short. Older users get lost in deep menus, so the bar
// carries at most three destinations plus Help — everything else is
// reached from the big buttons on the home screen.
export default function Navbar() {
  const { user, loading, refresh } = useCurrentUser();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
    router.refresh();
  }

  const linkClass =
    "flex items-center rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 hover:text-brand-700";

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link href="/" className="flex items-baseline gap-2" data-tap>
            <span className="text-2xl font-bold text-brand-700">Onile</span>
            <span className="hidden text-sm text-gray-500 sm:inline">No Agents. No Wahala.</span>
          </Link>

          <div className="flex items-center gap-2">
            <TextSizeControl />
            {!loading && user && (
              <button onClick={handleLogout} className={linkClass}>
                Log out
              </button>
            )}
          </div>
        </div>

        <nav className="-mx-1 flex flex-wrap items-center gap-1 pt-1" aria-label="Main">
          <Link href="/" className={linkClass}>
            🔍 Find a Home
          </Link>

          {!loading && (user?.role === "LANDLORD" || user?.role === "ADMIN") && (
            <Link href="/dashboard" className={linkClass}>
              🏠 My Properties
            </Link>
          )}

          {!loading && user && (
            <Link href="/my-rentals" className={linkClass}>
              💰 My Rent
            </Link>
          )}

          {!loading && user?.role === "ADMIN" && (
            <Link href="/admin" className={linkClass}>
              🛡️ Admin
            </Link>
          )}

          <Link href="/help" className={linkClass}>
            ❓ Help
          </Link>

          {!loading && !user && (
            <span className="ml-auto flex items-center gap-2">
              <Link href="/login" className={linkClass}>
                Log in
              </Link>
              <Link
                href="/signup"
                data-tap
                className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
              >
                Sign up free
              </Link>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
