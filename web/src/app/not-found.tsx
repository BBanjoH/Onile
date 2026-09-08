import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <p className="text-5xl" aria-hidden="true">
        🤔
      </p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">We could not find that page</h1>
      <p className="mt-2 text-lg text-gray-600">
        The link may be old, or the property may have been rented out and taken down. Nothing is wrong with your phone.
      </p>
      <div className="mt-6 space-y-3">
        <Link
          href="/"
          data-tap
          className="block rounded-lg bg-brand-600 px-5 py-4 text-lg font-semibold text-white hover:bg-brand-700"
        >
          Go to the home page
        </Link>
        <Link
          href="/help"
          data-tap
          className="block rounded-lg border-2 border-gray-300 px-5 py-4 text-lg font-semibold text-gray-700 hover:bg-gray-50"
        >
          Get help
        </Link>
      </div>
    </div>
  );
}
