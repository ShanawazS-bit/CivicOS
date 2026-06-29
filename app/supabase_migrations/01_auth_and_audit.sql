-- Create the audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL, -- references auth.users(id) conceptually, but keeping it generic for demo
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to read audit logs
CREATE POLICY "Authenticated users can view audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- Note: we assume the 'issues' table's 'status' column is a text column or an enum
-- If it's an enum, we might need to add the 'dismissed' value to it:
-- ALTER TYPE issue_status ADD VALUE IF NOT EXISTS 'dismissed';
