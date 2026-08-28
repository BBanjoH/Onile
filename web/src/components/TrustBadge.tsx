import { TRUST_TIER_LABELS, type TrustTier } from "@/lib/verification";

const TIER_STYLES: Record<TrustTier, string> = {
  NONE: "hidden",
  PHONE_VERIFIED: "bg-blue-50 text-blue-700",
  CALL_VERIFIED: "bg-purple-50 text-purple-700",
  DOCUMENT_VERIFIED: "bg-brand-50 text-brand-700",
};

const TIER_ICONS: Record<TrustTier, string> = {
  NONE: "",
  PHONE_VERIFIED: "📱",
  CALL_VERIFIED: "☎️",
  DOCUMENT_VERIFIED: "📄",
};

export default function TrustBadge({ tier, className = "" }: { tier: TrustTier; className?: string }) {
  if (tier === "NONE") return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${TIER_STYLES[tier]} ${className}`}>
      {TIER_ICONS[tier]} {TRUST_TIER_LABELS[tier]}
    </span>
  );
}
