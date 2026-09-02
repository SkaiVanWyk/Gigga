-- ================================================================
-- GIGGA – DATABASE MIGRATION
-- Run this in Supabase SQL Editor to update existing schema
-- ================================================================

-- ── 1. UPDATE PROFILES TABLE ─────────────────────────────────────
-- Rename user_type to role (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN user_type TO role;
  END IF;
END $$;

-- Add missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS study_field TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update role check constraint
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_user_type_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_user_type_check;
  END IF;
  
  -- Drop existing role check if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
  
  -- Add the constraint
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'business'));
END $$;

-- Ensure RLS is enabled and policies are correct
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ── 2. UPDATE JOBS TABLE ─────────────────────────────────────────
-- Rename location to city (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'location'
  ) THEN
    ALTER TABLE public.jobs RENAME COLUMN location TO city;
  END IF;
END $$;

-- Add missing columns
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS deadline DATE;

-- Ensure status column exists with proper constraint
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('active', 'closed', 'filled'));

-- Ensure view_count column exists
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Ensure edited_at column exists
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- ── 3. UPDATE APPLICATIONS TABLE ────────────────────────────────
-- Ensure message column exists
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS message TEXT;

-- Ensure withdrawn_at column exists
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

-- ── 4. CREATE NEW TABLES ────────────────────────────────────────
-- Saved Jobs (if not exists)
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, job_id)
);

-- Messages (if not exists)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications (if not exists)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Submissions (if not exists)
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. ENABLE RLS ON NEW TABLES ─────────────────────────────────
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- ── 6. CREATE RLS POLICIES ─────────────────────────────────────
-- Saved Jobs policies
DROP POLICY IF EXISTS "Students can view their own saved jobs" ON public.saved_jobs;
CREATE POLICY "Students can view their own saved jobs"
  ON public.saved_jobs FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can save jobs" ON public.saved_jobs;
CREATE POLICY "Students can save jobs"
  ON public.saved_jobs FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can delete their saved jobs" ON public.saved_jobs;
CREATE POLICY "Students can delete their saved jobs"
  ON public.saved_jobs FOR DELETE USING (auth.uid() = student_id);

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
CREATE POLICY "Users can view messages they sent or received"
  ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;
CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark their notifications as read" ON public.notifications;
CREATE POLICY "Users can mark their notifications as read"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Contact Submissions policies
DROP POLICY IF EXISTS "Anyone can submit contact forms" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact forms"
  ON public.contact_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view contact submissions" ON public.contact_submissions;
CREATE POLICY "Authenticated users can view contact submissions"
  ON public.contact_submissions FOR SELECT USING (auth.role() = 'authenticated');

-- ── 7. CREATE INDEXES ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_jobs_student ON public.saved_jobs(student_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON public.saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_job ON public.messages(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_business_status ON public.jobs(business_id, status);

-- ── 8. CREATE STORAGE BUCKETS ───────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- ── 9. CREATE STORAGE POLICIES ───────────────────────────────────
-- Avatars policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CVs policies
DROP POLICY IF EXISTS "Authenticated users can view CVs" ON storage.objects;
CREATE POLICY "Authenticated users can view CVs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cvs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can upload CVs" ON storage.objects;
CREATE POLICY "Authenticated users can upload CVs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cvs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own CV" ON storage.objects;
CREATE POLICY "Users can update their own CV"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
