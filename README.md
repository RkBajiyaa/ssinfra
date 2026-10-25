# SS Infratech website + Admin SS Infra

A five-page marketing site for SS Infratech (padel court manufacturer, Jaipur) with a quotation form, and an installable admin app ("Admin SS Infra") for leads, package pricing and visitor statistics.

## Stack and why

| Piece | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Cache Components, Turbopack), React 19, strict TypeScript | Static public pages with on-demand revalidation; admin streams behind `<Suspense>` |
| Styling | Tailwind CSS v4, tokens in `src/app/globals.css` | One place to retune palette and type |
| Data | Cloud Firestore via **Firebase Admin SDK on the server only** | Firestore rules deny all client access (`firestore.rules`), so leads are reachable only through server code that checks the admin session |
| Auth | Firebase Auth (email/password) → httpOnly **session cookie** + `admin` custom claim | No tokens in browser storage; admin rights can't be self-granted |
| Validation | Zod (shared client/server schemas) | Same rules give inline errors and server enforcement |
| Push | `web-push` + VAPID, own service worker | Standard Web Push; no Firebase Messaging SDK needed in the browser |
| Analytics | First-party, cookieless (see below) | Real numbers without a consent banner or third-party script |
| Tests | Vitest (unit), Playwright (E2E against Firebase emulators) | |

## Project layout

```
src/
  app/(site)/            public pages: / courts-solutions projects contact about privacy
  app/admin/login        sign-in
  app/admin/(panel)/     dashboard, leads, leads/[id], pricing, pricing/new, pricing/[id]
  app/api/track          page-view beacon endpoint
  app/api/admin/session  creates / clears the admin session cookie
  proxy.ts               optimistic redirect for /admin (real check is in lib/auth/session.ts)
  config/site.ts         business name, phone, address, Instagram, WhatsApp flag  ← edit here
  content/               page copy, specs, FAQs, gallery, image registry       ← edit here
  lib/                   leads, packages, analytics, push, auth, rate limiting
public/images/projects/  site photographs (named by subject)
public/admin-sw.js       admin service worker (push + offline page; caches nothing private)
public/admin.webmanifest PWA manifest (scope /admin)
scripts/                 create-admin.mjs, seed-packages.mjs
```

### Replacing photos and copy
- Photos: put the file in `public/images/projects/`, change the import in `src/content/images.ts`, update its alt text.
- Gallery entries: `src/content/gallery.ts` (title, category, optional `location` once confirmed, `published`). Categories with no published items are hidden automatically.
- Specification values: `src/content/solutions.ts` → `padelSpecs`. Fill `confirmed` for a row and it shows; otherwise it reads "Confirmed in your quotation".
- **Logo**: `src/components/brand/logo.tsx` is a *temporary* mark. Replace the SVG with the official artwork, and regenerate `public/icons/*` and `src/app/icon.png`.

## Data model (Firestore)

| Collection | Purpose | Notes |
|---|---|---|
| `leads/{idempotencyKey}` | Enquiries | `leadNumber` (SSI-00001…), visitor fields, `sourcePage`, `attribution{entryPage,referrer,utm*}`, `status` (new/contacted/quotation_sent/won/lost), `internalNotes`, `createdAt/updatedAt` |
| `counters/leads` | Sequential lead numbers | Incremented in the same transaction as the lead |
| `counters/analytics` | All-time page views / visitor-days | |
| `service_packages` | Public pricing cards | `priceMode` contact/starting_from/fixed/quote; price kept only when the mode shows it |
| `analytics_daily/{YYYY-MM-DD}` | Daily aggregates (IST) | `pageviews`, `visitors`, `leads`, `paths{}`, `sources{}` |
| `analytics_daily/{day}/visitors/{hash}` | Same-day visitor dedupe | TTL `expireAt` (2 days) |
| `admin_profiles/{uid}` | Who is an admin | Written by `scripts/create-admin.mjs` |
| `push_subscriptions/{hash(endpoint)}` | Admin devices for push | Removed automatically when the push service reports 404/410 |
| `rate_limits` | Fixed-window counters | TTL `expireAt` |

Schema "migrations" for Firestore are the version-controlled `firestore.rules` and `firestore.indexes.json` (composite indexes for lead filters + TTL policies). Deploy them with the CLI (below).

## Analytics: what the numbers mean
- **Page view**: one public page load or in-app navigation by a non-bot browser.
- **Visitor**: one browser on one network on one IST calendar day, identified by `sha256(secret salt, date, IP, user agent)`. No cookies, nothing stored on the device, no raw IPs stored. Multi-day totals are **summed daily visitors** ("visitor-days"), so one person visiting on 3 days counts 3 times.
- **Enquiry rate** = enquiries ÷ visitors for the period.
- Not counted: bots/crawlers/headless browsers, admin pages, unknown URLs, browsers sending Global Privacy Control. Each visitor is capped at 100 views/day.
- Aggregates use atomic increments; only the per-visitor dedupe is transactional, so concurrent visits don't contend for locks.

## Security summary
- Firestore rules: deny all. Every read/write is server-side via the Admin SDK after `requireAdmin()` (session cookie verified with revocation check + `admin` claim).
- Every Server Action re-checks admin status itself; the `/admin` proxy redirect is only a convenience.
- No public sign-up. Admins are created only with `scripts/create-admin.mjs`.
- Enquiry form: Zod validation server-side, honeypot field, minimum fill time, idempotency key (double submits create one lead), rate limit 5 per 10 min and 20 per day per connection.
- Login: same-origin check, recent-sign-in requirement, 20 attempts per 10 min per connection (on top of Firebase Auth's own protection).
- Headers: HSTS, nosniff, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy; admin pages `Cache-Control: private, no-store` and `noindex`.
- Lock-screen notifications contain no customer data. The service worker caches only a static offline page.

## Environment variables
`.env.example` documents every variable the code reads: required or optional, where to get it, and which Vercel environments need it. Server-only secrets: `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `VAPID_PRIVATE_KEY`, `ANALYTICS_SALT`. Never commit `.env.local`.

Two separate modes, never mixed:

| Mode | File | Project ID | How the server authenticates |
|---|---|---|---|
| Real Firebase | `.env.local` (git-ignored) / Vercel | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (e.g. `ss-infra-14cf8`) | Service-account key: `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` |
| Emulators | `.env.emulator` (committed, no secrets) | `demo-ssinfra` | None (emulators need no credentials) |

- **One project ID.** Browser and Firebase Admin both use `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. `FIREBASE_PROJECT_ID` is no longer read; if it is set to a different value, Firebase is disabled with a config error.
- **No Application Default Credentials.** The server uses `cert()` with the service account. Vercel has no Google metadata server, so ADC wouldn't work there.
- **Validation** (`src/lib/firebase/config.ts`, shared by the app, `next.config.ts` and the CLI scripts) checks that the service account belongs to the same project, that the key is PEM, that emulator hosts are complete, and that demo projects aren't used outside the emulators. At server start, one log line reports the mode (`[firebase] project … with a service account`, `not configured (missing …)` or `INVALID configuration: …`). Secrets are never logged.
- **Vercel guard.** A Vercel build with emulator variables or otherwise invalid Firebase config fails on purpose. A build with *no* Firebase credentials succeeds; the site then runs on its fallbacks.

## Database outages
Public pages never depend on the database to render:
- The site builds without any database connection. Package pricing is read at request time (`connection()` + `"use cache"`, tag-invalidated by admin saves) inside `<Suspense>`, so `next build` never touches Firestore.
- If packages can't be loaded (not configured, unreachable, timeout after 6 s, permission or quota errors), the pricing section shows "Contact us for current pricing" with *Request a Quote* and *Call* buttons. Failures are cached for seconds only, so pricing comes back as soon as Firestore does.
- An enquiry is reported as sent **only** after the Firestore transaction commits. Otherwise the visitor sees why it wasn't sent, keeps everything they typed, and gets a call link. If Firestore doesn't answer within 15 s the message says the save *couldn't be confirmed*; resubmitting is safe because the idempotency key prevents a duplicate.
- Admin writes (status, notes, packages, show/hide, delete) report the real failure kind instead of a success message.
- Server logs use one sanitized line per failure: `[scope] firebase <kind> (code N): message`, where the kind is `not_configured`, `invalid_config`, `unavailable`, `timeout`, `auth_failed`, `permission_denied`, `quota_exceeded`, `not_found` or `unknown`.

## Running locally

```bash
npm install
```

**Option A: Firebase emulators (no Firebase account needed).** Requires Java 21+.
```bash
npm run emulators     # terminal 1
# terminal 2: .env.emulator overrides the Firebase values in .env.local
node --env-file=.env.emulator scripts/create-admin.mjs create you@example.com "Your Name"
node --env-file=.env.emulator scripts/seed-packages.mjs
npm run dev:emulator  # http://localhost:3000, admin at /admin
```

**Option B: real Firebase project.** Fill `.env.local` from `.env.example` (no emulator variables), then:
```bash
node --env-file=.env.local scripts/create-admin.mjs create you@example.com "Your Name"
node --env-file=.env.local scripts/seed-packages.mjs
npm run dev
```

### Checks
```bash
npm run typecheck     # next typegen + tsc
npm run lint
npm test              # unit tests (Vitest)
npm run test:e2e      # E2E (Playwright). Needs `npm run emulators`; WIPES the emulator database
npm run test:outage   # production build + start with Firestore unreachable, then with no Firebase config
                      # (no emulator or project needed; rebuilds .next, so stop other next servers)
npm run build         # needs no database
```

## Firebase project setup (one time)
1. Create a project at console.firebase.google.com. Add a **Web app** → copy config into `NEXT_PUBLIC_FIREBASE_*`.
2. Build → Authentication → enable **Email/Password**. Under Settings, **disable "Enable create (sign-up)"** for users so nobody can self-register.
3. Build → Firestore Database → create (production mode; choose an India region such as `asia-south1`).
4. Project settings → Service accounts → Generate new private key → copy `client_email` to `FIREBASE_CLIENT_EMAIL` and `private_key` to `FIREBASE_PRIVATE_KEY`, then delete the JSON file. (No `FIREBASE_PROJECT_ID`; the project comes from `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.)
5. Deploy rules, indexes and TTL policies:
   ```bash
   npx firebase login
   npx firebase deploy --only firestore --project <your-project-id>
   ```
6. `openssl rand -hex 32` → `ANALYTICS_SALT`. `npx web-push generate-vapid-keys` → VAPID keys; `VAPID_SUBJECT` = your live site URL (`https://…`, not localhost; Apple rejects localhost subjects).
7. Create the owner's admin account and seed packages (commands above).

## Deploying to Vercel
1. Import the folder (put it in a Git repository first) into Vercel. Framework preset: Next.js.
2. Add every required variable from `.env.example` for Production (and Preview if you use previews). Never add emulator variables: the build refuses them. Set `NEXT_PUBLIC_SITE_URL` to the live domain.
3. Deploy, attach the domain (HTTPS is automatic and required for the PWA and push).
4. Submit `https://<domain>/sitemap.xml` in Google Search Console.

## Admin app (PWA) and notifications
- **Install**: Android/desktop Chrome or Edge: open `/admin`, use the "Install app" button on the dashboard (or the browser menu). iPhone/iPad: Safari → Share → *Add to Home Screen*.
- **Notifications**: on the dashboard's *This device* card, tap *Turn on notifications* (permission is only requested on that tap). *Send a test* checks delivery.
- iOS supports web push only for Home Screen apps (iOS 16.4+). If push is off or denied, the Leads tab still shows a badge with the count of new leads.
- This is an installable web app, not a native Play Store / App Store app.
- Removing an admin or a lost phone: `node --env-file=.env.local scripts/create-admin.mjs revoke <email>` ends all their sessions.

## Tests actually run (25 Oct 2026, against Firebase emulators)
- Unit: 83 passing (phone normalisation, lead/package validation, price display, analytics path/referrer/bot filtering, IST dates; Firebase config resolution and validation, error classification/sanitizing, package-read success and fallbacks (unreachable, not configured, permission, quota, timeout), failed and timed-out enquiry saves, honeypot never reported as success, admin write failures).
- Outage E2E (`npm run test:outage`): 8 passing, 4 with Firestore unreachable and 4 with no Firebase config. All public pages 200, pricing fallback, enquiry error with call link and form values kept, admin closed, beacon 204.
- E2E: 37 passing in Chrome. Covers the five pages, unique titles/canonicals, 404, sitemap/robots, no horizontal overflow at 320–1920px, mobile menu (open, Escape, focus return, navigation), gallery filter + lightbox, service/package prefill, form validation, conditional fields, double-submit idempotency, XSS-as-text, bot timing check, admin redirects, forged cookie, non-admin account refused, wrong password, cross-site session request, private/noindex headers, Firestore rules denial, dashboard counts, search/filter/sort, status + notes persistence, call/WhatsApp links, phone-width admin, sign-out, package publish/price/hide/create/duplicate-slug/delete, pricing changes appearing live, analytics dedupe (4 views, 1 visitor; bot ignored), rate limiting.
- Manual scripted check on the production build: manifest served and linked; service worker active (scope `/admin`); install prompt offered; push subscription saved; **a new enquiry delivered a real push notification** linking to the lead; offline navigation shows the offline page; the cache holds only that page.
- Typecheck, ESLint and `next build`: clean; `next build` also passes with the emulators stopped and with no Firebase credentials.

### Not verified
- Against a real Firebase project and on Vercel (no credentials yet).
- On physical Android/iPhone devices, and in Safari/Firefox (Playwright runs used Chrome).
- Lighthouse/Core Web Vitals scores.

## Still needed from the client
- Confirm 096725 67423 is on WhatsApp → set `NEXT_PUBLIC_WHATSAPP_ENABLED=true`.
- Official logo files (SVG preferred).
- Official email address (optional; omitted until supplied).
- Project names/locations for gallery photos they're happy to publish.
- Confirmed specifications (steel, glass, turf, lighting), warranty, and which court types they supply.
- Review of the five package templates (seeded **hidden**, no prices) before switching any on.
- Review of the budget brackets in the form (`src/lib/domain.ts`) and the privacy policy (ideally against India's DPDP Act, 2023).

## Known limitations
- Lead text search scans up to the 1,000 most recent filtered leads in memory (Firestore has no full-text search). Fine at this business's volume; move to a search index if leads grow into the thousands.
- Rate limits use fixed windows, so a burst straddling a window boundary can briefly allow up to 2× the limit.
- `npm audit` reports a high-severity advisory in `@grpc/grpc-js` via the Firebase *client* SDK's Firestore module. It concerns gRPC servers; this app doesn't run one and the browser only imports `firebase/auth`.
