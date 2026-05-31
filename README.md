# Help Nearby 🌍

**Find life-saving help near you — anywhere in the world.**

[Live Demo](https://help-nearby-jgvv.vercel.app) · [Submit an organization](https://help-nearby-jgvv.vercel.app/submit) · [Leave a review](https://help-nearby-jgvv.vercel.app/reviews)

---

## About

**Help Nearby** is a free, open-source platform that connects people in crisis with local assistance organizations worldwide — food banks, shelters, medical aid, clothing donations, and volunteer opportunities.

The project was built by a 15-year-old developer from Russia with a simple goal: make it fast and easy for anyone, on any device, to find trusted help close to where they are.

Whether someone is facing hunger, homelessness, or an emergency, Help Nearby turns scattered information into one clear map and list — in their own language.

---

## Story

Help Nearby was built by **Pavel Izenkin**, a 15-year-old from Prokopyevsk, a small coal-mining city in Siberia. With no professional coding background, Pavel and a friend pooled together 6000 rubles (about $70) for AI tool subscriptions, and built the first working version in 12 days.

The project started during work on a UN Sustainable Development Goals challenge — and continued because real users in Russia, Sudan, Egypt, and other countries began using it.

A user from Egypt asked for Arabic language support and a lite mode for slow internet — we built both. That's the principle: **real users, real feedback, honest data.**

---

## Features

| Feature | Description |
|--------|-------------|
| 🗺️ **Interactive map** | Real-time geolocation, street-level routing (OSRM), and organization markers |
| 🌍 **OSM coverage** | OpenStreetMap via Overpass API — any city where OSM has relevant organization data (coverage varies) |
| 🆘 **Emergency Help** | One-tap access to **24/7** organizations (hospitals, pharmacies, ambulance stations) sorted by distance |
| 🔍 **Smart search** | Real-time filter by name, city, or address — works with country & category filters |
| 📞 **Call Now** | One-tap `tel:` links on mobile; phone number on hover on desktop |
| 🤖 **AI assistant** | Powered by **Groq** (Llama 3.3 70B) — answers questions about nearby help |
| 🌐 **7 languages** | English, Russian, Spanish, French, German, Chinese, Arabic (RTL support) |
| 📱 **PWA** | Installable as PWA (Progressive Web App). Service worker serves a static offline page if navigation fails without network; search, map, and APIs require a connection |
| ⚡ **Lite mode** | Auto-enabled on slow networks (2G / slow-3G) or in low-connectivity regions — list-only, no map, loads fast |
| ✅ **Verified organizations** | Community submissions reviewed by admin before showing a verified badge |
| 💬 **Reviews** | User feedback with admin moderation |
| 📊 **Impact counter** | Counts today’s Call and Directions button clicks (stored in Supabase); not a verified count of people who received aid |

---

## Impact

Used by people from **24 countries** in the first month after launch (April 2026), including users from Russia, Kazakhstan, Belarus, Sudan, Egypt, and the United States. Tracked via [PostHog](https://posthog.com/) analytics.

- **Impact counter** — displays the number of Call / Directions button clicks recorded today in Supabase; a usage signal, not proof that someone received aid
- **OpenStreetMap coverage** — organization search works wherever OSM has relevant POI data (quality varies by region)
- **Mission alignment** — references UN SDGs (1, 2, 3) as guiding themes shown in the footer; not a UN partnership or endorsement

---

## Data sources

Help Nearby uses two data layers:

1. **OpenStreetMap (Overpass API)** — covers any city worldwide where OSM has data on humanitarian organizations
2. **A small verified network of organizations in our region**, manually checked by our team against official public sources

We do **not** have formal partnerships with UN agencies. Our partner is [Kindness Corporation](https://www.kindnesscorporation.ru/) (community organization).

Verified entries in Supabase are moderated through `/admin`. Everything else comes from live Overpass queries and is only as accurate as the underlying OSM tags.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security) |
| Maps | [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/), [OpenStreetMap](https://www.openstreetmap.org/) tiles |
| Geocoding & POIs | [Nominatim](https://nominatim.org/), [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) |
| Routing | [OSRM](http://project-osrm.org/) |
| AI | [Groq](https://groq.com/) — Llama 3.3 70B Versatile |
| Analytics | [PostHog](https://posthog.com/) |
| Hosting | [Vercel](https://vercel.com/) |

---

## Live Demo

👉 **[https://help-nearby-jgvv.vercel.app](https://help-nearby-jgvv.vercel.app)**

---

## Zayed Sustainability Prize 2026

This project is submitted for the **Zayed Sustainability Prize 2026** — **Global High Schools** category.

Help Nearby demonstrates how young innovators can use open data and accessible technology to help people find local assistance — with clear limits on what the data can guarantee.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+  
- [npm](https://www.npmjs.com/) (or pnpm / yarn)  
- A [Supabase](https://supabase.com/) project  
- Optional: [Groq API](https://console.groq.com/) key for the AI chat  

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/help-nearby.git
cd help-nearby
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

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

> **Never commit `.env.local` or secret keys to Git.**

### 3. Database setup

Run the SQL migrations in order in the Supabase SQL Editor (or use the Supabase CLI):

```
supabase/migrations/20250319000000_create_organizations.sql
supabase/migrations/20250319000001_seed_organizations.sql
supabase/migrations/20250319000002_allow_organization_submit.sql
supabase/migrations/20250320000000_create_reviews.sql
supabase/migrations/20250320000001_mark_247_organizations.sql
supabase/migrations/20250320000002_create_impact_clicks.sql
supabase/migrations/20250320000003_admin_verify_organizations.sql
supabase/migrations/20250320000004_reviews_approved.sql
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
npm run build
npm start
```

---

## Admin

Password-protected moderation at **`/admin`**:

- Approve **organizations** submitted via the public form  
- Approve or delete **reviews** before they appear on the site  

Requires `ADMIN_PASSWORD` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

---

## Project Structure

```
app/                 # Next.js App Router pages & API routes
components/          # React UI (map, filters, emergency, chat, …)
lib/                 # Data, geocoding, routing, i18n, Supabase helpers
public/              # PWA manifest, icons, service worker
supabase/migrations/ # PostgreSQL schema & policies
```

---

## API Routes (overview)

| Route | Purpose |
|-------|---------|
| `/api/nearby` | Overpass organizations near coordinates |
| `/api/emergency` | 24/7 Supabase + Overpass emergency list |
| `/api/route` | OSRM turn-by-turn routing |
| `/api/geocode` | Nominatim address → coordinates |
| `/api/submit` | Public organization submissions |
| `/api/reviews` | Approved reviews (GET) / new review (POST) |
| `/api/chat` | Groq AI assistant |
| `/api/impact` | Impact click tracking |
| `/api/admin/*` | Admin auth, verify orgs, moderate reviews |

---

## Contributing

Contributions are welcome — especially:

- Organization data for underserved regions  
- Translations and accessibility improvements  
- Bug reports and performance fixes on slow networks  

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/amazing-feature`)  
3. Commit your changes  
4. Open a Pull Request  

Please do not include API keys or `.env.local` in submissions.

---

## Roadmap (2026–2028, with Zayed Sustainability Prize support)

- **1200** manually verified humanitarian organizations across **12 countries** in Europe & Central Asia
- Reach **30,000** people seeking help
- Native mobile app (iOS / Android)
- Expanded language support
- Partnership network with regional NGOs

---

## License

This project is open source. See repository license terms for details.

---

## Contact & Links

- **Live app:** [help-nearby-jgvv.vercel.app](https://help-nearby-jgvv.vercel.app)  
- **Built with:** OpenStreetMap contributors, Supabase, Groq, and the open-source community  

---

<p align="center">
  <strong>Help Nearby</strong> — because everyone deserves to know where help is close.
</p>
