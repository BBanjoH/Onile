# Onile

*"Onile"* is Yoruba for "landlord" / "owner of the house" — fitting, since
that's exactly who this app connects you with.

Lagos's rental and property market is heavily distorted by agents/middlemen
whose commissions (commonly 10%+ of a year's rent, on top of "agreement" and
"caution" fees) inflate the real cost of housing. Onile lets tenants and
buyers find and contact landlords **directly**, and lets past tenants leave
**honest reviews and complaints** about a property so the next person isn't
walking in blind.

## What's in this repo

```
web/      Next.js web app + JSON API + database (the core product)
mobile/   Expo React Native app — a wrapper that builds into a real,
          downloadable, installable Android/iOS app
```

### `web/` — the core app

- Landlords/owners post listings directly. Posting can be done honestly
  "on behalf of" the actual owner (by a child, caretaker, or property
  manager) instead of forcing a lie about who's typing.
- Tenants/buyers search by area, price, type, bedrooms, rent vs. sale vs.
  shortlet.
- Anyone logged in can leave a star-rated **review**, a **complaint**, or
  a dedicated **"report as agent"** flag on a property page — visible to
  future prospective tenants before they pay anyone a fee to view or move
  in.
- Contacting the landlord (phone number + a one-tap WhatsApp link) is gated
  behind a free login, which cuts spam/scraping while keeping contact
  itself free and direct — no agent in the middle.
- **Property management automation** for once you've connected directly:
  leases, an automated rent-collection schedule with overdue reminders and
  real online rent payment (Flutterwave), a landlord "Automation Center"
  dashboard, tenant-raised maintenance requests, and direct purchase-offer
  negotiation on sale listings — all the admin an agent would otherwise
  insert themselves into (and charge for). Full write-up in `web/README.md`.
- **Five-layer landlord verification** to tell a real owner from an agent
  pretending to be one: honest proxy posting, owner phone OTP (works on a
  basic feature phone), a staff phone-call confirmation, ownership
  document review, and a duplicate-phone fraud detector plus an agent-report
  moderation queue at `/admin`. Full write-up in `web/README.md`.
- Ships as an installable PWA (add-to-home-screen on any phone) in addition
  to being a normal website.

**Database**: Prisma ORM, SQLite by default for zero-setup local dev, with
the schema written to switch to Postgres (Supabase/Railway/Neon/RDS) with a
one-line change — see `web/README.md`.

### `mobile/` — downloadable MVP mobile app

An Expo app that wraps the deployed web app in a native WebView shell
(hardware back button, pull-to-refresh, offline screen, branded icon and
splash screen). It builds into a real installable `.apk` via a single
command against Expo's free cloud build service (`eas build`) — no
Android Studio/Xcode needed. See `mobile/README.md` for exact steps and why
a WebView wrapper is the right call for an MVP versus a full native
rebuild.

## Quick start

```bash
cd web
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

Then open http://localhost:3000. Seeded demo accounts (password
`password123` for all): `tunde.owner@example.com` (landlord),
`bisi.tenant@example.com` (tenant), `admin@onile.app` (Trust & Safety
dashboard at `/admin`) — the full table of demo accounts, including ones
that demonstrate each verification tier and the fraud detector, is in
`web/README.md`. Full details on moving to a production Postgres database
and deploying are there too.

To get the mobile app running, see `mobile/README.md` — it needs the web
app deployed somewhere reachable over HTTPS first.

## Roadmap beyond MVP

- Wire up a real SMS provider (Termii/Africa's Talking) for OTP delivery —
  currently a dev-mode stub, see `web/README.md`.
- Photo uploads instead of pasted image URLs.
- In-app messaging as an alternative to WhatsApp for tenants without it.
- Map view and saved searches/alerts.
- Push/SMS/email delivery for the automation reminders (overdue rent,
  lease expiry, new maintenance/offer activity) — today they're surfaced
  in-app via the Automation Center, not pushed out.
- Downloadable/e-signable tenancy agreement documents generated from a
  `Lease` record.
- An admin signup/promotion flow — the only way to create an `ADMIN`
  account today is directly in the database (or via the seed script).
