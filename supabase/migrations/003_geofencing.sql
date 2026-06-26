-- CivicOS: geofencing, ward routing, and spatial risk boosts

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.geofences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    fence_type TEXT NOT NULL CHECK (fence_type IN ('boundary', 'ward', 'high_risk')),
    metadata JSONB DEFAULT '{}'::jsonb,
    polygon GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS geofences_geo_idx ON public.geofences USING gist(polygon);

ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES public.geofences(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS inside_jurisdiction BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS spatial_risk_boost INT DEFAULT 0;

CREATE OR REPLACE FUNCTION public.is_within_service_area(lat FLOAT, lng FLOAT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    point_geom GEOMETRY;
    inside BOOLEAN;
BEGIN
    point_geom := ST_SetSRID(ST_MakePoint(lng, lat), 4326);

    SELECT EXISTS (
        SELECT 1
        FROM public.geofences
        WHERE fence_type = 'boundary'
          AND ST_Contains(polygon, point_geom)
    ) INTO inside;

    RETURN inside;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_spatial_metadata_on_issue()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    found_ward_id UUID;
    high_risk_boost INT;
BEGIN
    SELECT id INTO found_ward_id
    FROM public.geofences
    WHERE fence_type = 'ward'
      AND ST_Contains(polygon, NEW.location)
    LIMIT 1;

    NEW.ward_id := found_ward_id;
    NEW.inside_jurisdiction := found_ward_id IS NOT NULL;

    SELECT COALESCE(SUM((metadata->>'risk_boost')::INT), 0) INTO high_risk_boost
    FROM public.geofences
    WHERE fence_type = 'high_risk'
      AND ST_Contains(polygon, NEW.location);

    NEW.spatial_risk_boost := high_risk_boost;
    IF high_risk_boost > 0 THEN
        NEW.trust_score := LEAST(100, NEW.trust_score + high_risk_boost);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ts_process_spatial_metadata ON public.issues;
CREATE TRIGGER ts_process_spatial_metadata
    BEFORE INSERT ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.process_spatial_metadata_on_issue();

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
    IF NOT public.is_within_service_area(p_lat, p_lng) THEN
        RAISE EXCEPTION 'OUTSIDE_SERVICE_AREA';
    END IF;

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

CREATE OR REPLACE FUNCTION public.get_issues_with_coords()
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    issue_type TEXT,
    severity TEXT,
    description TEXT,
    status TEXT,
    trust_score INT,
    confidence INT,
    image_url TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    ward_id UUID,
    ward_name TEXT,
    route_label TEXT,
    inside_jurisdiction BOOLEAN,
    spatial_risk_boost INT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        i.id,
        i.created_at,
        i.issue_type,
        i.severity,
        i.description,
        i.status,
        i.trust_score,
        i.confidence,
        i.image_url,
        ST_Y(i.location::geometry) AS lat,
        ST_X(i.location::geometry) AS lng,
        i.ward_id,
        w.name AS ward_name,
        w.metadata->>'route_label' AS route_label,
        i.inside_jurisdiction,
        i.spatial_risk_boost
    FROM public.issues i
    LEFT JOIN public.geofences w ON w.id = i.ward_id
    ORDER BY i.trust_score DESC;
$$;

INSERT INTO public.geofences (name, fence_type, metadata, polygon)
SELECT
    'Jamshedpur Core Service Boundary',
    'boundary',
    '{}'::jsonb,
    ST_Polygon(ST_GeomFromText('LINESTRING(86.19 22.78, 86.22 22.78, 86.22 22.81, 86.19 22.81, 86.19 22.78)'), 4326)
WHERE NOT EXISTS (
    SELECT 1 FROM public.geofences WHERE name = 'Jamshedpur Core Service Boundary'
);

INSERT INTO public.geofences (name, fence_type, metadata, polygon)
SELECT
    'Ward Alpha Central',
    'ward',
    '{"route_label":"Central Roads Desk"}'::jsonb,
    ST_Polygon(ST_GeomFromText('LINESTRING(86.19 22.78, 86.2055 22.78, 86.2055 22.81, 86.19 22.81, 86.19 22.78)'), 4326)
WHERE NOT EXISTS (
    SELECT 1 FROM public.geofences WHERE name = 'Ward Alpha Central'
);

INSERT INTO public.geofences (name, fence_type, metadata, polygon)
SELECT
    'Ward Beta Market Edge',
    'ward',
    '{"route_label":"Market Ward Operations"}'::jsonb,
    ST_Polygon(ST_GeomFromText('LINESTRING(86.2055 22.78, 86.22 22.78, 86.22 22.81, 86.2055 22.81, 86.2055 22.78)'), 4326)
WHERE NOT EXISTS (
    SELECT 1 FROM public.geofences WHERE name = 'Ward Beta Market Edge'
);

INSERT INTO public.geofences (name, fence_type, metadata, polygon)
SELECT
    'Drainage Vulnerability Zone',
    'high_risk',
    '{"risk_boost":15}'::jsonb,
    ST_Polygon(ST_GeomFromText('LINESTRING(86.2039 22.7928, 86.2060 22.7928, 86.2060 22.7944, 86.2039 22.7944, 86.2039 22.7928)'), 4326)
WHERE NOT EXISTS (
    SELECT 1 FROM public.geofences WHERE name = 'Drainage Vulnerability Zone'
);
