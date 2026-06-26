# CivicOS Master Architecture, Hackathon & Continuity Guide

> **Source of truth** for product vision, 3-day hackathon execution, and AI handoff protocol.
> Agents: read `docs/PROJECT_MEMORY.md` first, then `docs/AI_HANDOFF.md`, then this file for full context.

---

# Product Requirement Document (PRD) & Product Architecture

## Project Name: CivicOS (Community Hero - Hyperlocal Problem Solver)

### Document Version: 1.0

### Date: June 2026

---

## 1. Executive Summary & Core Philosophy

### 1.1 Core Vision

CivicOS is an AI-powered civic intelligence network designed to help cities detect, verify, prioritize, and prevent infrastructure and community problems. It transitions the civic technology landscape away from passive "complaint reporting apps" (which suffer from high user churn and low municipal trust) into a live **Digital Twin of City Health**.

### 1.2 The Paradigm Shift

```text
Traditional:  Citizen -> Report -> Government (Black Box / Fragmented)
CivicOS:      Citizen -> AI Ingestion -> Community Validation -> Government Action -> Public Accountability -> Prediction
```

### 1.3 Solving the Two Core Failure Modes

1. **Signal Quality (The Government Problem):** Traditional systems fail because they flood city workers with up to 60% noise, 30% duplicates, and only 10% structured, actionable data. CivicOS filters, de-duplicates, and calculates an absolute **Final Trust Score** for every issue before it ever touches a municipal worker's desk.
2. **Citizen Retention (The User Problem):** Citizens stop using reporting apps when their reports drop into a bureaucratic black box. CivicOS treats every issue as a hyper-local micro-community hub and rewards users with emotional, tangible, and gamified **Impact Metrics** linked to real-world outcomes.

---

## 2. Platform Architecture: The 8-Layer Framework

### Layer 1: AI Report Creation (Frictionless Ingestion)

The application removes structural and literacy barriers by minimizing user cognitive load. The workflow is split into two primary, zero-friction paths:

* **The One-Click Camera Loop:** User opens the camera → takes a photo → hits done. The underlying multimodal vision models automatically extract, infer, and structure the data:

```json
{
  "issue_type": "Pothole",
  "severity": "High",
  "road_type": "Main Arterial Road",
  "location": { "lat": 22.7934, "lng": 86.2049 },
  "description": "Large pothole occupying approximately 40% of the active lane width."
}
```

* **Voice-First Native Reporting (Global South/India Optimization):** Users can upload a short audio note in localized dialects or mixed formats (e.g., Hinglish: *"Yeh drain teen din se overflow kar raha hai"*). An asynchronous speech-to-text pipeline parses the context, assigns the appropriate issue category, and extracts urgency metrics natively.

### Layer 2: The Trust Engine & Math Matrix

To prevent municipal skepticism, every incoming report is evaluated through a transparent mathematical trust matrix. A city administrator can set a slider on their dashboard to view only highly verified tickets (e.g., S_f ≥ 85%).

The **Final Trust Score (S_f)** is a weighted geometric mean of four vectors:

```text
S_f = (C_visual × C_location × R_user × V_community) ^ (1/4)
```

* **Visual Confidence (C_visual):** The confidence score output by the computer vision classification model (0.0 to 1.0). If an image is dark, blurry, or non-pertinent, C_visual → 0.
* **Location Confidence (C_location):** Cross-references mobile hardware GPS precision data against municipal asset registries.
* **User Reputation (R_user):** The reporting citizen's historical trust score (ranging from 0.1 to 1.0).
* **Community Verification (V_community):** Scales asymptotically based on community consensus:

```text
V_community = 1 - e^(-k · (V_up - V_down))
```

**Hackathon shortcut:** `trust_score = min(100, confidence × 0.7 + (gps ? 20 : 0))` until verification/reputation layers ship.

### Layer 3: Reporter Reputation System (Dual-Role Blueprint)

To scale accurately without collapsing into spam, the platform divides users into a self-regulating ecosystem of two roles:

1. **Scouts:** Users who actively discover and upload new issues.
2. **Auditors:** Users who complete micro-verification tasks.

| User Tier | Target Profile | System Influence |
| :--- | :--- | :--- |
| **Trusted Contributor (90–100)** | High past accuracy, active validator. | Instant ticket validation; bypasses initial queue. |
| **New User (50)** | Unverified or new account. | Limited to 3 active open tickets; requires community consensus. |
| **Frequent Spammer (<20)** | High rate of duplicates or false flags. | Automatic de-prioritization; shadow-ban on dashboard queues. |

### Layer 4: The Hyperlocal Community Layer

* **Issue Micro-Communities:** Individual issues have localized timelines, evidence uploads, and "Follow Update" notifications.
* **Your Area Health Feed:** Hyper-local feed displaying community fixes (e.g., "✓ Garbage cleared on 4th Street", "⚠ New water leak verified nearby").

### Layer 5: Government Accountability & Scorecards

Every issue features an immutable, public-facing timeline:

```text
Reported -> Verified -> Assigned -> In Progress -> Resolved
```

**Department Performance Scorecards:** Public dashboard ranking municipal departments by average resolution times (Roads, Water, Sanitation, Streetlights).

### Layer 6: Predictive City Intelligence

* **Infrastructure Failure Prediction:** Correlates simultaneous occurrences to forecast localized collapse risk.
* **Garbage Hotspot Prediction:** Seasonal/traffic-based waste overflow forecasting.
* **Grid Failure Inferences:** Sequential streetlight flickers → transformer fault inference.

**Hackathon mock:** If 3 pins overlap within ~100m on the admin map → flag "Imminent Infrastructure Failure" badge. No ML required.

### Layer 7: The B2G Revenue & Data Engine

Cross-subsidization: free citizen app, monetize B2G/B2B data streams:

* Logistics/Delivery APIs — live road health for fleet routing
* Utility Coordination — "Dig-Once" pipeline analytics
* Municipal SaaS Portal — admin consoles and predictive layers

### Layer 8: Next-Generation Differentiators

* **AI Repair Verification:** Before/after vision check before closing work orders.
* **WhatsApp Native Chatbots:** Photo + location pin → full AI pipeline via webhooks.
* **Emotional Impact Score:** Translate stats into human impact ("You saved 12,000 liters of water").

---

## 3. Implementation Blueprint & Phasing (3-Day Hackathon Fast-Track)

### Scope Constraints (The Hackathon Reality)

Do **not** build custom ML models or infrastructure routing systems. Build a **high-fidelity illusion of the platform** by focusing on:

* Frictionless data ingestion
* Real-time AI processing (Gemini structured JSON)
* Beautiful dashboard presentation

### Target Stack

React (Vite) + TypeScript + Tailwind CSS + Shadcn/ui + Supabase (PostGIS) + Gemini 2.5 Flash + react-map-gl

### 🗓️ Day 1: Ingestion, Database, & AI Pipeline

* **Hours 0–4: Database & PostGIS Setup**
    * Spin up a Supabase project. Enable the **PostGIS** extension.
    * Initialize `issues` table with `GEOMETRY(Point, 4326)`.
* **Hours 4–12: Gemini Multimodal Pipeline**
    * Edge Function accepting image + GPS metadata.
    * Gemini structured JSON schema output (`gemini-2.5-flash`).
* **Hours 12–18: Spatial De-duplication Logic**
    * Postgres RPC using `ST_DWithin` — same category within 50m → duplicate flag.

### 🗓️ Day 2: Dashboards & Interactive Features

* **Hours 18–26: Citizen Mobile-Responsive Feed**
    * Vite + Tailwind + Shadcn/ui mobile layout.
    * **Emotional Impact Scorecard** metrics.
* **Hours 26–36: Municipal OS Admin Dashboard**
    * Split-screen: live map + list sorted by **Final Trust Score**.
* **Hours 36–44: Simulated Intelligence Mocks**
    * **Voice Pipeline:** HTML5 Web Speech API → text → Gemini.
    * **Predictive Mock:** 3 overlapping pins → "Imminent Infrastructure Failure" badge.

### 🗓️ Day 3: Integration, Deployment & Continuity

* **Hours 44–50: Integration & Testing**
    * Frontend submission → Supabase → admin map realtime refresh.
* **Hours 50–68: Pitch Preparation**
    * Record 2-minute backup demo video.
    * Pitch theme: *"We aren't building a complaint box app; we are building an AI-powered operating system for city health."*

---

## 4. Database Schema Blueprint (PostgreSQL + PostGIS)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE public.issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    issue_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending'::text NOT NULL,
    trust_score INT DEFAULT 50 NOT NULL,
    confidence INT,
    image_url TEXT,
    location GEOMETRY(Point, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS issues_geo_idx ON public.issues USING gist(location);
```

### Gemini Structured Output Schema

```json
{
  "issue_type": "Pothole | Water Leakage | Broken Streetlight | Waste Accumulation | Drainage | Graffiti",
  "severity": "Low | Medium | High",
  "description": "Clean 2-sentence technical description of the visual damage.",
  "confidence_score": 85
}
```

### Dedup RPC (PostGIS)

```sql
SELECT id FROM public.issues
WHERE issue_type = $1
  AND status != 'resolved'
  AND ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
    50
  )
LIMIT 1;
```

---

## 5. AI Continuity System: Project Memory & Multi-Agent Handoff Protocol

### 5.1 Purpose

Ensure that any subsequent AI model, backend/frontend agent, or developer teammate can immediately resume work on CivicOS without needing access to stale or truncated chat conversation history.

**Project memory is permanent. Chats are disposable.**

### 5.2 Documentation Directory Architecture

```text
/docs
├── PROJECT_MEMORY.md      <- Global status anchor (read first)
├── AI_HANDOFF.md          <- Save-state for next session
├── PROJECT_VISION.md      <- Immutable product philosophy
├── ARCHITECTURE.md        <- System flow and stack
├── DATABASE.md            <- Schema and RPC hooks
├── API_SPEC.md            <- Edge functions and Gemini schemas
├── FEATURE_TRACKER.md     <- Completed / In Progress / Planned
├── SESSION_LOGS/          <- Per-session audit trail
│   └── session_001.md
├── DECISIONS/             <- Architecture Decision Records
│   └── ADR_001.md
└── DEMO_SCRIPT.md         <- Hackathon presentation narrative
```

Root protocol reference: `ai_handoff.md`

### 5.3 Core AI Resume Protocol

When initializing a new session, read in this order:

1. `docs/PROJECT_MEMORY.md` — stack, completion %, current phase
2. `docs/AI_HANDOFF.md` — exact blockers and next action
3. `docs/FEATURE_TRACKER.md` — feature flags
4. Latest `docs/SESSION_LOGS/session_*.md`
5. All `docs/DECISIONS/ADR_*.md`

Then continue development. No old chat history required.

### 5.4 Multi-Agent Work Allocation Matrix

| Agent | Scope | Updates |
| :--- | :--- | :--- |
| Product Architect | Requirements, roadmaps | `PROJECT_MEMORY.md` |
| Frontend Engineer | React, Tailwind, Shadcn | `SESSION_LOGS/` |
| Backend Engineer | PostGIS, Supabase, APIs | `DATABASE.md`, `API_SPEC.md` |
| AI Systems Engineer | Gemini prompts, trust logic | `DECISIONS/ADR_*.md` |

### 5.5 End-of-Session Synchronization Protocol

Before ending any session (~3 minutes):

1. Append `docs/SESSION_LOGS/session_NNN.md` — files changed, blockers, next steps
2. Update `docs/AI_HANDOFF.md` — save state for incoming agent
3. Update `docs/PROJECT_MEMORY.md` — compressed status
4. Update `docs/FEATURE_TRACKER.md` if features changed
5. Add ADR for any major technical decision

### 5.6 Emergency Recovery

If chat history is lost, provide new AI:

```text
docs/PROJECT_MEMORY.md
docs/AI_HANDOFF.md
Latest SESSION_LOG
docs/ARCHITECTURE.md
```

Ask: *"Continue CivicOS development from current state."*

---

## 6. Winning Demo Flow

1. **The Hook:** Cities drown in 60% noise, 30% duplicates, 10% signal.
2. **Zero-Friction Demo:** Live photo or voice clip → structured ticket in seconds.
3. **Executive View:** Admin dashboard — noise filtered by trust score + spatial dedup.
4. **Impact Close:** Citizen sees emotional impact metrics; admin sees cluster alert.

Pitch line: *"Cities do not need more reports. They need better signals."*
