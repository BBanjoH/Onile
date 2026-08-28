import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type PropertySearchFilters = {
  q?: string;
  area?: string;
  propertyType?: string;
  purpose?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
};

export async function searchProperties(filters: PropertySearchFilters) {
  const { q, area, propertyType, purpose, minPrice, maxPrice, bedrooms } = filters;

  const where: Prisma.PropertyWhereInput = { status: "AVAILABLE" };
  if (area) where.area = { contains: area };
  if (propertyType) where.propertyType = propertyType;
  if (purpose) where.purpose = purpose;
  if (bedrooms !== undefined) where.bedrooms = { gte: bedrooms };
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { address: { contains: q } },
      { area: { contains: q } },
    ];
  }

  const properties = await prisma.property.findMany({
    where,
    include: {
      images: true,
      reviews: { select: { rating: true } },
      landlord: { select: { name: true, isVerifiedOwner: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return properties.map((p) => {
    const ratings = p.reviews.map((r) => r.rating).filter((r): r is number => typeof r === "number");
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    const { reviews: _reviews, ...rest } = p;
    return { ...rest, avgRating, reviewCount: ratings.length };
  });
}

export async function getPropertyById(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: true,
      landlord: { select: { id: true, name: true, phone: true, isVerifiedOwner: true, createdAt: true } },
      reviews: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!property) return null;

  const ratings = property.reviews.map((r) => r.rating).filter((r): r is number => typeof r === "number");
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  return { ...property, avgRating, reviewCount: ratings.length };
}
