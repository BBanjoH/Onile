import { prisma } from "@/lib/db";

export type EffectiveOwner = { name: string; phone: string };

/**
 * The person who actually owns a listing, as distinct from whoever's
 * account posted it. When `postedOnBehalf` is false the poster IS the
 * owner, so we read their account name/phone; otherwise we read the
 * owner fields captured on the listing itself. Always use this instead of
 * reading `property.ownerName`/`ownerPhone` directly.
 */
export function effectiveOwner(
  property: { postedOnBehalf: boolean; ownerName: string; ownerPhone: string },
  landlord: { name: string; phone: string },
): EffectiveOwner {
  if (property.postedOnBehalf) {
    return { name: property.ownerName, phone: property.ownerPhone };
  }
  return { name: landlord.name, phone: landlord.phone };
}

export type TrustTier = "NONE" | "PHONE_VERIFIED" | "CALL_VERIFIED" | "DOCUMENT_VERIFIED";

export const TRUST_TIER_LABELS: Record<TrustTier, string> = {
  NONE: "Not yet verified",
  PHONE_VERIFIED: "Owner phone verified",
  CALL_VERIFIED: "Confirmed by phone call with Onile",
  DOCUMENT_VERIFIED: "Ownership document verified",
};

export function getPropertyTrustTier(property: {
  ownerPhoneVerifiedAt: Date | null;
  ownerCallVerifiedAt: Date | null;
  verificationDocs?: { status: string }[];
}): TrustTier {
  if (property.verificationDocs?.some((d) => d.status === "APPROVED")) return "DOCUMENT_VERIFIED";
  if (property.ownerCallVerifiedAt) return "CALL_VERIFIED";
  if (property.ownerPhoneVerifiedAt) return "PHONE_VERIFIED";
  return "NONE";
}

const OTP_TTL_MINUTES = 10;

export function otpExpiryDate(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

export type DuplicatePhoneSignal = {
  phone: string;
  properties: {
    id: string;
    title: string;
    area: string;
    ownerName: string;
    landlordId: string;
    landlordName: string;
    landlordEmail: string;
  }[];
};

/**
 * The cheapest fraud signal available: the same phone number showing up
 * as the "owner" behind listings claimed by different accounts or under
 * different owner names is the classic fingerprint of an agent posting
 * multiple properties as if each had a different landlord. Flags any
 * phone number shared across more than one distinct landlord account or
 * claimed owner name.
 */
export async function findDuplicatePhoneSignals(): Promise<DuplicatePhoneSignal[]> {
  const properties = await prisma.property.findMany({
    where: { status: { not: "TAKEN_DOWN" } },
    include: { landlord: { select: { id: true, name: true, email: true, phone: true } } },
  });

  const groups = new Map<string, typeof properties>();
  for (const p of properties) {
    const owner = effectiveOwner(p, p.landlord);
    const phone = owner.phone.replace(/[^0-9]/g, "");
    if (!phone) continue;
    const bucket = groups.get(phone) ?? [];
    bucket.push(p);
    groups.set(phone, bucket);
  }

  const signals: DuplicatePhoneSignal[] = [];
  for (const [phone, group] of groups) {
    const distinctLandlords = new Set(group.map((p) => p.landlordId));
    const distinctOwnerNames = new Set(
      group.map((p) => effectiveOwner(p, p.landlord).name.trim().toLowerCase()).filter(Boolean),
    );
    if (distinctLandlords.size > 1 || distinctOwnerNames.size > 1) {
      signals.push({
        phone,
        properties: group.map((p) => ({
          id: p.id,
          title: p.title,
          area: p.area,
          ownerName: effectiveOwner(p, p.landlord).name,
          landlordId: p.landlordId,
          landlordName: p.landlord.name,
          landlordEmail: p.landlord.email,
        })),
      });
    }
  }

  return signals;
}
