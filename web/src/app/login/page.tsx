"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not log you in. Please try again.");
        return;
      }
      router.push(data.user?.role === "LANDLORD" || data.user?.role === "ADMIN" ? "/dashboard" : "/my-rentals");
      router.refresh();
    } catch {
      setError("No internet connection. Please check your data and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Welcome back</h1>
      <p className="mb-4 text-gray-600">Log in to see your property, rent and repairs.</p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 font-medium text-red-700">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="identifier" className="mb-1 block font-semibold text-gray-800">
            Phone number or email
          </label>
          <input
            id="identifier"
            name="identifier"
            required
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="0803 123 4567"
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
          />
          <p className="mt-1 text-sm text-gray-500">You can use either one — whichever you remember.</p>
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block font-semibold text-gray-800">
            Password
          </label>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
          />
          <label className="mt-2 flex items-center gap-2 text-gray-700">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Show my password
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-4 text-lg font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Please wait..." : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-center text-gray-700">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-brand-700 underline">
          Create one free
        </Link>
      </p>

      <p className="mt-4 text-center">
        <Link href="/forgot-password" className="font-semibold text-brand-700 underline">
          I forgot my password
        </Link>
      </p>

      <p className="mt-6 text-center">
        <Link href="/help" className="font-medium text-brand-700 underline">
          Need help logging in?
        </Link>
      </p>
    </div>
  );
}
