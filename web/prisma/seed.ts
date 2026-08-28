import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const landlord1 = await prisma.user.upsert({
    where: { email: "tunde.owner@example.com" },
    update: {},
    create: {
      name: "Tunde Adebayo",
      email: "tunde.owner@example.com",
      phone: "2348012345001",
      passwordHash,
      role: "LANDLORD",
      isVerifiedOwner: true,
    },
  });

  const landlord2 = await prisma.user.upsert({
    where: { email: "chioma.owner@example.com" },
    update: {},
    create: {
      name: "Chioma Eze",
      email: "chioma.owner@example.com",
      phone: "2348012345002",
      passwordHash,
      role: "LANDLORD",
      isVerifiedOwner: true,
    },
  });

  const tenant1 = await prisma.user.upsert({
    where: { email: "bisi.tenant@example.com" },
    update: {},
    create: {
      name: "Bisi Okafor",
      email: "bisi.tenant@example.com",
      phone: "2348012345003",
      passwordHash,
      role: "TENANT",
    },
  });

  const tenant2 = await prisma.user.upsert({
    where: { email: "femi.tenant@example.com" },
    update: {},
    create: {
      name: "Femi Balogun",
      email: "femi.tenant@example.com",
      phone: "2348012345004",
      passwordHash,
      role: "TENANT",
    },
  });

  const propertiesData = [
    {
      title: "Newly Renovated 2 Bedroom Flat, Off Admiralty Way",
      description:
        "Bright, well-ventilated 2 bedroom flat in a quiet estate off Admiralty Way. All rooms ensuite, fitted kitchen, 24/7 estate security, and backup generator for common areas. Direct from the owner — no agent fees.",
      propertyType: "APARTMENT" as const,
      purpose: "RENT" as const,
      price: 3_500_000,
      priceFrequency: "YEARLY",
      address: "12 Admiralty Close, Lekki Phase 1",
      area: "Lekki Phase 1",
      bedrooms: 2,
      bathrooms: 2,
      amenities: "24/7 Security,Backup Generator,Fitted Kitchen,Parking Space",
      landlordId: landlord1.id,
    },
    {
      title: "Self-Contained Studio Near UNILAG",
      description:
        "Compact self-contain, ideal for students or young professionals. Water and light included in service charge. Owner lives on-site, so response time on repairs is quick.",
      propertyType: "SELF_CONTAIN" as const,
      purpose: "RENT" as const,
      price: 550_000,
      priceFrequency: "YEARLY",
      address: "8 Herbert Macaulay Way, Yaba",
      area: "Yaba",
      bedrooms: 1,
      bathrooms: 1,
      amenities: "Water Included,Prepaid Meter",
      landlordId: landlord2.id,
    },
    {
      title: "3 Bedroom Terrace Duplex, Magodo Phase 2",
      description:
        "Serene family home in a gated GRA scheme. Boys' quarters included, ample parking for 3 cars, and a small garden. Owner relocating abroad, open to rent or outright sale.",
      propertyType: "DUPLEX" as const,
      purpose: "SALE" as const,
      price: 145_000_000,
      priceFrequency: "ONE_TIME",
      address: "22 Shangisha Road, Magodo Phase 2",
      area: "Magodo",
      bedrooms: 3,
      bathrooms: 4,
      amenities: "BQ,Gated Estate,Garden,Parking Space",
      landlordId: landlord1.id,
    },
    {
      title: "Mini Flat in Surulere, Close to National Stadium",
      description:
        "Tidy mini flat on the first floor of a 6-unit block. Good road network, close to markets and bus stops. Direct from the family that owns the building.",
      propertyType: "MINI_FLAT" as const,
      purpose: "RENT" as const,
      price: 900_000,
      priceFrequency: "YEARLY",
      address: "15 Bode Thomas Street, Surulere",
      area: "Surulere",
      bedrooms: 1,
      bathrooms: 1,
      amenities: "Tarred Road Access,Water Borehole",
      landlordId: landlord2.id,
    },
    {
      title: "Shortlet 1 Bedroom Apartment, Ikeja GRA",
      description:
        "Fully furnished shortlet apartment for short stays — great for relocation while you house-hunt. Wi-Fi, DSTV, and 24-hour electricity from inverter/solar.",
      propertyType: "APARTMENT" as const,
      purpose: "SHORTLET" as const,
      price: 45_000,
      priceFrequency: "MONTHLY",
      address: "5 Oduduwa Crescent, Ikeja GRA",
      area: "Ikeja GRA",
      bedrooms: 1,
      bathrooms: 1,
      amenities: "Furnished,Wi-Fi,DSTV,Inverter/Solar",
      landlordId: landlord1.id,
    },
  ];

  const properties = [];
  for (const data of propertiesData) {
    const existing = await prisma.property.findFirst({ where: { title: data.title } });
    const property =
      existing ??
      (await prisma.property.create({
        data: {
          ...data,
          images: {
            create: [{ url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2" }],
          },
        },
      }));
    properties.push(property);
  }

  const reviewsSeed = [
    {
      propertyIndex: 0,
      authorId: tenant1.id,
      type: "REVIEW" as const,
      rating: 4,
      title: "Lived here for a year, mostly good",
      body: "Estate security is solid and the landlord fixed our plumbing issue within 2 days of reporting. Only downside is street noise from the main road in the evening.",
      livedThere: true,
      moveInYear: 2023,
    },
    {
      propertyIndex: 1,
      authorId: tenant2.id,
      type: "COMPLAINT" as const,
      rating: 2,
      title: "Water supply inconsistent",
      body: "The listing says water is included, but the borehole pump broke for 3 weeks and management was slow to fix it. Otherwise the room itself is fine and secure.",
      livedThere: true,
      moveInYear: 2024,
    },
    {
      propertyIndex: 3,
      authorId: tenant1.id,
      type: "REVIEW" as const,
      rating: 5,
      title: "Great value, responsive owner",
      body: "Direct dealing with the landlord saved us a lot of money versus what agents around Surulere were quoting. No issues in 8 months.",
      livedThere: true,
      moveInYear: 2024,
    },
  ];

  for (const r of reviewsSeed) {
    const property = properties[r.propertyIndex];
    const exists = await prisma.review.findFirst({
      where: { propertyId: property.id, authorId: r.authorId, title: r.title },
    });
    if (!exists) {
      await prisma.review.create({
        data: {
          propertyId: property.id,
          authorId: r.authorId,
          type: r.type,
          rating: r.rating,
          title: r.title,
          body: r.body,
          livedThere: r.livedThere,
          moveInYear: r.moveInYear,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Demo accounts (password: password123):");
  console.log("  Landlord: tunde.owner@example.com");
  console.log("  Landlord: chioma.owner@example.com");
  console.log("  Tenant:   bisi.tenant@example.com");
  console.log("  Tenant:   femi.tenant@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
