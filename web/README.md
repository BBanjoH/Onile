# Onile — Web App

Next.js 16 (App Router) + Prisma + Tailwind CSS. This is the web app and the
JSON API that both the website and the mobile app run on.

## Features

- **Direct listings** — only landlord accounts can post properties, and
  posting requires confirming the listing is owner-authorized and
  commission-free.
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
- **Landlord ≠ agent verification, in five layers** — see below.
- **Landlord dashboard** — manage your own listings' status (available /
  rented / sold / taken down), see complaint counts at a glance, and run
  each listing's verification from the same page.
- **Installable as a mobile app (PWA)** — a web manifest, icons, and a
  service worker mean a phone browser can "Add to Home Screen" and get an
  app-like, standalone experience without visiting an app store. See
  `/mobile` for a proper native wrapper you can build into a real APK.

## Telling a landlord from an agent

Agents commonly post as if they were the owner, and many real landlords
(especially older ones) don't operate the account themselves — so a simple
"I am the owner" checkbox proves nothing. Instead:

1. **Honest proxy posting.** Posting a property lets you say "I'm posting
   for the owner" and give their name, phone number, and your relationship
   to them (child, caretaker, property manager, etc.) instead of quietly
   pretending to be them. Every downstream verification step targets that
   *owner's* phone, not the poster's account.
2. **Owner phone verification (OTP).** A one-time code is sent by SMS to
   the effective owner's number (`src/lib/sms.ts`, currently a dev-mode
   stub that logs/echoes the code — swap in Termii or Africa's Talking for
   production). This works on a basic feature phone: the owner just needs
   to read the code aloud over a call, no app or data connection required.
3. **Confirmed by a phone call.** Staff can call the owner directly and log
   the confirmation (`ownerCallVerifiedAt`/`ownerCallNote` on `Property`,
   done from `/admin/verifications`) — the option for owners who can't
   manage even the OTP step themselves.
4. **Ownership document review.** Landlords can submit a C of O, Deed of
   Assignment, Land Use Charge/utility bill, etc. for a specific listing
   (`PropertyVerificationDocument`); an admin approves or rejects it from
   the same admin queue. This is the highest trust badge, and it's tied to
   the property, not just an account.
5. **Fraud signals + reporting.** `findDuplicatePhoneSignals()`
   (`src/lib/verification.ts`) flags any phone number claimed as the
   "owner" across more than one account or owner name — the classic
   fingerprint of an agent posing as several different landlords — visible
   at `/admin/fraud-signals`. Tenants can also flag a listing directly with
   a dedicated "Report as Agent" option (distinct from a normal review/
   complaint), which lands in `/admin/agent-reports` for follow-up.

None of this makes verification instant or free — it's staff-review work by
design, the same way early Airbnb/marketplace trust was bootstrapped. The
trust badge shown on every listing (`src/components/TrustBadge.tsx`) always
reflects the *strongest* tier actually reached, so tenants can weigh it for
themselves rather than trusting an unqualified "Verified" label.

## Data model

See `prisma/schema.prisma`. Core entities: `User` (tenant/landlord/admin),
`Property` (+ `PropertyImage`, plus the proxy-posting and verification
fields described above), `PropertyVerificationDocument`, `OtpCode`, and
`Review` (doubles as review, complaint, or agent report via a `type`
field). SQLite is the dev default (zero setup); the schema is written to be
Postgres-compatible too (see the comment at the top of the schema file for
the one-line switch).

## Local setup

```bash
npm install
cp .env.example .env        # then edit JWT_SECRET
npx prisma db push          # create the SQLite database from the schema
npm run db:seed             # seed demo landlords, tenants, listings, reviews
npm run dev                 # http://localhost:3000
```

Demo accounts seeded by `db:seed` (password for all: `password123`):

| Role                | Email                          | Notes                                                    |
| ------------------- | ------------------------------ | --------------------------------------------------------- |
| Landlord            | tunde.owner@example.com        | Has a pending doc + an approved (document-verified) listing |
| Landlord            | chioma.owner@example.com       | Has a call-verified listing                               |
| Landlord (caretaker) | yusuf.caretaker@example.com   | Posts on behalf of an elderly relative, phone-verified    |
| Landlord (agent-like) | kunle.suspicious@example.com | Reuses one phone across different "owners" — trips the fraud-signal detector |
| Tenant              | bisi.tenant@example.com        |                                                             |
| Tenant              | femi.tenant@example.com        | Filed the seeded agent report                              |
| Admin               | admin@onile.app                | Trust & Safety dashboard at `/admin`                       |

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
5. **SMS delivery**: `src/lib/sms.ts` is a dev-mode stub — it logs the OTP
   and returns it in the API response (only outside `NODE_ENV=production`)
   instead of sending a real text. Replace its body with a real provider
   call before launch; Termii and Africa's Talking both have solid coverage
   for Nigerian numbers. Also remove the `devCode` passthrough in
   `src/app/api/properties/[id]/verify-owner-phone/send/route.ts` once a
   real provider is wired up.
6. **Admin accounts**: there's no signup path for `ADMIN` — the seed script
   creates one demo account. Promote/create admins directly in the
   database (or build an internal tool) before relying on the `/admin`
   Trust & Safety dashboard in production.

## API

All routes are under `/api` and return JSON:

- `POST /api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `GET /api/auth/me`
- `GET /api/properties` (search/filter), `POST /api/properties` (landlord only)
- `GET|PATCH|DELETE /api/properties/:id`
- `POST /api/properties/:id/verify-owner-phone/send` — send an OTP to the effective owner's phone
- `POST /api/properties/:id/verify-owner-phone/verify` — consume the OTP, mark `ownerPhoneVerifiedAt`
- `POST /api/properties/:id/documents` — submit an ownership document for review
- `POST /api/reviews` — review, complaint, or agent report (`type` field)
- `PATCH /api/admin/documents/:id` — approve/reject a document (admin only)
- `PATCH /api/admin/properties/:id/call-verify` — log a phone-call confirmation (admin only)
- `PATCH /api/admin/reviews/:id/resolve` — resolve an agent report (admin only)
