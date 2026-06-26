# Project Memory

Project:
CivicOS (Community Hero - Hyperlocal Problem Solver)

Current Status:
55%

Current Phase:
Day 3 — Pitch Preparation & Backup Recording

Design System:
`docs/STYLES.md` — Editorial Newsroom (brand-red #E11D2E, brand-dark #111111, bottom nav 83px)

Core Vision:
AI-powered civic intelligence network — Digital Twin of City Health.

Hackathon Constraint:
High-fidelity illusion. No custom ML. Gemini + PostGIS + beautiful dashboards.

Current Stack:
React (Vite) / TypeScript / Tailwind / Shadcn / Supabase / PostGIS / Gemini 2.5 Flash / react-map-gl

Completed Features:
- Master `guide.md` (PRD + 3-day plan + continuity protocol)
- `/docs` memory architecture
- React/Vite scaffold + deps in `/app`

In Progress:
- Tailwind + router wiring
- Supabase migration (`issues` + dedup RPC)
- Supabase client + `.env.example`

Next Priority:
- Gemini Edge Function (analyze-image)
- Issue creation flow
- Trust score calculation

Source of Truth:
- `guide.md` — full product + hackathon + handoff
- `docs/AI_HANDOFF.md` — operational save-state

Known Risks:
- Supabase credentials not configured yet
- Live demo API failures → backup video Day 3
