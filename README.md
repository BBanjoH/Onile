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

- Landlords/owners post listings directly (self-attested "I am the owner,
  not an agent" at posting time).
- Tenants/buyers search by area, price, type, bedrooms, rent vs. sale vs.
  shortlet.
- Anyone logged in can leave a star-rated **review** or a **complaint** on
  a property page — visible to future prospective tenants before they pay
  anyone a fee to view or move in.
- Contacting the landlord (phone number + a one-tap WhatsApp link) is gated
  behind a free login, which cuts spam/scraping while keeping contact
  itself free and direct — no agent in the middle.
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
`bisi.tenant@example.com` (tenant). Full details, including moving to a
production Postgres database and deploying, are in `web/README.md`.

To get the mobile app running, see `mobile/README.md` — it needs the web
app deployed somewhere reachable over HTTPS first.

## Roadmap beyond MVP

- Real owner verification (phone OTP / ID upload) instead of a
  self-declared checkbox, to make the "direct from owner" badge trustworthy.
- Photo uploads instead of pasted image URLs.
- In-app messaging as an alternative to WhatsApp for tenants without it.
- Moderation tooling for reviews/complaints (flagging, admin review) to
  deter fake or retaliatory posts.
- Map view and saved searches/alerts.
