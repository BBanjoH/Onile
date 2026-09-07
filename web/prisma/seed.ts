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

  const admin = await prisma.user.upsert({
    where: { email: "admin@onile.app" },
    update: {},
    create: {
      name: "Onile Trust & Safety",
      email: "admin@onile.app",
      phone: "2348012345099",
      passwordHash,
      role: "ADMIN",
    },
  });

  // A caretaker account posting honestly on behalf of an elderly relative
  // who doesn't use a smartphone — the "posted on behalf" flow.
  const caretaker = await prisma.user.upsert({
    where: { email: "yusuf.caretaker@example.com" },
    update: {},
    create: {
      name: "Yusuf Bello",
      email: "yusuf.caretaker@example.com",
      phone: "2348055512345",
      passwordHash,
      role: "LANDLORD",
    },
  });

  // An account behaving like an agent: posts under one phone number while
  // claiming a series of different "owners" — this is the pattern the
  // duplicate-phone fraud signal is built to catch.
  const suspiciousAgent = await prisma.user.upsert({
    where: { email: "kunle.suspicious@example.com" },
    update: {},
    create: {
      name: "Kunle Okonji",
      email: "kunle.suspicious@example.com",
      phone: "2348099990001",
      passwordHash,
      role: "LANDLORD",
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
    {
      title: "Room in Family House for Rent, Ogba",
      description:
        "A clean room in a family compound, posted by the owner's son on his behalf — Alhaji Bello is retired and doesn't use a smartphone, but his number below is verified and he's aware of every inquiry.",
      propertyType: "SHARED_ROOM" as const,
      purpose: "RENT" as const,
      price: 350_000,
      priceFrequency: "YEARLY",
      address: "9 Ogunlana Street, Ogba",
      area: "Ogba",
      bedrooms: 1,
      bathrooms: 1,
      amenities: "Water Borehole,Shared Kitchen",
      landlordId: caretaker.id,
      postedOnBehalf: true,
      ownerName: "Alhaji Musa Bello",
      ownerPhone: "2348099990001",
      posterRelationship: "CHILD",
      ownerPhoneVerifiedAt: new Date(),
    },
    {
      title: "Spacious 4 Bedroom Duplex, Ajah — Owner Relocating",
      description: "Well-maintained duplex, owner traveling and open to serious tenants only.",
      propertyType: "DUPLEX" as const,
      purpose: "RENT" as const,
      price: 4_200_000,
      priceFrequency: "YEARLY",
      address: "14 Addo Road, Ajah",
      area: "Ajah",
      bedrooms: 4,
      bathrooms: 4,
      amenities: "Gated Estate,Parking Space",
      landlordId: suspiciousAgent.id,
    },
    {
      title: "3 Bedroom Flat, Gbagada — Quiet Family Compound",
      description: "Posted on behalf of the property manager's client; serious inquiries only.",
      propertyType: "APARTMENT" as const,
      purpose: "RENT" as const,
      price: 2_100_000,
      priceFrequency: "YEARLY",
      address: "31 Diya Street, Gbagada",
      area: "Gbagada",
      bedrooms: 3,
      bathrooms: 3,
      amenities: "Parking Space",
      landlordId: suspiciousAgent.id,
      postedOnBehalf: true,
      ownerName: "Grace Adigun",
      ownerPhone: "2348099990001",
      posterRelationship: "PROPERTY_MANAGER",
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

  // Verification-tier demo data: a pending doc, an approved (highest-trust)
  // doc, and a call-verified listing, so all three trust badges show up.
  const [lekkiFlat, yabaStudio, magoduDuplex, , , , ajahDuplexAgent] = properties;

  const pendingDocExists = await prisma.propertyVerificationDocument.findFirst({
    where: { propertyId: lekkiFlat.id, docType: "C_OF_O" },
  });
  if (!pendingDocExists) {
    await prisma.propertyVerificationDocument.create({
      data: {
        propertyId: lekkiFlat.id,
        docType: "C_OF_O",
        fileUrl: "https://example.com/docs/lekki-c-of-o.jpg",
        status: "PENDING",
        submittedById: landlord1.id,
      },
    });
  }

  const approvedDocExists = await prisma.propertyVerificationDocument.findFirst({
    where: { propertyId: magoduDuplex.id, docType: "C_OF_O" },
  });
  if (!approvedDocExists) {
    await prisma.propertyVerificationDocument.create({
      data: {
        propertyId: magoduDuplex.id,
        docType: "C_OF_O",
        fileUrl: "https://example.com/docs/magodo-c-of-o.jpg",
        status: "APPROVED",
        reviewerNote: "Certificate of Occupancy matches the property address and the owner's name.",
        submittedById: landlord1.id,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
  }

  if (!yabaStudio.ownerCallVerifiedAt) {
    await prisma.property.update({
      where: { id: yabaStudio.id },
      data: {
        ownerCallVerifiedAt: new Date(),
        ownerCallVerifiedById: admin.id,
        ownerCallNote: "Called the owner directly on the number listed on her account, confirmed ownership and authorization.",
      },
    });
  }

  const agentReportExists = await prisma.review.findFirst({
    where: { propertyId: ajahDuplexAgent.id, type: "AGENT_REPORT", authorId: tenant2.id },
  });
  if (!agentReportExists) {
    await prisma.review.create({
      data: {
        propertyId: ajahDuplexAgent.id,
        authorId: tenant2.id,
        type: "AGENT_REPORT",
        title: "This looks like an agent, not an owner",
        body: "I called this number about a different 'Ajah' listing last month too, but the person gave a different owner's name that time. Feels like an agent posing as several different landlords.",
        livedThere: false,
      },
    });
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

  // --- Property management automation demo data --------------------------

  const lekkiFlatForLease = properties[0];
  let lease = await prisma.lease.findFirst({ where: { propertyId: lekkiFlatForLease.id, tenantId: tenant1.id } });
  if (!lease) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    lease = await prisma.lease.create({
      data: {
        propertyId: lekkiFlatForLease.id,
        tenantId: tenant1.id,
        landlordId: landlord1.id,
        startDate,
        endDate,
        rentAmount: lekkiFlatForLease.price,
        rentFrequency: "YEARLY",
        depositAmount: 200_000,
        notes: "Agreed directly via WhatsApp after the listing — no agency fee paid.",
        status: "ACTIVE",
      },
    });
    await prisma.property.update({ where: { id: lekkiFlatForLease.id }, data: { status: "RENTED" } });

    // One payment already settled at move-in, and one now overdue — shows
    // both the PAID history and the overdue automation flag on day one.
    await prisma.rentPayment.create({
      data: {
        leaseId: lease.id,
        amount: lease.rentAmount,
        dueDate: startDate,
        paidAt: startDate,
        method: "BANK_TRANSFER",
        status: "PAID",
        recordedById: landlord1.id,
      },
    });
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 10);
    await prisma.rentPayment.create({
      data: { leaseId: lease.id, amount: lease.rentAmount, dueDate: overdueDate, status: "OVERDUE" },
    });
  }

  const maintenanceExists = await prisma.maintenanceRequest.findFirst({
    where: { propertyId: lekkiFlatForLease.id, tenantId: tenant1.id },
  });
  if (!maintenanceExists) {
    await prisma.maintenanceRequest.create({
      data: {
        propertyId: lekkiFlatForLease.id,
        tenantId: tenant1.id,
        category: "PLUMBING",
        priority: "HIGH",
        title: "Kitchen sink leaking",
        description: "Water pooling under the kitchen sink every time it's used — looks like a loose pipe joint.",
        status: "OPEN",
      },
    });
  }

  const magoduDuplexForOffer = magoduDuplex;
  const offerExists = await prisma.purchaseOffer.findFirst({
    where: { propertyId: magoduDuplexForOffer.id, buyerId: tenant2.id },
  });
  if (!offerExists) {
    await prisma.purchaseOffer.create({
      data: {
        propertyId: magoduDuplexForOffer.id,
        buyerId: tenant2.id,
        amount: Math.round(magoduDuplexForOffer.price * 0.9),
        message: "Cash buyer, can close within 30 days.",
        status: "PENDING",
      },
    });
  }

  console.log("Seed complete.");
  console.log("Demo accounts (password: password123):");
  console.log("  Landlord:  tunde.owner@example.com");
  console.log("  Landlord:  chioma.owner@example.com");
  console.log("  Caretaker: yusuf.caretaker@example.com (posts on behalf of an elderly relative)");
  console.log("  Suspicious agent: kunle.suspicious@example.com (triggers duplicate-phone fraud signal)");
  console.log("  Tenant:    bisi.tenant@example.com");
  console.log("  Tenant:    femi.tenant@example.com");
  console.log("  Admin:     admin@onile.app (Trust & Safety dashboard at /admin)");
  console.log("");
  console.log("Property management automation demo:");
  console.log("  tunde.owner@example.com has an active lease with bisi.tenant@example.com,");
  console.log("  one paid + one overdue rent payment, and an open maintenance request.");
  console.log("  tunde.owner@example.com also has a pending purchase offer from femi.tenant@example.com.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
