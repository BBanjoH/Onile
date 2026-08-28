export const ROLES = ["TENANT", "LANDLORD", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const PROPERTY_TYPES = [
  "APARTMENT",
  "DUPLEX",
  "BUNGALOW",
  "SELF_CONTAIN",
  "MINI_FLAT",
  "SHARED_ROOM",
  "COMMERCIAL",
  "LAND",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: "Apartment / Flat",
  DUPLEX: "Duplex",
  BUNGALOW: "Bungalow",
  SELF_CONTAIN: "Self-Contain",
  MINI_FLAT: "Mini Flat",
  SHARED_ROOM: "Shared Room",
  COMMERCIAL: "Commercial Space",
  LAND: "Land",
};

export const PURPOSES = ["RENT", "SALE", "SHORTLET"] as const;
export type Purpose = (typeof PURPOSES)[number];

export const PRICE_FREQUENCIES = ["YEARLY", "MONTHLY", "ONE_TIME"] as const;
export type PriceFrequency = (typeof PRICE_FREQUENCIES)[number];

export const LISTING_STATUSES = ["AVAILABLE", "RENTED", "SOLD", "TAKEN_DOWN"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const REVIEW_TYPES = ["REVIEW", "COMPLAINT", "AGENT_REPORT"] as const;
export type ReviewType = (typeof REVIEW_TYPES)[number];

export const RELATIONSHIP_TYPES = ["CHILD", "SPOUSE", "RELATIVE", "CARETAKER", "PROPERTY_MANAGER", "OTHER"] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  CHILD: "Son / Daughter of the owner",
  SPOUSE: "Spouse of the owner",
  RELATIVE: "Other relative of the owner",
  CARETAKER: "Caretaker",
  PROPERTY_MANAGER: "Property manager",
  OTHER: "Other (not an agent)",
};

export const DOC_TYPES = [
  "C_OF_O",
  "DEED_OF_ASSIGNMENT",
  "GOVERNORS_CONSENT",
  "LAND_USE_CHARGE_RECEIPT",
  "UTILITY_BILL",
  "TENANCY_AGREEMENT",
  "VALID_ID",
  "OTHER",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  C_OF_O: "Certificate of Occupancy (C of O)",
  DEED_OF_ASSIGNMENT: "Deed of Assignment",
  GOVERNORS_CONSENT: "Governor's Consent",
  LAND_USE_CHARGE_RECEIPT: "Land Use Charge (property tax) receipt",
  UTILITY_BILL: "Utility bill in owner's name",
  TENANCY_AGREEMENT: "Existing tenancy agreement naming the owner",
  VALID_ID: "Owner's valid ID (NIN, passport, driver's license)",
  OTHER: "Other proof of ownership",
};

export const LAGOS_AREAS = [
  "Lekki Phase 1",
  "Ajah",
  "Victoria Island",
  "Ikoyi",
  "Yaba",
  "Surulere",
  "Ikeja GRA",
  "Ikeja",
  "Magodo",
  "Gbagada",
  "Ogba",
  "Ojodu",
  "Maryland",
  "Festac Town",
  "Ipaja",
  "Egbeda",
  "Alimosho",
  "Isolo",
  "Apapa",
  "Ogudu",
  "Ojota",
  "Other",
] as const;

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function priceFrequencyLabel(freq: string): string {
  switch (freq) {
    case "YEARLY":
      return "/year";
    case "MONTHLY":
      return "/month";
    default:
      return "";
  }
}
