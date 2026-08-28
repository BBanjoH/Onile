# Onile — Web App

Next.js 16 (App Router) + Prisma + Tailwind CSS. This is the web app and the
JSON API that both the website and the mobile app run on.

## Features

- **Direct listings** — only landlord/owner accounts can post properties;
  posting requires checking a box confirming they're the owner and not an
  agent charging a middleman fee.
- **Search & filters** — by area, property type, rent/sale/shortlet, price
  range, and bedroom count.
- **Tenant reviews & complaints** — anyone logged in can leave a star-rated
  review or a complaint on a property's page, visible to everyone browsing
  that listing, so prospective tenants know what they're getting into before
  they pay any fees.
- **Direct contact, gated by login** — a property's owner name and phone
  number (and a one-tap WhatsApp deep link) are only shown to logged-in
  users, which cuts down on scraping/spam while keeping contact free and
  direct.
- **Landlord dashboard** — manage your own listings' status (available /
  rented / sold / taken down) and see complaint counts at a glance.
- **Installable as a mobile app (PWA)** — a web manifest, icons, and a
  service worker mean a phone browser can "Add to Home Screen" and get an
  app-like, standalone experience without visiting an app store. See
  `/mobile` for a proper native wrapper you can build into a real APK.

## Data model

See `prisma/schema.prisma`. Core entities: `User` (tenant/landlord/admin),
`Property` (+ `PropertyImage`), and `Review` (doubles as review or
complaint via a `type` field). SQLite is the dev default (zero setup); the
schema is written to be Postgres-compatible too (see the comment at the top
of the schema file for the one-line switch).

## Local setup

```bash
npm install
cp .env.example .env        # then edit JWT_SECRET
npx prisma db push          # create the SQLite database from the schema
npm run db:seed             # seed demo landlords, tenants, listings, reviews
npm run dev                 # http://localhost:3000
```

Demo accounts seeded by `db:seed` (password for all: `password123`):

| Role     | Email                       |
| -------- | ---------------------------- |
| Landlord | tunde.owner@example.com      |
| Landlord | chioma.owner@example.com     |
| Tenant   | bisi.tenant@example.com      |
| Tenant   | femi.tenant@example.com      |

## Moving to production

1. **Database**: provision a managed Postgres instance (Supabase, Railway,
   Neon, RDS...). In `prisma/schema.prisma`, change the datasource
   `provider` from `"sqlite"` to `"postgresql"`, point `DATABASE_URL` at it,
   then run `npx prisma migrate dev` once to create the migration and apply
   it (subsequent deploys use `npx prisma migrate deploy`).
2. **Secrets**: generate a real `JWT_SECRET` (`openssl rand -base64 48`) and
   set it in your hosting provider's environment variables — never commit
   `.env`.
3. **Deploy**: this is a stock Next.js app, so it deploys as-is to Vercel,
   or any Node host that can run `next build && next start`.
4. **Images**: the MVP takes image URLs directly (paste a link, e.g. from
   any image host) rather than handling file uploads, to keep the MVP
   scope small. A real launch should add uploads to S3/Cloudflare
   R2/Supabase Storage.
5. **Owner verification**: `User.isVerifiedOwner` is currently
   self-declared at signup/listing time. Before relying on it to fight
   fake "owner" listings, add real verification — phone OTP, ID upload
   reviewed by an admin, or matching the phone number to a Nigerian
   property registry where available.

## API

All routes are under `/api` and return JSON:

- `POST /api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `GET /api/auth/me`
- `GET /api/properties` (search/filter), `POST /api/properties` (landlord only)
- `GET|PATCH|DELETE /api/properties/:id`
- `POST /api/reviews`
