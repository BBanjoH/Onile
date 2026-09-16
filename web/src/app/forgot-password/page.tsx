"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Two steps on one page, one question at a time. Forgetting a password is
// already a moment of mild panic for someone who isn't confident with
// technology, so the wording stays calm and there is always a way to
// reach a human.
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [smsConfigured, setSmsConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDevCode(data.devCode ?? null);
      setSmsConfigured(data.smsConfigured !== false);
      setStep(2);
    } catch {
      setError("No internet connection. Please check your data and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not change your password.");
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
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Forgot your password?</h1>
      <p className="mb-4 text-gray-600">
        {step === 1
          ? "It happens. We will send a code to the phone number on your account."
          : "We have sent you a 6-digit code by text message."}
      </p>

      {step === 1 ? (
        <form onSubmit={requestCode} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 font-medium text-red-700">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="identifier" className="mb-1 block font-semibold text-gray-800">
              Your phone number or email
            </label>
            <input
              id="identifier"
              required
              autoComplete="username"
              autoCapitalize="none"
              placeholder="0803 123 4567"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 py-4 text-lg font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Send me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitNewPassword} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 font-medium text-red-700">
              {error}
            </p>
          )}

          {devCode && (
            <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
              <strong>Testing mode:</strong> text messages are not switched on yet, so here is your code:{" "}
              <strong className="text-xl">{devCode}</strong>
            </p>
          )}
          {!smsConfigured && !devCode && (
            <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
              Text messages are not switched on for this site yet. Please{" "}
              <Link href="/help" className="font-semibold underline">
                contact us
              </Link>{" "}
              and we will reset your password for you.
            </p>
          )}

          <div>
            <label htmlFor="code" className="mb-1 block font-semibold text-gray-800">
              The 6-digit code
            </label>
            <input
              id="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-2xl tracking-widest"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1 block font-semibold text-gray-800">
              Choose a new password
            </label>
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
            {loading ? "Please wait..." : "Save my new password"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setCode("");
              setError(null);
            }}
            className="w-full text-center font-medium text-brand-700 underline"
          >
            I did not get a code — try again
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-gray-700">
        <Link href="/login" className="font-semibold text-brand-700 underline">
          Back to log in
        </Link>
      </p>
      <p className="mt-4 text-center">
        <Link href="/help" className="font-medium text-brand-700 underline">
          Still stuck? Talk to a person
        </Link>
      </p>
    </div>
  );
}
