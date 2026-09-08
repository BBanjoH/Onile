import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Lists the public pages for Google. Property pages are included because
// search traffic is how a landlord's listing gets found without paying an
// agent to advertise it.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: appUrl, changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/help`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${appUrl}/signup`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${appUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${appUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const properties = await prisma.property.findMany({
      where: { status: "AVAILABLE" },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    return [
      ...staticPages,
      ...properties.map((p) => ({
        url: `${appUrl}/properties/${p.id}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // A sitemap is never worth taking the site down for.
    return staticPages;
  }
}
