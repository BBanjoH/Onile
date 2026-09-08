# Taking Onile live — a plain-English guide

This guide is written for someone who is **not** a programmer. It assumes
no technical knowledge. Follow it top to bottom and Onile will be live on
the internet with a real web address.

Set aside about **two hours** for your first time through. Most of it is
filling in forms on websites, not writing anything.

There is a checklist at the very bottom. Tick things off as you go.

---

## What you are actually doing

Onile is finished software sitting in a folder. To put it on the internet
you need four things, in this order:

| # | Thing | What it is, in plain terms | Cost |
|---|-------|---------------------------|------|
| 1 | A **database** | The filing cabinet that remembers your landlords, tenants and rent records | Free to start |
| 2 | A **host** | The computer that runs the website day and night | Free to start |
| 3 | A **web address** | e.g. `onile.ng` — what people type to reach you | ~₦15,000–₦40,000/year |
| 4 | A **Flutterwave account** | So tenants can pay rent online (optional, add later) | Free; they take a fee per payment |

You do **not** need to buy a computer, install anything complicated, or
hire anyone to get started.

---

## Step 1 — Create the database (about 15 minutes)

We will use **Supabase**, because it is free to start and reliable.

1. Go to **supabase.com** and click **Start your project**. Sign up (you
   can use a Google account).
2. Click **New project**.
   - **Name:** `onile`
   - **Database Password:** click *Generate a password* and then
     **copy it somewhere safe immediately** — you cannot see it again.
   - **Region:** choose the one closest to Nigeria (usually
     *West EU (London)* or *EU (Frankfurt)*). This makes the site faster
     for Nigerian users.
3. Wait about 2 minutes for it to finish setting up.
4. Click **Connect** at the top of the page, choose the **ORMs** tab, and
   copy the long line that starts with `postgresql://`. That whole line is
   your **DATABASE_URL**. Paste it somewhere safe.
   - If it contains `[YOUR-PASSWORD]`, replace that part with the password
     you saved in step 2.

> **Keep this line secret.** Anyone who has it can read all your data.

---

## Step 2 — Make your secret key (2 minutes)

Onile needs one long random password of its own, to keep people logged in
safely. It is called `JWT_SECRET`.

Go to **generate-secret.vercel.app/48** in your browser. It shows a long
jumble of letters and numbers. Copy it and save it with your other notes.

That's it — that jumble is your `JWT_SECRET`.

---

## Step 3 — Put the site on the internet (about 30 minutes)

We will use **Vercel**, which is free for a project this size and made by
the same people as the technology Onile is built with.

1. Make sure this project is on **GitHub** (if you are reading this file
   inside a GitHub repository, it already is).
2. Go to **vercel.com** and sign up **using your GitHub account**.
3. Click **Add New… → Project**, find your `Onile` repository, click
   **Import**.
4. **Important:** under *Root Directory*, click **Edit** and choose the
   **`web`** folder. Onile's website lives in there. If you skip this the
   build will fail.
5. Open the **Environment Variables** section and add each of these. Click
   *Add* after each one.

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | the `postgresql://…` line from Step 1 |
   | `JWT_SECRET` | the jumble from Step 2 |
   | `NEXT_PUBLIC_APP_URL` | leave for now — you'll set it in Step 4 |
   | `NEXT_PUBLIC_SUPPORT_PHONE` | your WhatsApp number, e.g. `2348012345678` |
   | `NEXT_PUBLIC_SUPPORT_EMAIL` | your support email |
   | `NEXT_PUBLIC_COMPANY_NAME` | your business name, for the legal pages |
   | `CRON_SECRET` | another jumble from generate-secret.vercel.app |

6. Click **Deploy** and wait a few minutes.

**Before it will work, switch the database over to Postgres.** In the file
`web/prisma/schema.prisma`, near the top, change:

```
provider = "sqlite"
```
to
```
provider = "postgresql"
```

Then, on your own computer, in the `web` folder, run these two commands
once to create the tables in your new database:

```bash
npx prisma migrate dev --name init
npx prisma migrate deploy
```

(If you are not comfortable running commands, this is the one place worth
asking a technical friend for 10 minutes of help.)

---

## Step 4 — Your web address (about 20 minutes, plus waiting)

1. Buy a domain. For a `.ng` address use **whogohost.ng** or
   **domainking.ng**; for a `.com` use **namecheap.com**.
2. In Vercel, open your project → **Settings → Domains** → add the domain
   you bought.
3. Vercel shows you two or three settings ("nameservers" or "A record" and
   "CNAME"). Copy those into the control panel of the company you bought
   the domain from. They all have a page called *DNS* or *Manage domain*.
4. Wait. It usually takes 15 minutes but can take up to 24 hours.
5. Once it works, go back to **Settings → Environment Variables** and set
   `NEXT_PUBLIC_APP_URL` to your address, e.g. `https://onile.ng`
   — **no slash at the end**. Then click **Redeploy**.

---

## Step 5 — Make your admin account (5 minutes)

You need one administrator account. This is the account that approves
ownership documents and handles reports of agents pretending to be
landlords. There is no way to sign up as an admin on the website itself,
on purpose.

On your computer, inside the `web` folder, run:

```bash
npm run create-admin
```

It asks for your name, email, phone and a password. Use a **strong**
password — this account can see everything.

Then log in on your live site and go to `yourdomain.com/admin`.

> **Never run `npm run db:seed` against your live site.** That creates
> demo accounts with a publicly-known password. Onile now refuses to do it
> in production, but do not go looking for ways around that.

---

## Step 6 — Online rent payment (optional, 30 minutes)

You can skip this and launch without it. Landlords can still record cash
and bank transfers by hand. Add it when you're ready.

1. Sign up at **flutterwave.com** and complete their business verification
   (they will ask for CAC documents and your bank details — this normally
   takes a few days, so start early).
2. Go to **Settings → API Keys** and copy your **Live** Public Key and
   **Live** Secret Key.
3. Go to **Settings → Webhooks**:
   - **URL:** `https://yourdomain.com/api/webhooks/flutterwave`
   - **Secret hash:** make up a long random word and type it in.
4. Add these three to Vercel's Environment Variables and redeploy:

   | Name | Value |
   |------|-------|
   | `FLW_PUBLIC_KEY` | your Live Public Key |
   | `FLW_SECRET_KEY` | your Live Secret Key |
   | `FLW_SECRET_HASH` | the secret hash you made up in step 3 |

5. **Test with a real ₦100 payment** before telling any landlord about it.
   Money is the one thing you cannot afford to get wrong.

Onile will not show the "Pay Now" button at all until these are set, so a
half-finished setup can't confuse anybody.

---

## Step 7 — Before you tell anybody (30 minutes)

Do these checks yourself on your phone, not on a computer. Your landlords
will be on phones.

- [ ] Open your address. Does the site load?
- [ ] Visit `yourdomain.com/api/health` — it should say `"status":"ok"`.
- [ ] Sign up as a landlord. Add a property. Does it appear on the home page?
- [ ] Sign up as a tenant on a different phone. Can you find that property
      and see the owner's phone number after logging in?
- [ ] Tap the **A++** button at the top. Does all the writing get bigger?
- [ ] Log out and log back in **using your phone number** instead of email.
- [ ] Open the **Help** page. Do the WhatsApp and Call buttons reach you?
- [ ] Ask one person over 60 to sign up while you watch silently. Where
      they hesitate is your real to-do list.

### Two things to sort out that are not code

1. **Get a lawyer to read the Terms and Privacy pages.** They are written
   to be honest and readable, and the Privacy page follows the Nigeria Data
   Protection Act, but they are a starting point — not legal advice, and
   not reviewed by a Nigerian lawyer. Get that done before you take real
   money.
2. **Register with NDPC** if you grow past a small user base — the Nigeria
   Data Protection Commission requires data controllers of a certain size
   to register. Look this up when you pass a few hundred users.

---

## Step 8 — After launch: keep an eye on things

- **Uptime:** sign up free at **uptimerobot.com** and point it at
  `https://yourdomain.com/api/health` every 5 minutes. It texts or emails
  you if the site goes down, so you hear it from a robot and not from an
  angry landlord.
- **Backups:** Supabase backs up daily on paid plans. On the free plan,
  once a week open Supabase → *Database* → *Backups* and download one.
  Do this. Losing rent records would end the business.
- **Rent reminders run by themselves** every morning at 7am Lagos time
  (this is the `vercel.json` file — you don't need to do anything).

---

## If something goes wrong

| What you see | What it usually means |
|---|---|
| Build fails on Vercel | Root Directory isn't set to `web` (Step 3.4) |
| "Onile cannot start — something in the configuration needs fixing" | The message lists exactly which setting to fix. Onile checks itself at startup on purpose. |
| Site loads but nothing saves | `DATABASE_URL` is wrong, or you skipped `prisma migrate deploy` |
| Nobody can log in | `JWT_SECRET` is missing or was changed (changing it logs everybody out) |
| "Pay Now" doesn't appear | The three `FLW_` settings aren't all set — this is deliberate |
| Payment made but not recorded | Webhook URL or `FLW_SECRET_HASH` is wrong in Flutterwave |

---

## The checklist

**Must do before launch**
- [ ] Database created (Step 1)
- [ ] `JWT_SECRET` generated and saved (Step 2)
- [ ] Site deployed, Root Directory set to `web` (Step 3)
- [ ] Database switched to `postgresql` and migrated (Step 3)
- [ ] Domain connected and `NEXT_PUBLIC_APP_URL` set (Step 4)
- [ ] Admin account created (Step 5)
- [ ] Support phone and email set, and tested (Step 3, Step 7)
- [ ] Tested the whole thing on a phone (Step 7)
- [ ] Lawyer has read the Terms and Privacy pages (Step 7)

**Can wait**
- [ ] Flutterwave online payment (Step 6)
- [ ] SMS provider for verification codes — see `web/README.md`. Until this
      is done, the owner phone-verification codes are only written to the
      server log, so that one trust feature is not usable by real users.
- [ ] Uptime monitoring and a backup habit (Step 8)

---

## What Onile does *not* do yet

Being straight with you, so nothing surprises you after launch:

- **Photo uploads.** Landlords paste a link to a photo rather than
  uploading from their phone. For the audience this app is built for, this
  is the single biggest thing to fix next.
- **Text-message alerts.** Reminders about late rent appear inside the app,
  but nothing texts or emails a landlord who hasn't opened it. Wiring up an
  SMS provider (Termii or Africa's Talking) would fix both this and the
  verification codes above.
- **Password reset.** Someone who forgets their password must contact you
  to have it changed. This is why the support number on the Help page
  matters from day one.
- **In-app messaging.** Landlords and tenants talk on WhatsApp, which is
  what they already use — but it does mean conversations happen outside
  Onile.
