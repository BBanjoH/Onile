# Onile — Web App

Next.js 16 (App Router) + Prisma + Tailwind CSS. This is the web app and the
JSON API that both the website and the mobile app run on.

> **Going live?** Follow [`../LAUNCH.md`](../LAUNCH.md) — a step-by-step,
> non-technical guide to deploying Onile with a real domain and database.

## Built for older, non-technical landlords

Onile's core customer is frequently 55+, on a mid-range Android phone, and
not confident with apps. That is a design constraint, not an afterthought,
and it drives a set of decisions worth knowing about before you change
anything:

- **Everything is bigger.** The Tailwind type scale is shifted up a step in
  `tailwind.config.ts` (so `text-sm` renders at 18px, not 14px), the root
  font size is 18px, and every control is held at ~48px minimum in
  `globals.css`. Changing those two files changes readability everywhere at
  once.
- **The user can enlarge it further.** The **A / A+ / A++** control in the
  header (`TextSizeControl.tsx`) scales the root rem size up to ~28% and
  remembers the choice per device. A small inline script in `layout.tsx`
  applies it before first paint so there's no flash of small text.
- **No jargon reaches the screen.** The database stores `OVERDUE`,
  `IN_PROGRESS`, `TAKEN_DOWN`; `src/lib/labels.ts` turns those into "Late —
  not paid", "Being fixed now", "Hidden — nobody can see it". Add to that
  file rather than rendering a raw status anywhere.
- **The home screen tells you what to do.** `/dashboard` is a greeting, a
  short list of full-sentence things needing attention ("Bisi has not paid
  ₦450,000 rent. It was due 6 days ago."), and six large buttons. It is
  deliberately not a dashboard of numbers.
- **Phone number is a login identity.** Many landlords have no email they
  can recall. One box on the login page accepts either, in any format —
  see `src/lib/phone.ts`.
- **Contrast is raised.** `gray-400`/`gray-500` are overridden a step
  darker in the Tailwind config, because ageing eyes lose contrast
  sensitivity well before acuity.
- **Help is always one tap away**, with a real WhatsApp number and phone
  number on it (`/help`).
- **Photos are taken, not linked.** `PhotoUpload.tsx` opens the phone
  camera or gallery and shrinks the picture on the device before sending
  (1280px, JPEG q0.72 — a 5MB phone photo becomes ~200KB), because mobile
  data is a real cost for this audience. Used for both property photos and
  ownership documents.
- **Reminders go out by text**, not just as something to notice in-app —
  see `src/lib/reminders.ts`. A landlord who never opens Onile still hears
  that their tenant hasn't paid.

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
- **Property management automation** — once a landlord and tenant/buyer
  have connected directly (no agent), Onile takes over the admin an agent
  or a spreadsheet would otherwise handle. See the section below.

## Property management automation

This is the part of the app that runs *after* the direct introduction —
the tasks/services an agent would otherwise insert themselves into (and
charge for). All of it lives under `/dashboard` (landlord) and
`/my-rentals` (tenant/buyer).

- **Leases** (`Lease` model) — a landlord formalizes a tenancy once terms
  are agreed (property, tenant by email, dates, rent, deposit). Ending a
  lease automatically frees the property back to `AVAILABLE` if no other
  active lease references it.
- **Automated rent collection** (`src/lib/rentAutomation.ts`) — the next
  rent installment (`RentPayment`) is generated automatically ahead of its
  due date for every active lease, and anything unpaid past a grace period
  flips to `OVERDUE` automatically. This runs opportunistically on every
  dashboard/lease page load, and is also exposed as
  `GET /api/cron/rent-automation` (optionally protected by `CRON_SECRET`)
  for wiring to a real scheduler (Vercel Cron, a GitHub Actions cron job,
  etc.) so it keeps running even if nobody opens the app that day.
- **Online rent payment via Flutterwave** — a tenant can pay a due
  installment with one "Pay Now" click (card, bank transfer, or USSD,
  through Flutterwave's hosted checkout) straight to the landlord; no agent
  handling cash or "collecting" on the owner's behalf. If Flutterwave isn't
  configured, "Pay Now" is simply hidden and the landlord's manual "Mark
  Paid" (cash/bank transfer reconciliation) keeps working exactly as
  before — online payment is additive, never required. See **Online rent
  payment** below for setup and how it's verified.
- **Automation Center** (`src/components/AutomationSummary.tsx`, shown at
  the top of `/dashboard`) — overdue rent, rent due soon, leases expiring
  within 60 days, open maintenance requests, and pending purchase offers,
  all in one glance instead of a landlord having to check each property.
- **Maintenance requests** (`MaintenanceRequest` model) — a tenant with an
  active lease reports an issue (category, priority, description); the
  landlord tracks and updates its status across their whole portfolio at
  `/dashboard/maintenance` instead of a scattered thread of phone calls.
- **Purchase offers** (`PurchaseOffer` model) — on any `SALE` listing, a
  logged-in buyer submits an offer directly from the property page; the
  seller accepts, rejects, or counters it from `/dashboard/offers`, and the
  buyer can accept/decline a counter or withdraw a pending offer from
  `/my-rentals` — the negotiation an agent would normally broker (and take
  a cut of), done directly instead.

### Online rent payment

`src/lib/flutterwave.ts` wraps Flutterwave's **hosted Standard checkout**
(`POST /v3/payments` → a link the tenant is redirected to). That's a
deliberate choice over driving raw card/bank-transfer charges ourselves: it
keeps card data off our servers entirely, and gives the tenant card, bank
transfer, and USSD in one flow without us building custom OTP/PIN UI for
each rail.

**Setup**: get API keys from the Flutterwave dashboard (Settings > API —
use the Test keys while developing) and set `FLW_PUBLIC_KEY`/`FLW_SECRET_KEY`
in `.env`. For the webhook, set `FLW_SECRET_HASH` to the same value as your
dashboard's Settings > Webhooks > "Secret Hash", and point that webhook at
`POST https://<your-domain>/api/webhooks/flutterwave`. Leave all three
unset in dev/CI and everything else keeps working — "Pay Now" just doesn't
render (`isFlutterwaveConfigured()`), so this is entirely opt-in.

**How a payment is confirmed** — this is the part worth being precise
about, since it's real money:

1. `POST /api/payments/:id/checkout` checks the caller is that lease's
   tenant, generates a fresh reference (`flwTxRef`) server-side, and asks
   Flutterwave for a hosted checkout link scoped to the payment's exact
   amount.
2. After paying, Flutterwave redirects the tenant's browser to
   `GET /api/payments/callback` with `tx_ref`/`transaction_id`/`status`
   query params. **These are treated as untrusted** (a tenant could hand-
   craft that URL) — they're only used to look up which payment to react
   to.
3. Both that callback and the webhook (`POST /api/webhooks/flutterwave`)
   funnel into `settlePaymentByTxRef()` (`src/lib/rentAutomation.ts`),
   which independently calls `GET /v3/transactions/:id/verify` against
   Flutterwave's API and checks the verified transaction's status,
   currency, `tx_ref`, and amount against what we expect *before* ever
   writing `PAID` to the database. A payment is never marked paid from a
   redirect query string or webhook body alone.
4. The webhook is the durable path (it fires independently of whether the
   tenant's browser ever made it back to step 2) and is authenticated by
   comparing the `verif-hash` header to `FLW_SECRET_HASH` with a
   timing-safe comparison — Flutterwave webhooks work by echoing back a
   shared secret, not an HMAC of the body.
5. Both paths re-check the payment's status immediately before writing, so
   whichever of the callback/webhook arrives second is a no-op rather than
   double-processing.

The landlord's manual "Mark Paid" button (for cash or an off-platform bank
transfer) is untouched by any of this and always available — online
payment is one more way to settle the same `RentPayment` row, not a
replacement for it.

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
field), plus the management-automation entities `Lease`, `RentPayment`,
`MaintenanceRequest`, and `PurchaseOffer`. SQLite is the dev default (zero
setup); the schema is written to be Postgres-compatible too (see the
comment at the top of the schema file for the one-line switch).

## Local setup

Onile runs on Postgres. The quickest way to get one is a free Supabase
project (see `../LAUNCH.md` Step 1) — create a second one if you want a
scratch database separate from production.

```bash
npm install
cp .env.example .env        # then set DATABASE_URL, DIRECT_URL, JWT_SECRET
npx prisma migrate deploy   # create the tables
npm run db:seed             # seed demo landlords, tenants, listings, reviews
npm run dev                 # http://localhost:3000
```

Deploys apply migrations by themselves — `vercel.json` sets the build
command to `prisma generate && prisma migrate deploy && next build`, so
shipping a schema change never needs a database command run by hand. After
editing `schema.prisma`, generate the migration with
`npx prisma migrate dev --name <what-changed>` and commit it.

Other scripts:

| Command | What it does |
| ------- | ------------ |
| `npm run create-admin` | Creates (or promotes) an admin account. There's no admin signup on the site by design; the other route is `BOOTSTRAP_ADMIN_EMAIL`, which promotes that one address on signup or next login so a non-technical owner never needs a terminal |
| `npm run reset-password` | Sets a new password for any account, for support calls. Never changes what the account can do |
| `npm run db:migrate` | `prisma migrate deploy`, for applying migrations in production |
| `npm run db:seed` | Demo data. **Refuses to run in production** — it creates accounts with a publicly-known password |

Demo accounts seeded by `db:seed` (password for all: `password123`):

| Role                | Email                          | Notes                                                    |
| ------------------- | ------------------------------ | --------------------------------------------------------- |
| Landlord            | tunde.owner@example.com        | Has a pending doc + an approved (document-verified) listing; also the seeded lease/maintenance/offer demo below |
| Landlord            | chioma.owner@example.com       | Has a call-verified listing                               |
| Landlord (caretaker) | yusuf.caretaker@example.com   | Posts on behalf of an elderly relative, phone-verified    |
| Landlord (agent-like) | kunle.suspicious@example.com | Reuses one phone across different "owners" — trips the fraud-signal detector |
| Tenant              | bisi.tenant@example.com        |                                                             |
| Tenant              | femi.tenant@example.com        | Filed the seeded agent report                              |
| Admin               | admin@onile.app                | Trust & Safety dashboard at `/admin`                       |

`tunde.owner@example.com` also has a seeded active lease with
`bisi.tenant@example.com` (one paid + one overdue rent payment, plus an
open maintenance request) and a pending purchase offer from
`femi.tenant@example.com` — log in as either side to see `/dashboard/leases`,
`/dashboard/maintenance`, `/dashboard/offers`, or `/my-rentals` populated.

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
- `GET|POST /api/leases`, `GET|PATCH /api/leases/:id` — create/list/update leases (landlord); tenants can read their own
- `POST /api/leases/:id/payments` — log an ad-hoc rent payment on a lease
- `PATCH /api/payments/:id` — mark a scheduled rent installment paid (or edit method/note)
- `GET|POST /api/maintenance`, `PATCH /api/maintenance/:id` — raise (tenant) / list & update (landlord) maintenance requests
- `GET|POST /api/offers`, `PATCH /api/offers/:id` — make an offer on a `SALE` listing (buyer); accept/reject/counter (seller) or accept/decline/withdraw (buyer)
- `GET /api/cron/rent-automation` — generates upcoming rent installments and flags overdue ones; optionally protected by `CRON_SECRET` (accepts a bearer token, an `x-cron-secret` header, or `?secret=`, so it works with Vercel Cron out of the box — see `vercel.json`)
- `GET /api/health` — for uptime monitors; checks the database really answers, and returns 503 if not
- `POST /api/auth/forgot-password` — sends a reset code by text; answers identically whether or not the account exists
- `POST /api/auth/reset-password` — consumes the code (single-use, 5 guesses, 15-minute expiry) and signs the user in
- `POST /api/uploads` — one photo or document from a phone; see `src/lib/storage.ts` for where it lands
- `GET /api/files/:id` — serves database-stored uploads; ownership documents only to their uploader or an admin
- `POST /api/payments/:id/checkout` — tenant starts an online payment; returns a Flutterwave hosted checkout `link`
- `GET /api/payments/callback` — Flutterwave redirect target after checkout; re-verifies server-side before marking paid
- `POST /api/webhooks/flutterwave` — durable payment confirmation, authenticated via the `verif-hash` header
