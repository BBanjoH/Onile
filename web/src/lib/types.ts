import type { TrustTier } from "@/lib/verification";

export type PropertyImage = { id: string; url: string };

export type PropertyListItem = {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  purpose: string;
  price: number;
  priceFrequency: string;
  address: string;
  area: string;
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string;
  status: string;
  isDirectOwner: boolean;
  postedOnBehalf: boolean;
  images: PropertyImage[];
  avgRating: number | null;
  reviewCount: number;
  trustTier: TrustTier;
  landlord?: { name: string; isVerifiedOwner: boolean };
  createdAt: string;
};

export type ReviewItem = {
  id: string;
  type: string;
  rating: number | null;
  title: string;
  body: string;
  livedThere: boolean;
  moveInYear: number | null;
  createdAt: Date;
  author: { name: string };
};

export type PropertyDetail = PropertyListItem & {
  landlord: {
    id: string;
    name: string;
    phone?: string;
    isVerifiedOwner: boolean;
    createdAt: string;
  };
  reviews: ReviewItem[];
};
