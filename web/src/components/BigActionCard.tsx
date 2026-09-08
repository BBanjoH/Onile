import Link from "next/link";

/**
 * The main way a landlord moves around Onile: a large, clearly labelled
 * card with an icon, a short title and a line saying what it's for. Sized
 * well past minimum tap-target guidance because the people using it are
 * often older, often outdoors, and often on a cracked phone screen.
 */
export default function BigActionCard({
  href,
  icon,
  title,
  description,
  badge,
  highlight = false,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: number;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      data-tap
      className={`flex items-center gap-4 rounded-xl border-2 p-5 transition hover:shadow-md ${
        highlight ? "border-brand-600 bg-brand-600 text-white hover:bg-brand-700" : "border-gray-200 bg-white hover:border-brand-300"
      }`}
    >
      <span aria-hidden="true" className="text-3xl leading-none">
        {icon}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className={`text-lg font-bold ${highlight ? "text-white" : "text-gray-900"}`}>{title}</span>
          {badge != null && badge > 0 && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{badge}</span>
          )}
        </span>
        <span className={`mt-0.5 block text-sm ${highlight ? "text-brand-50" : "text-gray-600"}`}>{description}</span>
      </span>
      <span aria-hidden="true" className={`text-2xl font-bold ${highlight ? "text-brand-50" : "text-gray-400"}`}>
        ›
      </span>
    </Link>
  );
}
