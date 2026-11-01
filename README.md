# Help Nearby

[![Live Site](https://img.shields.io/badge/Live-www.help--nearby.org-2563eb?style=flat-square)](https://www.help-nearby.org/)
[![Languages](https://img.shields.io/badge/Languages-7-10b981?style=flat-square)](#features)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Find free humanitarian assistance near you — food, shelter, medical aid, clothing, and volunteer support on one map.**

[Live app](https://www.help-nearby.org/) · [Submit an organization](https://www.help-nearby.org/submit) · [Leave a review](https://www.help-nearby.org/reviews)

---

## About

**Help Nearby** is a free, open-source web platform that helps people in crisis find local assistance organizations. It combines a **verified catalog** stored in Supabase with **live OpenStreetMap data** from the Overpass API, then shows results on an interactive map or in a lightweight list view.

The project was built by **Pavel Izenkin**, 16, from Russia — with the goal of making trusted help easy to find on any device, in any language, even on slow networks.

---

## Status

| | |
|---|---|
| **Initial prototype (Webflow)** | April 16 – May 12, 2026 |
| **Production platform (Next.js)** | May 17, 2026 – present · [www.help-nearby.org](https://www.help-nearby.org/) |
| **Prize submission** | Zayed Sustainability Prize **2027** — Global High Schools category |
| **Prototype reach (Webflow, April–May 2026)** | Users from **24 countries** in the first month (Webflow analytics) |
| **Production analytics (Next.js)** | [Vercel Web Analytics](https://vercel.com/docs/analytics) — cookie-less, aggregated page views; exact counts are in the Vercel dashboard (not duplicated here to avoid stale figures) |

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
| France (Croix-Rouge française) | **60** | `supabase/RUN_CROIX_ROUGE_FRANCE.sql` | [croix-rouge.fr/annuaire](https://www.croix-rouge.fr/annuaire) |
| Demo seed (New York, US) | **3** | `supabase/migrations/20250319000001_seed_organizations.sql` | Example data |
| **Total (verified, excl. demo seed)** | **183** | | |

Community submissions via `/submit` are stored as **unverified** until approved in `/admin`.

---

## Features

| Feature | Description |
|---------|-------------|
| **Interactive map** | Leaflet map with category markers, verified badge, and source labels |
| **Multi-source data** | Supabase verified catalog + HDX + GDHO + ReliefWeb + live Overpass OSM queries |
| **Emergency mode** | One-tap list of 24/7 organizations (hospitals, pharmacies, shelters) |
| **Smart radius search** | Auto-expands search radius until results are found |
| **Turn-by-turn routing** | OSRM routing via `/api/route` |
| **7 languages** | English, Russian, Spanish, French, German, Chinese, Arabic (RTL) |
| **Lite mode** | List-only view (no map tiles) for slow networks and low-connectivity regions |
| **Adaptive theme** | Auto light theme in sunny regions (browser geolocation + country lookup); manual dark/light toggle |
| **AI assistant** | AITunnel (OpenAI-compatible) chat, scoped to humanitarian help — **experimental** |
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
| **ReliefWeb** (OCHA) | Country-level humanitarian sources | `lib/reliefweb.ts` → `lib/verifiedNearby.server.ts` → `/api/verified-nearby` |
| **Nominatim** | Forward/reverse geocoding for addresses | `lib/nominatim.server.ts` → `/api/geocode` |
| **OSRM** | Turn-by-turn routing | `lib/osrmRouting.server.ts` → `/api/route` |

HDX, GDHO, and ReliefWeb results merge with Supabase + Overpass in `lib/nearbySearch.ts` (deduplicated by name). Each OCHA-family source has a 15-second timeout. ReliefWeb is skipped for Ukraine (local catalog + HDX/GDHO cover that region). Failures do not block other results.

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
| AI chat | [AITunnel](https://aitunnel.ru/) (OpenAI-compatible API) | via `/api/chat` |
| Analytics | [Vercel Web Analytics](https://vercel.com/docs/analytics) (`@vercel/analytics`) | cookie-less; enable it in the Vercel project (Analytics tab) |
| Hosting | [Vercel](https://vercel.com/) | Production + preview deploys |
| E2E tests | [Playwright](https://playwright.dev/) | **1.60.0** |

---

## UN-related data sources

Country-level organization listings are fetched server-side from three public humanitarian data sources (see "Data sources & integrations" above):

- **HDX** (Humanitarian Data Exchange, UN OCHA) — public CKAN API
- **GDHO** (Global Directory of Humanitarian Organizations, Humanitarian Outcomes) — CSV export
- **ReliefWeb** (UN OCHA) — public API v2, used with a registered `appname`

These are used as data sources only; the project is independent and is not operated by or affiliated with the United Nations. Help Nearby is listed on the UN SDG partnerships platform: [sdgs.un.org/partnerships/helpnearby](https://sdgs.un.org/partnerships/helpnearby).

---

## Запусти в своём городе

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpizenkov13-boop%2FHelp-Nearby&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ADMIN_PASSWORD,ADMIN_SESSION_SECRET&envDescription=Supabase%20project%20keys%20and%20admin%20credentials%20(see%20README%2C%20Run%20it%20in%20your%20city)&envLink=https%3A%2F%2Fgithub.com%2Fpizenkov13-boop%2FHelp-Nearby%23run-it-in-your-city&project-name=help-nearby&repository-name=help-nearby)

Любой может запустить свою копию Help Nearby для города, региона или сообщества. Нужны бесплатные аккаунты на GitHub, [Supabase](https://supabase.com/) и [Vercel](https://vercel.com/).

1. **Сделайте форк репозитория** (или используйте его как шаблон) на GitHub.
2. **Создайте проект Supabase** на [supabase.com](https://supabase.com/). Запишите URL проекта, ключ `anon` и ключ `service_role` (Project Settings → API).
3. **Выполните SQL.** В Supabase → SQL Editor запустите [`supabase/schema.sql`](supabase/schema.sql) на пустом проекте. При желании запустите и [`supabase/seed_demo.sql`](supabase/seed_demo.sql): он добавляет три вымышленные организации-примера, которые нужно удалить или заменить своими.
4. **Задайте переменные окружения** (Vercel → Project → Settings → Environment Variables или локально в `.env.local`). Храните ключи в секрете и никогда не коммитьте их.

   | Переменная | Обязательна | Описание |
   |------------|-------------|----------|
   | `NEXT_PUBLIC_SUPABASE_URL` | да | URL проекта Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | да | Публичный ключ Supabase (anon) |
   | `SUPABASE_SERVICE_ROLE_KEY` | да | Серверный ключ для модерации и счётчиков |
   | `ADMIN_PASSWORD` | да | Пароль для `/admin` |
   | `ADMIN_SESSION_SECRET` | да | Случайная строка от 32 символов, которой подписывается cookie админ-сессии |
   | `NEXT_PUBLIC_SITE_NAME` | нет | Название сайта в метаданных и манифесте PWA (по умолчанию `Help Nearby`) |
   | `NEXT_PUBLIC_SITE_URL` | нет | Основной адрес вашего сайта, например `https://help.example.org` |
   | `NEXT_PUBLIC_DEFAULT_LANGUAGE` | нет | Язык при первом визите: `en`, `ru`, `es`, `fr`, `de`, `zh`, `ar` (по умолчанию `en`) |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | нет | Публичный контактный адрес в подвале и на странице приватности |
   | `NEXT_PUBLIC_MAP_CENTER` | нет | Центр карты региона в виде `lat,lng` (зарезервировано; сейчас приложение стартует с местоположения посетителя) |
   | `NEXT_PUBLIC_MAP_ZOOM` | нет | Начальный зум карты, 1–19 (по умолчанию `14`) |
   | `NEXT_PUBLIC_FOOTER_LINK_URL` | нет | Ссылка на проект в подвале (по умолчанию — этот репозиторий) |
   | `DISABLE_PING` | нет | `true` отключает анонимный пинг копии (см. [Приватность](#приватность-и-анонимный-пинг)) |
   | `RELIEFWEB_APPNAME` | нет | Ваш зарегистрированный [appname ReliefWeb](https://apidoc.reliefweb.int/); без него результаты ReliefWeb пропускаются |
   | `AITUNNEL_API_KEY`, `AITUNNEL_BASE_URL`, `AITUNNEL_MODEL` | нет | Включают экспериментального ИИ-ассистента |
   | `NEXT_PUBLIC_MAP_TILES_URL`, `NEXT_PUBLIC_MAP_TILES_ATTRIBUTION` | нет | Свой провайдер тайлов карты |
   | `DEBUG_TOKEN` | нет | Включает диагностический маршрут `/api/debug/sources` |

5. **Задеплойте на Vercel** (кнопкой выше или импортом форка), затем **добавьте организации**: войдите в `/admin` и подтверждайте заявки с `/submit`, либо загрузите строки CSV-файлом в таблицу `organizations` (Supabase → Table Editor → Insert → Import data from CSV; колонки как в [`supabase/schema.sql`](supabase/schema.sql), `verified` поставьте `true`).

**Запустил? Напиши на hello@help-nearby.org или добавь строку через pull request.**

### Где работает

| Город | Страна | Сайт | Кто ведёт |
|-------|--------|------|-----------|
| Там, где есть помощь в ближайших 15 км | — | [www.help-nearby.org](https://www.help-nearby.org/) | Pavel Izenkin |

### Приватность и анонимный пинг

- **Посетители:** на основном сайте используется аналитика без cookie (только агрегированные просмотры страниц); в браузере хранятся лишь настройки языка и темы. Подробности — на странице приватности в приложении.
- **Анонимный пинг копий:** копия Help Nearby на любом домене, кроме `www.help-nearby.org`, раз в сутки отправляет один запрос на `https://www.help-nearby.org/api/deployments` ровно с тремя полями: `domain` (имя хоста вашего сайта), `version` (версия приложения) и `timestamp`. В нём нет данных посетителей, поисковых запросов и ключей. Как любой HTTP-запрос, он приходит на наш сервер с IP-адреса вашего сервера; адрес используется только для ограничения частоты в памяти и не сохраняется. Это позволяет проекту видеть, сколько копий живы. Пинг отправляет ежедневный cron Vercel из [`vercel.json`](vercel.json) через [`lib/ping.server.ts`](lib/ping.server.ts).
- **Как отключить:** задайте `DISABLE_PING=true` в переменных окружения (или удалите запись cron в `vercel.json`).
- **Наша сторона:** принимающий маршрут проверяет и ограничивает запросы и хранит в таблице `deployments` только домен, версию, время первого и последнего пинга.

---

## Run it in your city

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpizenkov13-boop%2FHelp-Nearby&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ADMIN_PASSWORD,ADMIN_SESSION_SECRET&envDescription=Supabase%20project%20keys%20and%20admin%20credentials%20(see%20README%2C%20Run%20it%20in%20your%20city)&envLink=https%3A%2F%2Fgithub.com%2Fpizenkov13-boop%2FHelp-Nearby%23run-it-in-your-city&project-name=help-nearby&repository-name=help-nearby)

Anyone can run their own copy of Help Nearby for a city, region or community. You need free accounts on GitHub, [Supabase](https://supabase.com/) and [Vercel](https://vercel.com/).

1. **Fork the repository** (or use it as a template) on GitHub.
2. **Create a Supabase project** at [supabase.com](https://supabase.com/). Note the project URL, the `anon` key and the `service_role` key (Project Settings → API).
3. **Run the SQL.** In Supabase → SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql) on the empty project. Optionally run [`supabase/seed_demo.sql`](supabase/seed_demo.sql) too: it adds three fictional example organizations that you should delete or replace.
4. **Set the environment variables** (Vercel → Project → Settings → Environment Variables, or `.env.local` locally). Keep the keys secret and never commit them.

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon (public) key |
   | `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only key used for moderation and counters |
   | `ADMIN_PASSWORD` | yes | Password for `/admin` |
   | `ADMIN_SESSION_SECRET` | yes | Random string of 32+ characters that signs the admin session cookie |
   | `NEXT_PUBLIC_SITE_NAME` | no | Site name in page metadata and the PWA manifest (default `Help Nearby`) |
   | `NEXT_PUBLIC_SITE_URL` | no | Canonical origin of your site, e.g. `https://help.example.org` |
   | `NEXT_PUBLIC_DEFAULT_LANGUAGE` | no | First-visit language: `en`, `ru`, `es`, `fr`, `de`, `zh`, `ar` (default `en`) |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | no | Public contact address shown in the footer and privacy page |
   | `NEXT_PUBLIC_MAP_CENTER` | no | Regional map center as `lat,lng` (reserved; the app currently starts from the visitor's own location) |
   | `NEXT_PUBLIC_MAP_ZOOM` | no | Initial map zoom, 1–19 (default `14`) |
   | `NEXT_PUBLIC_FOOTER_LINK_URL` | no | Project link in the footer (default: this repository) |
   | `DISABLE_PING` | no | `true` turns off the anonymous deployment ping (see [Privacy](#privacy-and-the-anonymous-ping)) |
   | `RELIEFWEB_APPNAME` | no | Your registered [ReliefWeb appname](https://apidoc.reliefweb.int/); without it ReliefWeb results are skipped |
   | `AITUNNEL_API_KEY`, `AITUNNEL_BASE_URL`, `AITUNNEL_MODEL` | no | Enable the experimental AI assistant |
   | `NEXT_PUBLIC_MAP_TILES_URL`, `NEXT_PUBLIC_MAP_TILES_ATTRIBUTION` | no | Custom map tile provider |
   | `DEBUG_TOKEN` | no | Enables the `/api/debug/sources` diagnostics route |

5. **Deploy on Vercel** (use the button above or import your fork), then **add organizations**: sign in at `/admin` to verify community submissions from `/submit`, or bulk-load rows by importing a CSV into the `organizations` table (Supabase → Table Editor → Insert → Import data from CSV; columns follow [`supabase/schema.sql`](supabase/schema.sql), set `verified` to `true`).

**Launched yours?** Write to hello@help-nearby.org or add a row to the table below with a pull request.

### Where it runs

| City | Country | Site | Run by |
|------|---------|------|--------|
| Wherever there is help within 15 km | — | [www.help-nearby.org](https://www.help-nearby.org/) | Pavel Izenkin |

### Privacy and the anonymous ping

- **Visitors:** the app uses cookie-less, aggregated page-view analytics on the main site and stores a language/theme preference in the browser only. See the in-app privacy page for details.
- **Anonymous deployment ping (copies only):** a copy of Help Nearby running on any domain other than `www.help-nearby.org` sends one request per day to `https://www.help-nearby.org/api/deployments` with exactly three fields: `domain` (the hostname of your site), `version` (the app version) and `timestamp`. It contains no visitor data, no search queries, no data about your visitors and no keys. Like any HTTP request it reaches our server from your server's IP address, which is used only for in-memory rate limiting and is not stored. It lets the project see how many copies are alive. The ping is sent by the daily Vercel cron in [`vercel.json`](vercel.json) through [`lib/ping.server.ts`](lib/ping.server.ts).
- **Turn it off:** set `DISABLE_PING=true` in your environment variables (or delete the cron entry in `vercel.json`).
- **Our side:** the receiving endpoint validates and rate-limits requests and stores only the domain, version, first-seen and last-seen times in a `deployments` table.

---

## Attribution / Авторство

**RU:** Проект распространяется под лицензией MIT. Запуск, изменение и использование для помощи людям разрешены. ЗАПРЕЩЕНО выдавать HelpNearby или его производные за собственную оригинальную разработку. Нельзя подавать его как свой проект на конкурсы, гранты, в программы поступления, в волонтёрские и любые другие организации. Это нарушение правил конкурсов и академической честности. Каждый запуск HelpNearby регистрируется (домен и версия, см. раздел Privacy): мы видим, где он работает. Присвоение авторства фиксируется, и мы сообщаем о нём организаторам конкурсов и программ. Обязательно сохраняйте файл LICENSE и подпись "Powered by HelpNearby" и указывайте, что ваш сайт основан на HelpNearby. Автор: Pavel Izenkin.

Подпись в футере («На основе HelpNearby, автор Pavel Izenkin») обязательна: она показывается на каждой копии автоматически, не отключается настройками, и удалять её нельзя.

**EN:** This project is released under the MIT license. Running, modifying and using it to help people is allowed. It is PROHIBITED to present HelpNearby or its derivatives as your own original work. Do not submit it as your own project to competitions, grants, admissions programs, volunteer or any other organizations. This violates competition rules and academic integrity. Every HelpNearby deployment is registered (domain and version, see Privacy): we can see where it runs. Misrepresenting authorship is documented and reported to the organizers of competitions and programs. You must keep the LICENSE file and the "Powered by HelpNearby" attribution, and state that your site is based on HelpNearby. Author: Pavel Izenkin.

The footer credit ("Based on HelpNearby by Pavel Izenkin") is mandatory: it is shown on every copy automatically, cannot be turned off by configuration, and must not be removed.

---

## Live deployment

| Environment | URL |
|-------------|-----|
| **Production (primary)** | [https://www.help-nearby.org/](https://www.help-nearby.org/) |

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

# AI chat (optional, server-side only — never expose to the client)
AITUNNEL_API_KEY=your-aitunnel-api-key
AITUNNEL_BASE_URL=https://api.aitunnel.ru/v1/
AITUNNEL_MODEL=gpt-6-luna

# Map tiles (optional — defaults to OpenStreetMap standard tiles)
# NEXT_PUBLIC_MAP_TILES_URL=https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=your-key
# NEXT_PUBLIC_MAP_TILES_ATTRIBUTION=&copy; MapTiler &copy; OpenStreetMap contributors

# Diagnostics (optional) — enables GET /api/debug/sources?token=...; the route returns 404 when unset
# DEBUG_TOKEN=a-long-random-string

# ReliefWeb humanitarian sources (optional — your registered ReliefWeb appname)
RELIEFWEB_APPNAME=your-reliefweb-appname

# Analytics: Vercel Web Analytics needs no environment variables (enable it in the Vercel project).
```

### GitHub Actions secrets

The `Supabase keepalive` workflow (`.github/workflows/keepalive.yml`) runs every 3 days (and on demand) to keep the Supabase project from being paused. Add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

The job fails if the REST request does not return HTTP 200.

> Never commit `.env.local` or secret keys to Git.

### 3. Database setup

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor (clean schema, all migrations combined). Optional example data: [`supabase/seed_demo.sql`](supabase/seed_demo.sql). The step-by-step migrations in `supabase/migrations/` and the regional `supabase/RUN_*.sql` seeds remain for the main site's history.

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
| `/api/verified-nearby` | HDX + GDHO + ReliefWeb organizations for a country (geocoded, radius-filtered) |
| `/api/emergency` | 24/7 Supabase + Overpass emergency list |
| `/api/route` | OSRM turn-by-turn routing |
| `/api/geocode` | Nominatim address → coordinates |
| `/api/geocode/reverse` | Coordinates → country |
| `/api/submit` | Public organization submissions |
| `/api/reviews` | Approved reviews (GET) / new review (POST) |
| `/api/chat` | AI assistant (AITunnel) |
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

**Pavel Izenkin** — 16 years old, Russia.

Built with support from the open-source community, OpenStreetMap contributors, Supabase, and AITunnel.

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
