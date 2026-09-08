"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown when something genuinely breaks. Two rules for this screen:
// never blame the user, and always give them a way forward. The technical
// detail goes to the server logs, not to a landlord's phone screen.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[onile] unhandled error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <p className="text-5xl" aria-hidden="true">
        😞
      </p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Something went wrong on our side</h1>
      <p className="mt-2 text-lg text-gray-600">
        This is not your fault, and nothing you did caused it. Please try again — it usually works the second time.
      </p>
      <div className="mt-6 space-y-3">
        <button
          onClick={reset}
          className="w-full rounded-lg bg-brand-600 px-5 py-4 text-lg font-semibold text-white hover:bg-brand-700"
        >
          Try again
        </button>
        <Link
          href="/"
          data-tap
          className="block rounded-lg border-2 border-gray-300 px-5 py-4 text-lg font-semibold text-gray-700 hover:bg-gray-50"
        >
          Go to the home page
        </Link>
        <Link href="/help" className="block pt-2 text-lg font-medium text-brand-700 underline">
          Tell us about this problem
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-sm text-gray-400">Reference code: {error.digest}</p>}
    </div>
  );
}
