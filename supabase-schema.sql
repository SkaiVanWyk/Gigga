-- ================================================================
-- GIGGA – SUPABASE SCHEMA SETUP
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ================================================================

-- ── 1. PROFILES TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('student', 'business')),
  full_name     TEXT,
  business_name TEXT,
  email         TEXT,
  phone         TEXT,
  city          TEXT,
  -- Student fields
  university    TEXT,
  study_field   TEXT,
  skills        TEXT[],
  cv_url        TEXT,
  -- Business fields
  industry      TEXT,
  -- Shared
  bio           TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. JOBS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  requirements TEXT,
  job_type     TEXT,
  category     TEXT,
  city         TEXT,
  pay          TEXT,
  tags         TEXT[],
  deadline     DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. APPLICATIONS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, student_id)
);

-- ── 4. ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- PROFILES: public read, own write
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- JOBS: public read, businesses can insert/update/delete their own
CREATE POLICY "Jobs are viewable by everyone"
  ON public.jobs FOR SELECT USING (true);

CREATE POLICY "Businesses can insert jobs"
  ON public.jobs FOR INSERT WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Businesses can update their own jobs"
  ON public.jobs FOR UPDATE USING (auth.uid() = business_id);

CREATE POLICY "Businesses can delete their own jobs"
  ON public.jobs FOR DELETE USING (auth.uid() = business_id);

-- APPLICATIONS: students can insert; businesses/students can read their own; businesses can update status
CREATE POLICY "Students can apply for jobs"
  ON public.applications FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can see their own applications"
  ON public.applications FOR SELECT USING (
    auth.uid() = student_id
    OR auth.uid() IN (
      SELECT business_id FROM public.jobs WHERE id = job_id
    )
  );

CREATE POLICY "Businesses can update application status"
  ON public.applications FOR UPDATE USING (
    auth.uid() IN (
      SELECT business_id FROM public.jobs WHERE id = job_id
    )
  );

-- ── 5. STORAGE BUCKETS ────────────────────────────────────────
-- Run these separately in the SQL Editor:

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars (public read, auth upload)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for CVs (auth read, auth upload)
CREATE POLICY "Authenticated users can view CVs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cvs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload CVs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cvs' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own CV"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
