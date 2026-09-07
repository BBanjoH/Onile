import { z } from "zod";
import {
  PROPERTY_TYPES,
  PURPOSES,
  PRICE_FREQUENCIES,
  LISTING_STATUSES,
  REVIEW_TYPES,
  ROLES,
  RELATIONSHIP_TYPES,
  DOC_TYPES,
  LEASE_RENT_FREQUENCIES,
  LEASE_STATUSES,
  PAYMENT_METHODS,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
} from "@/lib/constants";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number, e.g. 2348012345678");

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  phone: phoneSchema,
  password: z.string().min(8).max(72),
  role: z.enum(["TENANT", "LANDLORD"] as unknown as [string, ...string[]]).default("TENANT"),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const createPropertySchema = z
  .object({
    title: z.string().trim().min(5).max(150),
    description: z.string().trim().min(20).max(4000),
    propertyType: z.enum(PROPERTY_TYPES),
    purpose: z.enum(PURPOSES),
    price: z.number().int().positive().max(10_000_000_000),
    priceFrequency: z.enum(PRICE_FREQUENCIES),
    address: z.string().trim().min(5).max(300),
    area: z.string().trim().min(2).max(100),
    bedrooms: z.number().int().min(0).max(50).optional(),
    bathrooms: z.number().int().min(0).max(50).optional(),
    amenities: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
    imageUrls: z.array(z.string().trim().url()).max(10).default([]),
    postedOnBehalf: z.boolean().default(false),
    ownerName: z.string().trim().max(100).default(""),
    ownerPhone: z.union([phoneSchema, z.literal("")]).default(""),
    posterRelationship: z.enum([...RELATIONSHIP_TYPES, ""] as [string, ...string[]]).default(""),
    confirmIsOwner: z.literal(true, {
      errorMap: () => ({
        message:
          "You must confirm this listing is authorized by the actual owner and that no agency/commission fee is being charged to the tenant",
      }),
    }),
  })
  .refine((data) => !data.postedOnBehalf || data.ownerName.length >= 2, {
    message: "Enter the property owner's name",
    path: ["ownerName"],
  })
  .refine((data) => !data.postedOnBehalf || data.ownerPhone.length >= 10, {
    message: "Enter the property owner's phone number",
    path: ["ownerPhone"],
  })
  .refine((data) => !data.postedOnBehalf || data.posterRelationship.length > 0, {
    message: "Select your relationship to the owner",
    path: ["posterRelationship"],
  });

export const updatePropertySchema = z.object({
  status: z.enum(LISTING_STATUSES).optional(),
  title: z.string().trim().min(5).max(150).optional(),
  description: z.string().trim().min(20).max(4000).optional(),
  price: z.number().int().positive().max(10_000_000_000).optional(),
});

export const createReviewSchema = z
  .object({
    propertyId: z.string().min(1),
    type: z.enum(REVIEW_TYPES),
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().trim().min(3).max(150),
    body: z.string().trim().min(10).max(3000),
    livedThere: z.boolean().default(true),
    moveInYear: z
      .number()
      .int()
      .min(1990)
      .max(new Date().getFullYear())
      .optional(),
  })
  .refine((data) => data.type !== "REVIEW" || typeof data.rating === "number", {
    message: "A star rating is required for reviews",
    path: ["rating"],
  });

export const searchPropertiesSchema = z.object({
  q: z.string().trim().max(200).optional(),
  area: z.string().trim().max(100).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  purpose: z.enum(PURPOSES).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
});

export const verifyOtpSchema = z.object({
  code: z.string().trim().regex(/^[0-9]{6}$/, "Enter the 6-digit code"),
});

export const submitVerificationDocSchema = z.object({
  docType: z.enum(DOC_TYPES),
  fileUrl: z.string().trim().url(),
});

export const reviewVerificationDocSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewerNote: z.string().trim().max(1000).default(""),
});

export const callVerifySchema = z.object({
  note: z.string().trim().min(5).max(1000),
});

export const resolveReviewSchema = z.object({
  moderatorNote: z.string().trim().max(1000).default(""),
});

// --- Property management automation -------------------------------------

export const createLeaseSchema = z.object({
  propertyId: z.string().min(1),
  tenantEmail: z.string().trim().email().toLowerCase(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  rentAmount: z.number().int().positive().max(10_000_000_000),
  rentFrequency: z.enum(LEASE_RENT_FREQUENCIES).default("YEARLY"),
  depositAmount: z.number().int().nonnegative().max(10_000_000_000).default(0),
  notes: z.string().trim().max(2000).default(""),
});

export const updateLeaseSchema = z.object({
  status: z.enum(LEASE_STATUSES),
});

export const recordPaymentSchema = z.object({
  amount: z.number().int().positive().max(10_000_000_000),
  dueDate: z.coerce.date(),
  paidAt: z.coerce.date().optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  note: z.string().trim().max(1000).default(""),
});

export const updatePaymentSchema = z.object({
  paidAt: z.coerce.date().nullable().optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  note: z.string().trim().max(1000).optional(),
});

export const createMaintenanceRequestSchema = z.object({
  propertyId: z.string().min(1),
  category: z.enum(MAINTENANCE_CATEGORIES),
  priority: z.enum(MAINTENANCE_PRIORITIES).default("MEDIUM"),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10).max(3000),
});

export const updateMaintenanceRequestSchema = z.object({
  status: z.enum(MAINTENANCE_STATUSES).optional(),
  landlordNote: z.string().trim().max(1000).optional(),
});

export const createOfferSchema = z.object({
  propertyId: z.string().min(1),
  amount: z.number().int().positive().max(50_000_000_000),
  message: z.string().trim().max(2000).default(""),
});

export const respondOfferSchema = z
  .object({
    status: z.enum(["COUNTERED", "ACCEPTED", "REJECTED"]),
    counterAmount: z.number().int().positive().max(50_000_000_000).optional(),
    counterMessage: z.string().trim().max(2000).default(""),
  })
  .refine((data) => data.status !== "COUNTERED" || typeof data.counterAmount === "number", {
    message: "Enter a counter-offer amount",
    path: ["counterAmount"],
  });

export const buyerOfferActionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "WITHDRAWN"]),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CreateMaintenanceRequestInput = z.infer<typeof createMaintenanceRequestSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;

export const ROLE_VALUES = ROLES;
