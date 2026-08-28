"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function Navbar() {
  const { user, loading, refresh } = useCurrentUser();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand-700">Onile</span>
          <span className="hidden text-xs text-gray-500 sm:inline">No Agents. No Wahala.</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-gray-700 hover:text-brand-700">
            Find a Home
          </Link>

          {!loading && user?.role === "LANDLORD" && (
            <>
              <Link href="/dashboard" className="text-gray-700 hover:text-brand-700">
                My Listings
              </Link>
              <Link
                href="/properties/new"
                className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
              >
                Post a Property
              </Link>
            </>
          )}

          {!loading && user?.role === "ADMIN" && (
            <Link href="/admin" className="text-gray-700 hover:text-brand-700">
              Admin
            </Link>
          )}

          {!loading && user && (
            <button onClick={handleLogout} className="text-gray-700 hover:text-brand-700">
              Log out
            </button>
          )}

          {!loading && !user && (
            <>
              <Link href="/login" className="text-gray-700 hover:text-brand-700">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
