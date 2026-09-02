-- Add missing columns to jobs table if they don't exist
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS pay TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'jobs'
  AND table_schema = 'public'
ORDER BY ordinal_position;
