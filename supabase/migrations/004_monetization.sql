-- CivicOS monetization layer: dig-once coordination + transit friction API RPCs

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.utility_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    utility_type TEXT NOT NULL,
    planned_start_date DATE NOT NULL,
    route GEOMETRY(LineString, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS utility_plans_geo_idx ON public.utility_plans USING gist(route);
CREATE INDEX IF NOT EXISTS utility_plans_start_date_idx ON public.utility_plans (planned_start_date);

ALTER TABLE public.utility_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public utility plan read" ON public.utility_plans;
DROP POLICY IF EXISTS "Allow public utility plan insert" ON public.utility_plans;

CREATE POLICY "Allow public utility plan read" ON public.utility_plans FOR SELECT USING (true);
CREATE POLICY "Allow public utility plan insert" ON public.utility_plans FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.find_dig_once_opportunities(buffer_meters FLOAT DEFAULT 20)
RETURNS TABLE (
    opportunity_id UUID,
    issue_type TEXT,
    company_name TEXT,
    utility_type TEXT,
    planned_start_date DATE,
    street_description TEXT,
    distance_meters FLOAT,
    estimated_savings_usd INT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        i.id AS opportunity_id,
        i.issue_type,
        u.company_name,
        u.utility_type,
        u.planned_start_date,
        i.description AS street_description,
        ST_Distance(i.location::geography, u.route::geography) AS distance_meters,
        CASE
            WHEN i.issue_type = 'Water Leakage' THEN 45000
            WHEN i.issue_type = 'Drainage' THEN 38000
            WHEN i.issue_type = 'Pothole' THEN 28000
            ELSE 15000
        END AS estimated_savings_usd
    FROM public.issues i
    JOIN public.utility_plans u
      ON ST_DWithin(i.location::geography, u.route::geography, buffer_meters)
    WHERE i.status != 'resolved'
      AND i.issue_type IN ('Water Leakage', 'Drainage', 'Pothole')
      AND u.planned_start_date >= CURRENT_DATE
    ORDER BY estimated_savings_usd DESC, distance_meters ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_route_friction_index(
    target_lat FLOAT,
    target_lng FLOAT,
    radius_meters FLOAT DEFAULT 200
)
RETURNS TABLE (
    friction_index FLOAT,
    active_hazards_count INT,
    risk_factors TEXT[]
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    hazard_count INT := 0;
    calculated_index FLOAT := 1.0;
    factor_list TEXT[] := '{}';
BEGIN
    SELECT COUNT(*), COALESCE(ARRAY_AGG(DISTINCT issue_type), '{}')
    INTO hazard_count, factor_list
    FROM public.issues
    WHERE status != 'resolved'
      AND trust_score >= 70
      AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography,
          radius_meters
      );

    IF hazard_count > 0 THEN
        calculated_index := LEAST(2.5, 1.0 + (hazard_count * 0.3));
    END IF;

    RETURN QUERY SELECT calculated_index, COALESCE(hazard_count, 0), COALESCE(factor_list, '{}');
END;
$$;

INSERT INTO public.utility_plans (company_name, utility_type, planned_start_date, route)
SELECT
    'Jio Fiber',
    'Fiber Optic',
    CURRENT_DATE + INTERVAL '12 days',
    ST_GeomFromText('LINESTRING(86.1941 22.7964, 86.1992 22.7952, 86.2047 22.7939, 86.2101 22.7924, 86.2168 22.7912)', 4326)
WHERE NOT EXISTS (
    SELECT 1 FROM public.utility_plans WHERE company_name = 'Jio Fiber' AND utility_type = 'Fiber Optic'
);

INSERT INTO public.utility_plans (company_name, utility_type, planned_start_date, route)
SELECT
    'Tata Power',
    'Underground Power',
    CURRENT_DATE + INTERVAL '20 days',
    ST_GeomFromText('LINESTRING(86.2075 22.8081, 86.2068 22.8008, 86.2059 22.7935, 86.2047 22.7864, 86.2038 22.7812)', 4326)
WHERE NOT EXISTS (
    SELECT 1 FROM public.utility_plans WHERE company_name = 'Tata Power' AND utility_type = 'Underground Power'
);
