-- CivicOS: Municipal Social Issues Dataset hydration support

ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS meta_telemetry JSONB DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.create_hydrated_issue(
    p_issue_type TEXT,
    p_severity TEXT,
    p_description TEXT,
    p_trust_score INT,
    p_confidence INT,
    p_image_url TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_meta_telemetry JSONB DEFAULT '{}'::jsonb
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
        issue_type,
        severity,
        description,
        status,
        trust_score,
        confidence,
        image_url,
        location,
        meta_telemetry
    ) VALUES (
        p_issue_type,
        p_severity,
        p_description,
        'open',
        p_trust_score,
        p_confidence,
        p_image_url,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
        COALESCE(p_meta_telemetry, '{}'::jsonb)
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;
