import { z } from "zod";
import { PROPERTY_TYPES, PURPOSES, PRICE_FREQUENCIES, LISTING_STATUSES, REVIEW_TYPES, ROLES } from "@/lib/constants";

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number, e.g. 2348012345678"),
  password: z.string().min(8).max(72),
  role: z.enum(["TENANT", "LANDLORD"] as unknown as [string, ...string[]]).default("TENANT"),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const createPropertySchema = z.object({
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
  confirmIsOwner: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you are the owner/landlord, not an agent" }),
  }),
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

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const ROLE_VALUES = ROLES;
