"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"TENANT" | "LANDLORD">("TENANT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create your account. Please try again.");
        return;
      }
      router.push(role === "LANDLORD" ? "/dashboard" : "/");
      router.refresh();
    } catch {
      setError("No internet connection. Please check your data and try again.");
    } finally {
      setLoading(false);
    }
  }

  const choiceClass = (active: boolean) =>
    `flex-1 rounded-lg border-2 px-4 py-4 text-center font-semibold ${
      active ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-700"
    }`;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Create your free account</h1>
      <p className="mb-4 text-gray-600">It takes one minute. Onile never charges you an agent fee.</p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 font-medium text-red-700">
            {error}
          </p>
        )}

        <fieldset>
          <legend className="mb-2 font-semibold text-gray-800">Which one are you?</legend>
          <div className="flex gap-3">
            <button type="button" onClick={() => setRole("TENANT")} aria-pressed={role === "TENANT"} className={choiceClass(role === "TENANT")}>
              🔍
              <span className="mt-1 block">I am looking for a home</span>
            </button>
            <button type="button" onClick={() => setRole("LANDLORD")} aria-pressed={role === "LANDLORD"} className={choiceClass(role === "LANDLORD")}>
              🏠
              <span className="mt-1 block">I own property</span>
            </button>
          </div>
        </fieldset>

        <div>
          <label htmlFor="name" className="mb-1 block font-semibold text-gray-800">
            Your full name
          </label>
          <input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block font-semibold text-gray-800">
            Your phone number
          </label>
          <input
            id="phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0803 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
          />
          <p className="mt-1 text-sm text-gray-500">
            Use your WhatsApp number if you have one. You can log in with this number.
          </p>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block font-semibold text-gray-800">
            Your email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoCapitalize="none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block font-semibold text-gray-800">
            Choose a password
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
          />
          <p className="mt-1 text-sm text-gray-500">At least 8 letters or numbers. Write it down somewhere safe.</p>
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
          {loading ? "Please wait..." : "Create my account"}
        </button>

        <p className="text-center text-sm text-gray-500">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="mt-4 text-center text-gray-700">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
