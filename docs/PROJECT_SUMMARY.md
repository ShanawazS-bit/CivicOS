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

# CivicOS Complete Project Summary

## 1. Project Identity

CivicOS is an AI-powered civic infrastructure intelligence system. It is not designed as another complaint portal or ticketing tool. The core idea is to turn unstructured citizen observations into verified, deduplicated, geospatially meaningful municipal signals.

The product thesis is:

```text
One photo.
One tap.
Everything else automated.
```

CivicOS captures a civic issue, analyzes it with AI, verifies its location, checks whether it duplicates an existing report, assigns it to the correct municipal context, calculates trust and urgency, and presents it to administrators as an operational dashboard.

The long-term vision is to become a civic operating system: a live infrastructure health layer for cities, utilities, logistics companies, and public agencies.

## 2. Core Problem

Cities receive civic issue data through fragmented channels: phone calls, WhatsApp messages, forms, social media, manual inspections, and disconnected department workflows. This creates several failures:

- Too many low-quality or incomplete reports.
- Duplicate complaints about the same physical issue.
- Unstructured photo/text evidence that is hard to triage.
- No trust score for deciding what should be acted on first.
- Weak spatial routing between citizen reports and municipal responsibility.
- No real-time map of neighborhood infrastructure health.
- Limited coordination between public works and private utility excavation.

CivicOS addresses these by creating a structured intelligence pipeline from citizen input to municipal action.

## 3. Product Approach

The project is built around a high-fidelity hackathon MVP approach: make the most important workflow feel complete, automated, and real without overbuilding systems that are not needed for the demo.

The chosen scope emphasizes:

- Frictionless citizen ingestion.
- Gemini-powered classification and trust scoring.
- Geospatial deduplication with PostGIS.
- Realtime issue feed and admin dashboard.
- Geofenced jurisdiction and ward routing.
- Visual clarity through an editorial/SaaS interface.
- Monetization proof through B2B infrastructure coordination and DaaS.

The system is intentionally modular. Frontend demo data allows reliable offline presentation, while Supabase migrations and Edge Functions provide a path to live deployment.

## 4. Main User Workflows

### Citizen Reporting

Citizens can submit civic issues from the mobile-first report flow.

Implemented behavior:

- Upload or capture an image.
- Capture GPS coordinates through the browser geolocation API.
- Fall back to demo coordinates around Jamshedpur if GPS fails.
- Analyze the image through the Supabase `analyze-image` Edge Function.
- Use Gemini to classify issue type, severity, confidence, and description.
- Calculate a trust score from AI confidence and GPS presence.
- Apply geofence risk boosts when reports fall in high-risk zones.
- Reject or flag reports outside the service boundary.
- Detect duplicates through a PostGIS `ST_DWithin` query.
- Save valid issues to Supabase.
- Increment local user impact metrics after successful submission.

Files:

- `app/src/pages/ReportPage.tsx`
- `app/src/services/geminiService.ts`
- `app/src/services/issueService.ts`
- `app/src/services/trustScore.ts`
- `app/src/lib/geofencing.ts`

### Voice Reporting

The report page also supports voice input.

Implemented behavior:

- Uses the browser Web Speech API through `SpeechRecognition` / `webkitSpeechRecognition`.
- Captures spoken issue descriptions.
- Sends transcript text through the same analysis pathway.
- Uses geofence checks before accepting the voice report.
- Falls back with a user-facing error if voice recognition is unavailable.

This keeps the product accessible for users who may not want to type detailed civic reports on mobile.

### Neighborhood Feed

The feed page shows the citizen-facing view of area health.

Implemented behavior:

- Fetches live or demo issues.
- Subscribes to Supabase realtime updates.
- Shows an impact scorecard.
- Displays a geospatial map using lazy-loaded `IssueMap`.
- Shows a neighborhood issue feed.
- Provides a direct CTA back to reporting.

Files:

- `app/src/pages/FeedPage.tsx`
- `app/src/components/ImpactScorecard.tsx`
- `app/src/components/NeighborhoodFeed.tsx`
- `app/src/components/IssueMap.tsx`
- `app/src/services/impactScore.ts`

### Municipal Admin Dashboard

The admin dashboard is the operations view for civic teams.

Implemented behavior:

- Trust-sorted issue queue.
- Selected issue inspection panel.
- Live clock and active signal count.
- Mock municipal map with geofences, roads, issue markers, and cluster alerts.
- Issue detail view with evidence, Gemini parsed payload, trust matrix, status, location, ward routing, risk boost, dispatch status, and SLA.
- Dispatch/B2B mode toggle.

Files:

- `app/src/pages/AdminPage.tsx`
- `app/src/components/AdminIncidentRow.tsx`
- `app/src/lib/clusterDetection.ts`

### About / System Explanation

The About page explains the product as an intelligence pipeline, not a complaint app.

Implemented concepts include:

- AI ingestion.
- Trust engine.
- Geofence and ward routing.
- Network/duplicate suppression.
- System architecture storytelling.
- Visual sections with motion and spatial diagrams.

Files:

- `app/src/pages/AboutPage.tsx`
- `app/src/components/ImageRiskTimeline.tsx`
- `app/src/lib/preloadAboutExperience.ts`

## 5. AI Layer

CivicOS uses Gemini through a Supabase Edge Function.

### Edge Function: `analyze-image`

Location:

- `supabase/functions/analyze-image/index.ts`

Responsibilities:

- Accept image payloads from the client.
- Call Gemini 2.5 Flash when `GEMINI_API_KEY` is configured.
- Request structured JSON output.
- Return:
  - `issue_type`
  - `severity`
  - `description`
  - `confidence_score`
  - `trust_score`
- Provide a mock response if no Gemini key is configured.

The Gemini prompt restricts issue categories to civic infrastructure types such as:

- Pothole
- Water Leakage
- Broken Streetlight
- Waste Accumulation
- Drainage
- Graffiti
- Illegal Dumping

### Client Gemini Service

Location:

- `app/src/services/geminiService.ts`

Responsibilities:

- Invoke Supabase Edge Functions.
- Cache repeated image and voice analysis results.
- Provide offline/dev fallback analysis.
- Wrap image and voice analysis in a consistent response shape.

### Gemini Cache

Location:

- `app/src/lib/geminiCache.ts`

Purpose:

- Prevent repeated network calls for the same image/GPS pair.
- Improve development speed during refresh/HMR.
- Keep demos resilient.

Cache behavior:

- Image analysis keys are based on image fingerprint plus coordinates.
- Voice analysis keys are based on transcript plus coordinates.
- Can be disabled through `VITE_GEMINI_CACHE=false`.

## 6. Trust Score System

The MVP trust score is intentionally simple and explainable for a hackathon demo.

Base formula:

```text
trust = min(100, confidence * 0.7 + gps_bonus)
```

Where:

- AI confidence comes from Gemini.
- GPS bonus is applied when location is present.
- Geofence risk boost can increase urgency.
- Duplicate reports are blocked or routed to an existing issue.

Additional trust matrix dimensions are visualized in the admin dashboard:

- Gemini Vision Confidence
- Geo-Spatial Plausibility
- Geofence Risk Multiplier
- Duplicate Suppression
- Dispatch Urgency

Future trust expansion could include:

- Reporter reputation.
- Community verification.
- Department response history.
- Image tamper detection.
- Temporal recurrence.
- Cross-source confirmation.

## 7. Geospatial System

Geospatial logic is central to CivicOS. The project uses both client-side geometry helpers and database-level PostGIS.

### Client Geofencing

Location:

- `app/src/lib/geofencing.ts`

Implemented geofences:

- `Jamshedpur Core Service Boundary`
- `Ward Alpha Central`
- `Ward Beta Market Edge`
- `Drainage Vulnerability Zone`

Client responsibilities:

- Check whether a report is inside the service boundary.
- Assign ward context.
- Assign route labels for municipal operations.
- Detect high-risk zones.
- Apply bounded risk boost.
- Convert geofence definitions to GeoJSON for map rendering.

### Database Geofencing

Location:

- `supabase/migrations/003_geofencing.sql`

Implemented database objects:

- `geofences` table.
- `is_within_service_area(lat, lng)` RPC.
- `process_spatial_metadata_on_issue()` trigger.
- Added issue columns:
  - `ward_id`
  - `inside_jurisdiction`
  - `spatial_risk_boost`
- Updated `create_issue` RPC to reject outside-boundary reports.
- Updated `get_issues_with_coords` to return ward and geofence metadata.

PostGIS functions used:

- `ST_Contains`
- `ST_SetSRID`
- `ST_MakePoint`
- `ST_Polygon`
- `ST_GeomFromText`

## 8. Deduplication and Cluster Detection

### Spatial Deduplication

Location:

- `supabase/migrations/001_issues.sql`

RPC:

- `check_duplicate_issue(incoming_type, incoming_lng, incoming_lat)`

Logic:

- Match same issue type.
- Exclude resolved issues.
- Use `ST_DWithin` against existing issue geometry.
- Default duplicate radius: 50 meters.
- Return existing issue ID if found.

This prevents the system from becoming a noisy complaint counter.

### Frontend Cluster Detection

Location:

- `app/src/lib/clusterDetection.ts`

Purpose:

- Provide a demo-ready cluster alert when multiple nearby issues overlap.
- Power the admin "Cluster Alert" visual.
- Support the pitch that CivicOS identifies infrastructure failure patterns, not only individual tickets.

## 9. Database and Supabase Backend

The backend is Supabase with PostgreSQL and PostGIS.

### Main Tables

#### `issues`

Defined in:

- `supabase/migrations/001_issues.sql`

Core columns:

- `id`
- `created_at`
- `issue_type`
- `severity`
- `description`
- `status`
- `trust_score`
- `confidence`
- `image_url`
- `location GEOMETRY(Point, 4326)`

Spatial index:

- `issues_geo_idx` using GIST.

Realtime:

- `issues` table is added to `supabase_realtime`.

Policies:

- Public read, insert, and update policies for hackathon MVP.
- These should be tightened before production.

#### `geofences`

Defined in:

- `supabase/migrations/003_geofencing.sql`

Purpose:

- Store boundary, ward, and high-risk polygons.

#### `utility_plans`

Defined in:

- `supabase/migrations/004_monetization.sql`

Purpose:

- Store upcoming private utility work as PostGIS LineStrings.
- Support the B2B "dig-once" coordination business model.

Columns:

- `id`
- `company_name`
- `utility_type`
- `planned_start_date`
- `route GEOMETRY(LineString, 4326)`
- `created_at`

Spatial index:

- `utility_plans_geo_idx` using GIST.

### Main RPCs

Implemented RPCs:

- `check_duplicate_issue`
- `create_issue`
- `get_issues_with_coords`
- `is_within_service_area`
- `find_dig_once_opportunities`
- `get_route_friction_index`

## 10. API and Edge Functions

### Supabase Client Calls

The app uses `@supabase/supabase-js` through:

- `app/src/lib/supabase.ts`

Environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If not configured, the app logs a warning and uses placeholder values, then falls back to demo data.

### `analyze-image`

Location:

- `supabase/functions/analyze-image/index.ts`

Used by:

- `app/src/services/geminiService.ts`

### `transit-friction`

Location:

- `supabase/functions/transit-friction/index.ts`

Purpose:

- Expose a route friction score for third-party fleet/logistics systems.

Query pattern:

```text
GET /functions/v1/transit-friction?lat=22.7934&lng=86.2049&radius=200
```

Returns:

- `friction_index`
- `active_hazards_count`
- `risk_factors`
- `source`

If Supabase service credentials are not configured, it returns a mock response for demos.

## 11. Monetization Strategy

CivicOS includes two monetization directions, both implemented as demo-ready product surfaces and backend foundations.

### Product 1: Dig-Once Spatial Matchmaker

The idea:

When cities repave roads and private utilities dig soon after, the road surface is degraded and the city pays for premature repairs. CivicOS can coordinate public issues and private utility plans before excavation happens.

Implemented backend:

- `utility_plans` table.
- `find_dig_once_opportunities(buffer_meters)` RPC.
- Uses `ST_DWithin` to find active civic issues near planned utility LineStrings.
- Focuses on excavation-triggering issue types:
  - Water Leakage
  - Drainage
  - Pothole

Implemented frontend:

- B2B mode toggle in Admin dashboard.
- Utility route overlays.
- Dig-once opportunity badge.
- Revenue intelligence sidebar.
- Savings pipeline total.
- Joint project count.

Files:

- `app/src/pages/AdminPage.tsx`
- `app/src/lib/monetization.ts`
- `supabase/migrations/004_monetization.sql`

### Product 2: Road Friction Data API

The idea:

CivicOS does not need to build a navigation app. It can sell map metadata to existing logistics, fleet, insurance, and routing systems.

Example:

```text
Fleet route engine calls CivicOS.
CivicOS returns road friction near a waypoint.
Fleet avoids high-risk roads or prices the risk.
```

Implemented backend:

- `get_route_friction_index(target_lat, target_lng, radius_meters)` RPC.
- `transit-friction` Supabase Edge Function.
- Counts active high-trust hazards near a coordinate.
- Returns a friction multiplier between 1.0 and 2.5.

Implemented frontend:

- Transit API sample in the B2B sidebar.
- Displays friction index, active hazards, and radius.

## 12. Frontend Architecture

Frontend stack:

- React 19
- Vite 8
- TypeScript
- Tailwind CSS 4
- React Router
- Radix UI primitives
- lucide-react icons
- Framer Motion
- MapLibre / react-map-gl
- Spline runtime for rich visual scenes

Directory layout:

```text
app/src/
├── components/
├── data/
├── lib/
├── pages/
├── services/
├── types/
├── App.tsx
├── main.tsx
└── index.css
```

Routing:

- `/`
- `/home`
- `/feed`
- `/report`
- `/admin`
- `/about`

The app uses lazy loading for heavier surfaces such as:

- Feed page map.
- Admin page.
- About page.

This keeps the initial app experience lighter while allowing rich pages later.

## 13. Design System

The visual system is a high-contrast editorial newsroom/SaaS hybrid.

Core traits:

- Bold typography.
- Red signal color.
- Black/white/neutral surfaces.
- Dense but scannable operational layouts.
- Mobile-first citizen experience.
- Dashboard-oriented admin experience.

Key colors:

- Brand Red: `#E11D2E`
- Dark Background: `#111111`
- Editorial Neutral: `#F2F1EE`
- White: `#FFFFFF`
- Medium Gray: `#4A4A4A`

Design principles:

- Use red only for signal, urgency, and active system elements.
- Keep admin interfaces dense but organized.
- Avoid making the app feel like a generic complaint form.
- Present civic data as intelligence, not raw tickets.
- Use icons for tools and navigation clarity.

Relevant files:

- `docs/STYLES.md`
- `app/src/index.css`
- `app/src/components/ui/*`
- `app/src/components/BottomNav.tsx`
- `app/src/components/EditorialPageShell.tsx`
- `app/src/components/EditorialTopNav.tsx`

## 14. Demo and Offline Resilience

The project is designed to demo reliably even when live services are unavailable.

Offline/demo support:

- `DEMO_ISSUES` fallback data.
- Gemini mock response if API key is missing.
- Supabase connection check falls back to demo mode.
- Local Gemini cache prevents repeated network calls.
- Admin map uses a custom mock visual canvas for reliable presentation.
- B2B monetization data is available from `app/src/lib/monetization.ts`.

Demo flow:

1. Show the product positioning: intelligence network, not complaint portal.
2. Submit a citizen report.
3. Show Gemini classification and trust score.
4. Show neighborhood feed and impact scorecard.
5. Open admin dashboard and show trust-sorted triage.
6. Show geofence routing and cluster alert.
7. Switch to B2B mode and show monetization through dig-once coordination and transit friction API.

## 15. Current Implemented Features

Implemented product features:

- Home page.
- Feed page.
- Report page.
- Admin dashboard.
- About/system explanation page.
- Bottom navigation.
- Editorial top navigation.
- Image upload report flow.
- Voice report flow.
- Gemini AI analysis.
- Gemini local cache.
- Trust score calculation.
- Geofence boundary validation.
- Ward assignment.
- High-risk zone boost.
- Duplicate detection.
- Supabase issue creation.
- Supabase realtime subscription.
- Demo issue fallback.
- Neighborhood impact scorecard.
- MapLibre issue map.
- Admin mock municipal map.
- Cluster alert.
- B2B infrastructure coordinator mode.
- Dig-once opportunity visualization.
- Transit friction API sample.
- Supabase migrations for issues, coords, geofencing, and monetization.
- Edge functions for AI image analysis and transit friction.

## 16. Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Radix UI
- lucide-react
- Framer Motion
- MapLibre GL
- react-map-gl
- Spline runtime

### Backend

- Supabase
- PostgreSQL
- PostGIS
- Supabase Realtime
- Supabase Edge Functions
- Row Level Security policies for MVP access

### AI

- Gemini 2.5 Flash through Google Generative Language API.
- Structured JSON response schema.
- Local development fallback response.
- Client-side caching layer.

### Geospatial

- PostGIS geometry columns.
- GIST spatial indexes.
- `ST_DWithin` for duplicates and opportunity matching.
- `ST_Contains` for geofencing.
- LineString utility routes.
- Point-in-polygon client helper.
- GeoJSON feature conversion for map layers.

### Tooling

- npm scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run lint`
  - `npm run preview`
- TypeScript project references.
- Oxlint.
- Vite production builds.

## 17. Security and Production Notes

Current MVP choices are optimized for hackathon speed.

Before production:

- Tighten Supabase RLS policies.
- Add authenticated reporter accounts.
- Add admin-only access for municipal dashboards.
- Restrict status updates to authorized users.
- Move any sensitive moderation logic server-side.
- Add rate limits to Edge Functions.
- Add image storage validation.
- Add abuse detection for spam reports.
- Add audit logs for admin changes.
- Add proper secrets management for Gemini and Supabase service role keys.

## 18. Future Roadmap

Near-term improvements:

- Final live Supabase deployment.
- End-to-end testing against live database.
- Pitch deck and demo video.
- Cleaner admin responsive states.
- Better admin filtering by ward/status/trust threshold.
- Status update controls.
- More robust voice report support.

Medium-term roadmap:

- User accounts and reporter reputation.
- Community verification.
- WhatsApp ingestion.
- Department workflow assignment.
- SLA tracking.
- Notification system.
- Image storage and evidence archive.
- Real cluster detection in PostGIS.
- Historical issue recurrence analytics.
- Ward-level performance dashboards.

Long-term roadmap:

- City infrastructure digital twin.
- Predictive maintenance.
- Utility/city coordination marketplace.
- Paid DaaS road-risk API.
- Insurance and fleet risk integrations.
- Multi-city geofence and department templates.

## 19. Strategic Summary

CivicOS is built around one strong strategic insight: cities do not need more reports; they need better signals.

The citizen side removes friction. The AI layer structures messy input. The geospatial layer turns coordinates into operational meaning. The trust layer helps decide what matters. The admin dashboard turns reports into triage. The monetization layer turns civic intelligence into economic value through utility coordination and road-risk metadata.

Together, these pieces position CivicOS as:

- A civic reporting interface for residents.
- A municipal intelligence dashboard for city teams.
- A geospatial coordination layer for utilities.
- A data product for logistics and risk-aware routing.

That combination is the project edge: CivicOS starts with one photo, but the real product is the infrastructure intelligence graph that grows from it.
