# Database Schema

> MVP schema per revised `guide.md`. Extended tables (profiles, verifications) deferred per ADR-003.

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## issues

```sql
CREATE TABLE public.issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    issue_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    trust_score INT DEFAULT 50 NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS issues_geo_idx ON public.issues USING gist(location);
```

### Optional columns (add when needed)

| Column | Purpose |
|--------|---------|
| confidence | Gemini visual confidence (trust score input) |
| image_url | Supabase Storage path |
| reporter_id | Auth user FK (deferred) |

## Spatial Deduplication RPC

```sql
-- check_duplicate_issue(incoming_type, lng, lat) → existing issue id or null
SELECT id FROM public.issues
WHERE issue_type = incoming_type
  AND status != 'resolved'
  AND ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(incoming_lng, incoming_lat), 4326)::geography,
    50
  )
LIMIT 1;
```

## Trust Score (hackathon formula)

```text
trust = min(100, (confidence * 0.7) + (gps_present ? 20 : 0))
```

Verification bonus (+2 per confirm) deferred until verification feature is built.

## Cluster Mock (frontend, not DB)

If 3+ issue pins overlap within close perimeter on map → show "Imminent Infrastructure Failure" badge.
