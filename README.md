# Help Nearby

[![Live Site](https://img.shields.io/badge/Live-help--nearby.org-2563eb?style=flat-square)](https://help-nearby.org)
[![Languages](https://img.shields.io/badge/Languages-7-10b981?style=flat-square)](#features)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Find free humanitarian assistance near you — food, shelter, medical aid, clothing, and volunteer support on one map.**

[Live app](https://help-nearby.org) · [Submit an organization](https://help-nearby.org/submit) · [Leave a review](https://help-nearby.org/reviews)

---

## About

**Help Nearby** is a free, open-source web platform that helps people in crisis find local assistance organizations. It combines a **verified catalog** stored in Supabase with **live OpenStreetMap data** from the Overpass API, then shows results on an interactive map or in a lightweight list view.

The project was built by **Pavel Izenkin**, 15, from Prokopyevsk, Russia — with the goal of making trusted help easy to find on any device, in any language, even on slow networks.

---

## Status

| | |
|---|---|
| **Initial prototype (Webflow)** | April 16 – May 12, 2026 |
| **Production platform (Next.js)** | May 17, 2026 – present · [help-nearby.org](https://help-nearby.org) |
| **Prize submission** | Zayed Sustainability Prize **2027** — Global High Schools category |
| **Prototype reach (Webflow, April–May 2026)** | Users from **24 countries** in the first month (Webflow analytics) |
| **Production analytics (Next.js, since May 17, 2026)** | PostHog on help-nearby.org — early-stage traffic; exact visitor and country counts are in the PostHog dashboard (not duplicated here to avoid stale figures) |

---

## Verified humanitarian directory

These organizations are seeded in Supabase with `verified = true` and official source attribution. Counts are from the SQL seed files in this repository (not a live DB query).

| Region / source | Organizations | Seed file | Official source |
|-----------------|---------------|---------|-----------------|
| Russia (Nochlezhka / homeless.ru) | **70** | `supabase/RUN_NOCHLEZHKA.sql` | [ночлежка.рф](https://ночлежка.рф) · [homeless.ru](https://homeless.ru) |
| Sudan (Sudanese Red Crescent) | **18** | `supabase/RUN_SUDAN_RED_CRESCENT.sql` | [srcs.sd](https://www.srcs.sd) |
| Kazakhstan (Red Crescent) | **16** | `supabase/RUN_KAZAKHSTAN_RED_CRESCENT.sql` | [redcrescent.kz](https://redcrescent.kz) |
| UAE (Emirates Red Crescent) | **10** | `supabase/RUN_UAE_RED_CRESCENT.sql` | [emiratesrc.ae](https://emiratesrc.ae) |
| Belarus (Red Cross) | **9** | `supabase/RUN_BELARUS_RED_CROSS.sql` | [redcross.by](https://redcross.by) |
| Demo seed (New York, US) | **3** | `supabase/migrations/20250319000001_seed_organizations.sql` | Example data |
| **Total (all seeds)** | **126** | | |

Community submissions via `/submit` are stored as **unverified** until approved in `/admin`.

---

## Features

| Feature | Description |
|---------|-------------|
| **Interactive map** | Leaflet map with category markers, verified badge, and source labels |
| **Multi-source data** | Supabase verified catalog + HDX + GDHO + live Overpass OSM queries |
| **Emergency mode** | One-tap list of 24/7 organizations (hospitals, pharmacies, shelters) |
| **Smart radius search** | Auto-expands search radius until results are found |
| **Turn-by-turn routing** | OSRM routing via `/api/route` |
| **7 languages** | English, Russian, Spanish, French, German, Chinese, Arabic (RTL) |
| **Lite mode** | List-only view (no map tiles) for slow networks and low-connectivity regions |
| **Adaptive theme** | Auto light theme in sunny regions (browser geolocation + country lookup); manual dark/light toggle |
| **AI assistant** | Groq (Llama 3.3 70B) chat — **experimental** |
| **PWA** | Progressive Web App — **experimental** (manifest + partial service worker; offline page only, not full offline app) |
| **Admin moderation** | Password-protected `/admin` for org and review approval |
| **Impact counter** | Tracks Call / Directions clicks in Supabase (usage signal, not aid delivery proof) |

---

## Data sources & integrations

### Active in production search flow

| Source | Role | Code |
|--------|------|------|
| **Supabase** | Verified organization catalog (PostgreSQL + RLS) | `lib/data.ts` |
| **OpenStreetMap / Overpass** | Live POI search worldwide | `lib/overpass.server.ts` → `/api/nearby` |
| **HDX** (UN OCHA Humanitarian Data Exchange) | Country-level humanitarian orgs | `lib/hdx.ts` → `lib/verifiedNearby.server.ts` → `/api/verified-nearby` |
| **GDHO** (Global Directory of Humanitarian Organizations) | Country-level humanitarian orgs | `lib/gdho.ts` → `lib/verifiedNearby.server.ts` → `/api/verified-nearby` |
| **Nominatim** | Forward/reverse geocoding for addresses | `lib/nominatim.server.ts` → `/api/geocode` |
| **OSRM** | Turn-by-turn routing | `lib/osrmRouting.server.ts` → `/api/route` |

HDX and GDHO results merge with Supabase + Overpass in `lib/nearbySearch.ts` (deduplicated by name). Each source has a 5-second timeout; failures do not block other results.

### Not deployed

| Source | File | Status |
|--------|------|--------|
| **ReliefWeb** | `lib/reliefweb.ts` | Local branch only · **not deployed** (API approval pending) |

---

## Tech stack

Verified from `package.json` and project source:

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | [Next.js](https://nextjs.org/) (App Router) | **16.2.6** |
| Language | [TypeScript](https://www.typescriptlang.org/) | **5.x** |
| UI | [React](https://react.dev/) | **18** |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | **3.4.1** |
| Components | [Radix UI](https://www.radix-ui.com/) (`@radix-ui/react-slot`), [Lucide](https://lucide.dev/) icons | — |
| Database | [Supabase](https://supabase.com/) (`@supabase/supabase-js`) | **2.106.0** |
| Maps | [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/) | 1.9.4 / 4.2.1 |
| Geocoding | [Nominatim](https://nominatim.org/) | via `/api/geocode` |
| POI data | [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) | via `/api/nearby` |
| Routing | [OSRM](http://project-osrm.org/) | via `/api/route` |
| AI chat | [Groq](https://groq.com/) — `llama-3.3-70b-versatile` | via `/api/chat` |
| Analytics | [PostHog](https://posthog.com/) (`posthog-js`) | **1.374.3** |
| Hosting | [Vercel](https://vercel.com/) | Production + preview deploys |
| E2E tests | [Playwright](https://playwright.dev/) | **1.60.0** |

---

## Live deployment

| Environment | URL |
|-------------|-----|
| **Production (primary)** | [https://help-nearby.org](https://help-nearby.org) |
| **Vercel (legacy redirect)** | [https://help-nearby-jgvv.vercel.app](https://help-nearby-jgvv.vercel.app) → redirects to `help-nearby.org` |

---

## Getting started

### Prerequisites

- Node.js 18+
- npm (or pnpm / yarn)
- A [Supabase](https://supabase.com/) project

### 1. Clone & install

```bash
git clone https://github.com/pizenkov13-boop/Help-Nearby.git
cd Help-Nearby
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Admin moderation (optional — /admin)
ADMIN_PASSWORD=your-secure-admin-password
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI chat (optional)
GROQ_API_KEY=your-groq-api-key

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

> Never commit `.env.local` or secret keys to Git.

### 3. Database setup

Run migrations in order in the Supabase SQL Editor, then apply regional seed files:

```
supabase/migrations/20250319000000_create_organizations.sql
supabase/migrations/20250319000001_seed_organizations.sql
… (see supabase/migrations/ for full list)
```

Quick regional seeds (run in Supabase SQL Editor):

```
supabase/RUN_NOCHLEZHKA.sql
supabase/RUN_SUDAN_RED_CRESCENT.sql
supabase/RUN_KAZAKHSTAN_RED_CRESCENT.sql
supabase/RUN_UAE_RED_CRESCENT.sql
supabase/RUN_BELARUS_RED_CROSS.sql
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Build & test

```bash
npm run build
npm run test:e2e
```

---

## Project structure

```
app/                 # Next.js App Router pages & API routes
components/          # React UI (map, filters, emergency, chat, …)
lib/                 # Data, geocoding, routing, i18n, Supabase helpers
public/              # PWA manifest, icons, service worker
supabase/migrations/ # PostgreSQL schema, policies, and seed SQL
scripts/             # Geocoding and build utilities
```

---

## API routes

| Route | Purpose |
|-------|---------|
| `/api/nearby` | Overpass organizations near coordinates |
| `/api/verified-nearby` | HDX + GDHO organizations for a country (geocoded, radius-filtered) |
| `/api/emergency` | 24/7 Supabase + Overpass emergency list |
| `/api/route` | OSRM turn-by-turn routing |
| `/api/geocode` | Nominatim address → coordinates |
| `/api/geocode/reverse` | Coordinates → country |
| `/api/submit` | Public organization submissions |
| `/api/reviews` | Approved reviews (GET) / new review (POST) |
| `/api/chat` | Groq AI assistant |
| `/api/impact` | Impact click tracking |
| `/api/admin/*` | Admin auth, verify orgs, moderate reviews |

---

## Contributing

Contributions are welcome — especially organization data for underserved regions, translations, and performance fixes on slow networks.

1. Fork [pizenkov13-boop/Help-Nearby](https://github.com/pizenkov13-boop/Help-Nearby)
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a Pull Request

Please do not include API keys or `.env.local` in submissions.

---

## Founder

**Pavel Izenkin** — 15 years old, Prokopyevsk, Russia.

Built with support from the open-source community, OpenStreetMap contributors, Supabase, and Groq.

Community partner: [Kindness Corporation](https://www.kindnesscorporation.ru/)

---

## License

Licensed under the MIT License — see [LICENSE](LICENSE) file.

---

## Repository

| | |
|---|---|
| **GitHub** | [github.com/pizenkov13-boop/Help-Nearby](https://github.com/pizenkov13-boop/Help-Nearby) |
| **Default branch** | `main` |

---

<p align="center">
  <strong>Help Nearby</strong> — because everyone deserves to know where help is close.
</p>
