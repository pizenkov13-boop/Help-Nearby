# Help Nearby 🌍

**Find life-saving help near you — anywhere in the world.**

[Live Demo](https://help-nearby-jgvv.vercel.app) · [Submit an organization](https://help-nearby-jgvv.vercel.app/submit) · [Leave a review](https://help-nearby-jgvv.vercel.app/reviews)

---

## About

**Help Nearby** is a free, open-source platform that connects people in crisis with local assistance organizations worldwide — food banks, shelters, medical aid, clothing donations, and volunteer opportunities.

The project was built by a 15-year-old developer from Russia with a simple goal: make it fast and easy for anyone, on any device, to find trusted help close to where they are.

Whether someone is facing hunger, homelessness, or an emergency, Help Nearby turns scattered information into one clear map and list — in their own language.

---

## Features

| Feature | Description |
|--------|-------------|
| 🗺️ **Interactive map** | Real-time geolocation, street-level routing (OSRM), and organization markers |
| 🌍 **Worldwide coverage** | OpenStreetMap data via the Overpass API — works in any city |
| 🆘 **Emergency Help** | One-tap access to **24/7** organizations (hospitals, pharmacies, ambulance stations) sorted by distance |
| 🔍 **Smart search** | Real-time filter by name, city, or address — works with country & category filters |
| 📞 **Call Now** | One-tap `tel:` links on mobile; phone number on hover on desktop |
| 🤖 **AI assistant** | Powered by **Groq** (Llama 3.3 70B) — answers questions about nearby help |
| 🌐 **7 languages** | English, Russian, Spanish, French, German, Chinese, Arabic (RTL support) |
| 📱 **PWA** | Installable app with offline fallback page |
| ⚡ **Lite mode** | Auto-enabled on slow networks (2G / slow-3G) or in low-connectivity regions — list-only, no map, loads fast |
| ✅ **Verified organizations** | Community submissions reviewed by admin before showing a verified badge |
| 💬 **Reviews** | User feedback with admin moderation |
| 📊 **Impact counter** | Tracks “people found help today” from Call & Directions clicks |

---

## Impact

- Users from **7+ countries** including Sudan, Nigeria, and South Korea  
- **Real-time coverage** in any city with OpenStreetMap data  
- Designed around **UN Sustainable Development Goals**:  
  - **SDG 1** — No Poverty  
  - **SDG 2** — Zero Hunger  
  - **SDG 3** — Good Health and Well-being  

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/) |
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

Help Nearby demonstrates how young innovators can use open data and accessible technology to address humanitarian needs at global scale with a lightweight, inclusive product.

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
