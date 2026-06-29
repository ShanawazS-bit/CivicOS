<p align="center">
  <img
    src="./assets/2.png"
    alt="CivicOS Logo"
    width="180"
  />
</p>

<h1 align="center">CivicOS</h1>

<p align="center">
  <strong>AI-powered civic infrastructure intelligence for citizens, cities, utilities, and logistics teams.</strong>
</p>

<p align="center">
  One photo. One tap. Everything else automated.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PostGIS-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/MapLibre_GL-2D3748?style=for-the-badge" />
</p>

---

## Overview

CivicOS is an AI-powered platform that transforms a single photo into structured civic intelligence. Citizens report infrastructure issues in seconds, while municipalities, utilities, and logistics teams receive actionable, geospatially organized data without manual processing.

A pothole gets reported by 40 different people in a week. Each report is a separate ticket. The city sees a flood of noise. The pothole stays unfixed.

CivicOS is an attempt to fix that at the data layer. A citizen takes one photo. The system reads the GPS from the image metadata, runs the photo through Gemini AI for classification, checks whether someone already reported the same thing nearby, assigns it to the right ward, calculates a trust score, and delivers a single clean signal to an admin dashboard — not 40 duplicate ones.

The citizen does almost nothing. The city gets actionable intelligence.

---

## Live demo

**[civic-os-eight.vercel.app](https://civic-os-eight.vercel.app)**

The demo runs on Supabase with PostGIS and falls back to local demo data when the database isn't available, so the core flows always work.

---

## How the pipeline works

Here's what actually happens between "citizen taps submit" and "admin sees the report":

```
1. Citizen uploads a photo (or records a voice note)
         ↓
2. EXIF metadata is read — GPS coordinates are pulled directly from the image file
         ↓
3. Photo is sent to a Supabase Edge Function, which calls Gemini 2.5 Flash
         ↓
4. Gemini returns: issue type, severity, description, confidence score
         ↓
5. Trust score is calculated from AI confidence + GPS presence + geofence risk zone
         ↓
6. PostGIS runs ST_DWithin — if the same issue already exists within 50m, it's a duplicate and gets linked, not created
         ↓
7. Geofencing assigns a ward, validates the service boundary, and boosts urgency for high-risk zones
         ↓
8. Issue saves to Supabase and appears live in the admin dashboard via Realtime
         ↓
9. B2B layer checks whether the report overlaps with any planned utility excavation routes
```

That's the full thing. Most steps happen in under two seconds.

---

## The technologies, and why they were chosen

### Gemini 2.5 Flash — AI classification

Gemini 2.5 Flash is Google's fastest multimodal model, meaning it can understand both images and text. CivicOS sends it a photo and asks it to return structured JSON: what category of issue is this, how severe, what's a plain-English description, and how confident are you?

The "Flash" tier specifically was chosen over the heavier Pro models because this runs on every single report submission. Speed matters at that volume, and Flash still returns high enough confidence for civic infrastructure categories (potholes, water leaks, broken streetlights, drainage, dumping, graffiti — the usual suspects).

The Edge Function also caches results per image fingerprint + coordinates, so if the same image gets resubmitted during a demo, Gemini isn't called twice.

### EXIF GPS — location from the photo itself

Every photo taken on a modern smartphone embeds invisible metadata called EXIF data. One of the fields is GPS coordinates — the exact latitude and longitude of where the photo was taken.

CivicOS reads this automatically. The citizen doesn't have to type an address, pin a map, or describe their location. They take a photo and the location is already in it.

If EXIF GPS isn't available (some older phones, or photos shared through apps that strip metadata), the app falls back to the browser's geolocation API. If that also fails, a reasonable fallback coordinate is used so the flow doesn't break.

This is one of those small decisions that changes how the whole product feels. The friction of "describe where this is" is gone.

### PostGIS + ST_DWithin — spatial deduplication

PostGIS is an extension for PostgreSQL that teaches the database to understand geography. CivicOS uses it for one core problem: preventing duplicate reports from clogging the admin queue.

Every time a report comes in, the system runs a PostGIS query called `ST_DWithin` — which checks whether any existing, unresolved report of the same issue type exists within 50 meters of the new report's coordinates. If it finds one, the new submission gets linked to the existing issue instead of creating a fresh ticket.

50 meters is roughly the width of a city block. Two different people reporting the same water leak on the same street corner should create one work order, not two. PostGIS makes that happen at the database level, which is much more reliable than trying to do it in application code.

The same PostGIS infrastructure powers the dig-once feature — more on that below.

### Geofencing — routing reports to the right place

Geofences are invisible polygons drawn over the map. CivicOS uses them for three things:

- **Boundary validation** — if a report is submitted from outside the city's service area, it gets rejected before it even enters the database.
- **Ward routing** — a report in Ward Alpha goes to Ward Alpha's queue, not a general inbox. The ward ID is attached automatically based on where the GPS coordinates fall.
- **Risk zone boosting** — certain areas (flood-prone drainage zones, high-traffic junctions) are marked as high-risk. Reports from these zones get a trust score boost, which pushes them higher in the admin triage queue.

The geofence logic runs both client-side (for instant feedback in the UI) and at the database level through PostGIS triggers on the Supabase side.

### MapLibre GL — the map layer

MapLibre GL is an open-source library for rendering interactive maps in the browser using WebGL. It powers both the citizen-facing neighborhood map on the feed page and the municipal map in the admin dashboard.

It was chosen over Google Maps for a few reasons: no per-request billing (important for a public-facing civic product at scale), full support for custom data layers (ward boundaries, geofence overlays, issue clusters, utility dig routes), and complete control over visual style. The admin map renders live issue markers, geofence polygons, and road hazard overlays all at the same time.

### Supabase + Realtime — the backend

Supabase is the backend: PostgreSQL database, authentication, file storage, edge functions, and a realtime pub/sub layer all under one roof.

The Realtime piece is what makes the admin dashboard feel live. When a citizen submits a report, the admin dashboard updates without a page refresh — Supabase pushes the new row over a WebSocket connection the moment it's written. For a municipal operations context, this matters. You don't want a city worker refreshing their browser to see whether a new flood report just came in.

The PostGIS extension runs inside this same PostgreSQL instance, so all the spatial queries happen at the database level without needing a separate GIS server.

### Supabase Edge Functions (Deno) — server-side AI calls

Edge Functions are small server-side scripts that run on Supabase's infrastructure. CivicOS uses two:

- `analyze-image` — receives the photo, calls Gemini, returns structured classification data. Keeping this server-side means the Gemini API key never touches the client.
- `transit-friction` — a public API endpoint that returns a friction index for any GPS coordinate and radius. This is the B2B data product (see below).

Both run on Deno rather than Node.js, which is what Supabase Edge Functions use. Deno has better built-in TypeScript support and a smaller cold-start footprint.

---

## The dig-once idea

This is probably the most unusual part of CivicOS.

Cities frequently repave a road in the spring, then a telecoms company digs it up in the summer to lay fibre, and a water utility digs it up again in the autumn to replace a pipe. The road surface gets destroyed three times in a year. The city pays for premature repairs every time. Residents spend months navigating roadworks.

CivicOS has a table called `utility_plans` where private utilities can register upcoming excavation routes as geographic line strings — a line drawn along the road they plan to dig. The `find_dig_once_opportunities` function then runs a PostGIS spatial query to find active civic issues (water leaks, drainage problems, potholes) that overlap with those planned routes.

If a water utility is planning to dig on a street that already has three reported water leaks and two drainage issues, the system surfaces that overlap. The city and the utility can coordinate a single shared repair window. One trench, one traffic closure, one disruption.

The admin dashboard has a B2B mode toggle that shows this coordination layer, plus a transit friction API demo that shows what the road-risk data product looks like to a logistics company querying hazards near a route.

---

## Trust scoring — not all reports are equal

Every report gets a score from 0–100 before it reaches the admin queue. The formula:

```
trust = min(100, (gemini_confidence × 0.7) + gps_bonus + geofence_risk_boost)
```

- **Gemini confidence** is the model's own estimate of how accurately it classified the image.
- **GPS bonus** is added when the report includes verified location data rather than just a typed address.
- **Geofence risk boost** is applied when the coordinates fall inside a marked high-risk zone.

Reports are sorted by trust score in the admin dashboard. A blurry photo with no GPS from an unverified location sits at the bottom. A clear image with EXIF GPS from a known drainage problem zone goes to the top. Municipal teams shouldn't have to manually triage which reports deserve their attention first — the system does it.

The admin dashboard also shows a breakdown of all five dimensions of the trust matrix for any selected report: Gemini Vision Confidence, Geo-Spatial Plausibility, Geofence Risk Multiplier, Duplicate Suppression status, and Dispatch Urgency.

---

## Voice reporting

The report page supports voice input via the browser's Web Speech API. A citizen can describe an issue out loud instead of typing — the transcript goes through the same Gemini analysis pipeline as a photo. Useful for accessibility, and useful for people who don't want to type on mobile.

---

## Tech stack

| | What it is |
|---|---|
| **React 19 + TypeScript** | Frontend UI |
| **Vite 8** | Build tool and dev server |
| **Tailwind CSS 4** | Styling |
| **Radix UI + Framer Motion** | Accessible components and animations |
| **MapLibre GL + react-map-gl** | Interactive maps |
| **Supabase** | Database, auth, realtime, edge functions |
| **PostgreSQL + PostGIS** | Spatial queries, deduplication, geofencing |
| **Gemini 2.5 Flash** | AI image and voice classification |
| **Supabase Edge Functions (Deno)** | Server-side AI calls and friction API |
| **GeoJSON** | Map data format for all spatial layers |

---

## Running it locally

```bash
cd app
npm install
cp .env.example .env
```

Fill in `.env`:

```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_GEMINI_CACHE=true
```

```bash
npm run dev
npm run build
npm run lint
```

The app runs in demo mode without Supabase credentials. All core flows work against local fallback data.

---

## Supabase setup

Apply migrations in order:

```
001_issues.sql              → core table, spatial index, ST_DWithin dedup RPC
002_get_issues_coords.sql   → coordinate query RPC
003_geofencing.sql          → geofence table, ward routing, jurisdiction trigger
004_monetization.sql        → utility_plans, dig-once RPC, friction index RPC
```

Deploy edge functions:

```
analyze-image        → Gemini image classification
transit-friction     → road friction data API
```

Secrets needed:

```
GEMINI_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

---

## Project structure

```
app/
├── src/
│   ├── components/     # UI, maps, feed, admin rows, cluster detection
│   ├── data/           # Demo fallback issues
│   ├── lib/            # Supabase client, geofencing, Gemini cache, monetization
│   ├── pages/          # Home, Feed, Report, Admin, About
│   ├── services/       # Gemini, issue, trust score, impact score
│   └── types/          # Shared TypeScript types
supabase/
├── functions/
│   ├── analyze-image/
│   └── transit-friction/
└── migrations/
    ├── 001_issues.sql
    ├── 002_get_issues_coords.sql
    ├── 003_geofencing.sql
    └── 004_monetization.sql
docs/
└── PROJECT_SUMMARY.md
```

---

## What's next

The MVP is complete and demo-ready. The Supabase foundations are in place for a live deployment. What would make this production-ready:

- Tighter RLS policies (currently open for demo purposes)
- Authenticated reporter accounts with reputation scores
- Admin-only write access for status updates
- Rate limiting on Edge Functions
- Real cluster detection in PostGIS (currently demo-mode)
- WhatsApp ingestion for markets where that's the dominant channel
- Ward-level performance dashboards for department heads

The longer-term play is the data product: city infrastructure as a live graph that grows more valuable with every report, and a friction API that logistics and insurance companies can query against. CivicOS starts with one photo. The real product is what accumulates from a million of them.