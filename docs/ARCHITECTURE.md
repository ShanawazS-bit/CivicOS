# Architecture

## Hackathon Scope

Build a **high-fidelity illusion** — frictionless ingestion, real-time AI, beautiful dashboard. No custom ML or infrastructure routing.

## System Flow

```text
Citizen App (mobile-first)
    │
    ▼
Photo + GPS capture
    │
    ▼
Gemini Edge Function (structured JSON)
    │
    ▼
Trust Score calculation
    │
    ▼
PostGIS dedup check (ST_DWithin 50m)
    │
    ▼
Supabase `issues` table
    │
    ▼
Realtime → Admin Dashboard (map + list by trust score)
```

## Frontend (`/app`)

- React + Vite + TypeScript + Tailwind + Shadcn/ui
- Mobile citizen feed + Emotional Impact Scorecard
- Admin split view: react-map-gl map + trust-sorted issue list
- Voice: browser Web Speech API → text → Gemini
- Cluster mock: frontend rule when 3 pins overlap

## Backend (Supabase)

- PostgreSQL + PostGIS
- Single MVP table: `issues` (+ spatial GIST index)
- Edge Function: `analyze-image` (Gemini 2.5 Flash)
- RPC: `check_duplicate_issue` (ST_DWithin)
- Realtime on `issues` for live admin refresh

## Deferred

- Auth / profiles / verifications (ADR-003)
- Real ML cluster detection
- Custom STT pipeline

## Directory Layout

```text
app/src/
├── components/
├── pages/          # citizen feed, report, admin dashboard
├── lib/            # supabase client, utils
├── services/       # issueService, trustScore
└── types/
supabase/
├── migrations/
└── functions/analyze-image/
docs/               # project memory (source of truth)
```
