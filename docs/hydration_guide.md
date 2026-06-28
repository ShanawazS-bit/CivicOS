# CivicOS Implementation Guide: Municipal Social Issues Ingestion

The active data source is `municipal_training_set_1100.csv`. CPGRAMS is no longer part of the ingestion strategy.

The pipeline reads municipal issue CSV records, normalizes each record with Gemini into the CivicOS issue taxonomy, generates synthetic coordinates inside the current Jamshedpur geofence, and hydrates the Supabase PostGIS backend.

## Target Schema

The existing `public.issues` table keeps the app-facing issue fields. Migration `supabase/migrations/005_municipal_hydration.sql` adds the source footprint field required by this ingestion path:

```sql
ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS meta_telemetry JSONB DEFAULT '{}'::jsonb;
```

The same migration adds `public.create_hydrated_issue(...)`, which inserts with `ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)`. Longitude stays first in all PostGIS point construction.

## Dataset Parser

The active controller is:

```bash
scripts/hydrate_municipal_social_issues.py
```

It reads CSV data lazily with pandas chunks. This avoids loading the full dataset and limits Gemini spend during testing.

The local dataset includes these columns:

- Identity/contact provenance: `report_id`, `resident_id`, `resident_name`, `resident_email`, `resident_phone`
- Issue content: `issue_type`, `issue_description`, `issue_status`, `municipal_department`
- Location footprint: `location_street_address`, `location_city`, `location_state`, `location_postal_code`, `location_country`, `latitude`, `longitude`
- Evidence and timing: `photo_url`, `report_datetime`, `resolution_datetime`, `resolution_notes`
- Scoring: `priority_level`, `priority_score`, `severity_score`, `area_importance`, `citizen_reports_count`

The parser also supports common alternate municipal column names:

- Issue text: `issue_description`, `description`, `complaint_description`, `problem_description`, `details`, `issue_details`, `complaint`, `text`, `summary`
- Category: `issue_type`, `issue_category`, `category`, `subcategory`, `type`, `problem_type`, `complaint_type`, `department`, `service`
- Location footprint: `location`, `address`, `area`, `ward`, `zone`, `neighborhood`, `locality`, `landmark`, `street`, `city`
- Optional metadata: `status`, `resolution_status`, `priority`, `severity`, `urgency`, `reported_date`, `created_at`, `latitude`, `longitude`

Source coordinates are treated as provenance only and stored under `meta_telemetry.location_footprint`. Inserted map coordinates are synthetic points constrained to the current Jamshedpur service boundary:

```text
latitude:  22.7800 to 22.8100
longitude: 86.1900 to 86.2200
```

## Taxonomy Mapping

Gemini must map municipal categories and descriptions to exactly one internal `issue_type`:

- `Pothole`
- `Water Leakage`
- `Broken Streetlight`
- `Waste Accumulation`
- `Drainage`
- `Illegal Dumping`

The prompt should handle municipal phrasing such as clogged drains, bad roads, street lamp failure, uncollected garbage, illegal debris dumping, sanitation overflow, water leakage, water logging, nullah/nala blocking, bijli/light outage, and civic cleanliness complaints.

The current dataset contains 1,100 records. The ingestion filter imports 801 records that map cleanly into the CivicOS taxonomy:

- `garbage`
- `pothole`
- `water_leakage`
- `streetlight`
- `drainage`
- `graffiti`
- `illegal-dumping`
- `water-leak`

It skips `noise`, `illegal_parking`, and generic `other` because the current app schema has no matching internal issue type for those categories.

## Usage

Install Python dependencies:

```bash
python3 -m pip install -r scripts/requirements-ingestion.txt
```

Verify local environment variables and Supabase connectivity:

```bash
python3 scripts/hydrate_municipal_social_issues.py --verify-connection
```

Run a no-Gemini smoke test:

```bash
python3 scripts/hydrate_municipal_social_issues.py municipal_social_issues.csv --dry-run --no-gemini --max-records 5
```

From the repo root, the CSV argument can be omitted because the script defaults to `municipal_training_set_1100.csv` when present:

```bash
python3 scripts/hydrate_municipal_social_issues.py --dry-run --no-gemini --max-records 5
```

Run a Gemini dry run:

```bash
python3 scripts/hydrate_municipal_social_issues.py municipal_training_set_1100.csv --dry-run --max-records 5
```

Insert a bounded production batch:

```bash
python3 scripts/hydrate_municipal_social_issues.py municipal_training_set_1100.csv --max-records 50
```

## Verification SQL

Use this query after insertion to confirm source telemetry and coordinate ordering:

```sql
SELECT
    id,
    issue_type,
    ST_X(location::geometry) AS longitude,
    ST_Y(location::geometry) AS latitude,
    trust_score,
    meta_telemetry
FROM public.issues
WHERE meta_telemetry->>'source' = 'Municipal Social Issues Dataset';
```

Expected coordinate ranges:

```sql
SELECT COUNT(*) AS outside_geofence_count
FROM public.issues
WHERE meta_telemetry->>'source' = 'Municipal Social Issues Dataset'
  AND NOT (
    ST_Y(location::geometry) BETWEEN 22.7800 AND 22.8100
    AND ST_X(location::geometry) BETWEEN 86.1900 AND 86.2200
  );
```
