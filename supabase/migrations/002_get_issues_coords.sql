-- Returns issues with lat/lng extracted from PostGIS geometry
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
    lng DOUBLE PRECISION
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
        ST_X(i.location::geometry) AS lng
    FROM public.issues i
    ORDER BY i.trust_score DESC;
$$;
