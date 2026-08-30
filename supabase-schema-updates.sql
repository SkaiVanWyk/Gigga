-- ================================================================
-- GIGGA – SUPABASE SCHEMA UPDATES
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ================================================================

-- ── 1. SAVED JOBS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, job_id)
);

-- RLS for saved_jobs
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own saved jobs"
  ON public.saved_jobs FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can save jobs"
  ON public.saved_jobs FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete their saved jobs"
  ON public.saved_jobs FOR DELETE USING (auth.uid() = student_id);

-- ── 2. MESSAGES TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they sent or received"
  ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- ── 3. NOTIFICATIONS TABLE ────────────────────────────────────────
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

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their notifications as read"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ── 4. CONTACT SUBMISSIONS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for contact_submissions
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact forms"
  ON public.contact_submissions FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view contact submissions"
  ON public.contact_submissions FOR SELECT USING (auth.role() = 'authenticated');

-- ── 5. UPDATES TO EXISTING TABLES ─────────────────────────────────

-- Add to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'filled'));
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Add to applications table
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

-- ── 6. INDEXES FOR PERFORMANCE ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_jobs_student ON public.saved_jobs(student_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON public.saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_job ON public.messages(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_business_status ON public.jobs(business_id, status);
