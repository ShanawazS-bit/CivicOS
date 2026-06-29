<p align="center">
  <img src="./assets/civicos-logo.png" alt="CivicOS product logo" width="220" />
</p>

<h1 align="center">CivicOS</h1>

<p align="center">
  AI-powered civic infrastructure intelligence for citizens, cities, utilities, and logistics teams.
</p>

<p align="center">
  <strong>One photo. One tap. Everything else automated.</strong>
</p>

<p align="center">
  <code>React</code> · <code>TypeScript</code> · <code>Vite</code> · <code>Tailwind CSS</code> · <code>Supabase</code> · <code>PostGIS</code> · <code>Gemini</code> · <code>MapLibre</code>
</p>

---

## GitHub README

### What Is CivicOS?

CivicOS is not a complaint portal. It is an AI-powered civic operating system that turns citizen-submitted photos, voice notes, and GPS points into verified municipal intelligence.

The system captures an infrastructure issue, classifies it with Gemini, calculates a trust score, checks for duplicates with PostGIS, enriches it with geofence/ward context, and streams it into a realtime admin dashboard for municipal action.

### Why It Matters

Cities do not need more unstructured reports. They need better signals.

CivicOS reduces civic noise by:

- Structuring messy photo and voice reports with AI.
- Preventing duplicate tickets through spatial matching.
- Routing issues by jurisdiction, ward, and risk zone.
- Prioritizing urgent reports through trust scoring.
- Showing administrators a live operational dashboard.
- Creating monetization paths through utility coordination and road-risk data APIs.

### Core Features

- **AI report ingestion:** Gemini classifies issue type, severity, description, and confidence.
- **Trust scoring:** Combines AI confidence, GPS presence, spatial risk, and dispatch context.
- **Spatial deduplication:** PostGIS `ST_DWithin` catches nearby duplicate reports.
- **Geofencing:** Service boundary validation, ward routing, and high-risk zone boosts.
- **Realtime admin dashboard:** Trust-sorted civic signals with map, detail panel, and cluster alerts.
- **Citizen feed:** Neighborhood health, impact scorecard, and nearby issue map.
- **Voice reporting:** Browser speech recognition converts spoken reports into AI-analyzed civic signals.
- **B2B monetization mode:** Dig-once utility coordination and road friction API demo.
- **Offline/demo resilience:** Demo data, fallback AI response, and local Gemini cache.

### Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router |
| UI | Radix UI primitives, lucide-react icons, Framer Motion |
| Maps | MapLibre GL, react-map-gl, GeoJSON |
| Backend | Supabase, PostgreSQL, PostGIS, Supabase Realtime |
| Edge Functions | Supabase Edge Functions running Deno |
| AI | Gemini 2.5 Flash structured JSON analysis |
| Data | PostGIS Points, Polygons, LineStrings, GIST spatial indexes |
| Tooling | npm, TypeScript build, Oxlint, Vite preview/dev server |

### Project Structure

```text
app/
├── src/
│   ├── components/      # Reusable UI, maps, feed, admin rows
│   ├── data/            # Demo issue data
│   ├── lib/             # Supabase client, geofencing, cache, monetization helpers
│   ├── pages/           # Home, Feed, Report, Admin, About
│   ├── services/        # Gemini, issue, impact, trust score services
│   └── types/           # Shared TypeScript types
supabase/
├── functions/           # Edge Functions
└── migrations/          # Postgres/PostGIS schema and RPCs
docs/
└── PROJECT_SUMMARY.md   # Full architecture and product documentation
```

### Quick Start

Install dependencies:

```bash
cd app
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Configure:

```text
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_CACHE=true
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

### Supabase Setup

Apply migrations in order:

```text
001_issues.sql
002_get_issues_coords.sql
003_geofencing.sql
004_monetization.sql
```

Deploy Edge Functions:

```text
analyze-image
transit-friction
```

Required Supabase/Gemini secrets:

```text
GEMINI_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### Main Product Flows

1. **Citizen submits issue:** Photo or voice report plus GPS.
2. **AI analyzes report:** Gemini returns structured civic issue metadata.
3. **Trust engine scores it:** Confidence, location, and risk zone context produce urgency.
4. **PostGIS checks duplicates:** Nearby same-type unresolved issues are linked instead of duplicated.
5. **Geofence enriches context:** Boundary, ward, route label, and high-risk zone are applied.
6. **Realtime dashboard updates:** Admins see trust-sorted issues and map intelligence.
7. **B2B layer monetizes data:** Utility projects and routing APIs use CivicOS as infrastructure metadata.

### Monetization

CivicOS includes two business paths:

- **Dig-Once Spatial Matchmaker:** Match planned private utility excavation routes with active civic issues so cities and utilities can coordinate one repair window.
- **Road Friction Data API:** Sell hazard metadata to logistics, fleet, insurance, and routing systems so they can avoid high-risk roads.

Implemented files:

- `app/src/lib/monetization.ts`
- `app/src/pages/AdminPage.tsx`
- `supabase/migrations/004_monetization.sql`
- `supabase/functions/transit-friction/index.ts`

### Current Status

This repository contains a high-fidelity MVP with both demo resilience and deployable Supabase foundations. It is ready for hackathon/demo presentation and structured for future production hardening.

---
