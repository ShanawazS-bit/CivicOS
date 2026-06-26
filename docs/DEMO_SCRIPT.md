# Demo Script

Duration: ~2 minutes

Theme: *We aren't building a complaint box app; we are building an AI-powered operating system for city health.*

Pitch close: *Cities do not need more reports. They need better signals.*

---

## Pre-Demo Checklist

- [ ] Supabase migrations 001 + 002 applied
- [ ] `app/.env` configured (no demo banner)
- [ ] `GEMINI_API_KEY` set on edge function
- [ ] Record backup video before live presentation
- [ ] Mobile viewport — bottom nav visible, editorial red/dark theme

---

## Live Demo Flow (90–120 sec)

### 1. Hook (10 sec)
"Cities drown in noise — 60% junk, 30% duplicates, 10% signal. CivicOS fixes that."

### 2. Citizen Report (25 sec)
- Open **Report** tab (bottom nav)
- Take/upload photo of infrastructure issue
- Show Gemini classification + trust score on review card
- Submit → "View Neighborhood Feed"

### 3. Community Impact (20 sec)
- **Feed** tab — Emotional Impact Scorecard
- Area Health Feed updates
- Mini map with severity pins

### 4. Municipal Triage (25 sec)
- **Admin** tab — trust threshold slider (set to 85)
- Show filtered high-trust issues only
- Click pin ↔ list sync
- Cluster alert: "Imminent Infrastructure Failure"

### 5. Resolution (15 sec)
- Mark issue **Resolved** on admin
- Return to Feed — status updates in health feed

### 6. Optional Wow (10 sec)
- Voice report on Report tab (Web Speech API)

---

## Pitch Deck Outline (5 slides)

1. **Problem** — Black box reporting, duplicate floods, unstructured data
2. **Solution** — CivicOS pipeline: AI → Trust → Dedup → Dashboard
3. **Demo screenshot** — Editorial UI, trust-sorted admin
4. **Traction** — PostGIS dedup, Gemini structured JSON, realtime
5. **Vision** — Digital twin of city health, B2G SaaS + data layer

---

## Backup

Record full flow as 2-minute video. If APIs fail live, play video and narrate.
