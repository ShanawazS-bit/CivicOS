-- CivicOS: PostGIS + issues table + dedup RPC
-- Run in Supabase SQL Editor or via supabase db push

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.issues (
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

-- Returns existing issue id if duplicate within 50m (same type, not resolved)
CREATE OR REPLACE FUNCTION public.check_duplicate_issue(
    incoming_type TEXT,
    incoming_lng DOUBLE PRECISION,
    incoming_lat DOUBLE PRECISION
)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT id
    FROM public.issues
    WHERE issue_type = incoming_type
      AND status != 'resolved'
      AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(incoming_lng, incoming_lat), 4326)::geography,
          50
      )
    LIMIT 1;
$$;

-- Insert issue with point geometry from lat/lng
CREATE OR REPLACE FUNCTION public.create_issue(
    p_issue_type TEXT,
    p_severity TEXT,
    p_description TEXT,
    p_trust_score INT,
    p_confidence INT,
    p_image_url TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    new_id UUID;
    dup_id UUID;
BEGIN
    dup_id := public.check_duplicate_issue(p_issue_type, p_lng, p_lat);
    IF dup_id IS NOT NULL THEN
        RAISE EXCEPTION 'DUPLICATE_ISSUE:%', dup_id;
    END IF;

    INSERT INTO public.issues (
        issue_type, severity, description, trust_score, confidence, image_url, location
    ) VALUES (
        p_issue_type,
        p_severity,
        p_description,
        p_trust_score,
        p_confidence,
        p_image_url,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;

-- RLS: open read/write for hackathon MVP (tighten before production)
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.issues FOR UPDATE USING (true);
