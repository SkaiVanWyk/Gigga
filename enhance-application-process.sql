-- ================================================================
-- GIGGA – ENHANCE APPLICATION PROCESS WITH PAYMENT TRACKING
-- Run this in Supabase SQL Editor to add payment and notification features
-- ================================================================

-- 1. Add payment tracking to applications table
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'completed'));
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- 2. Add job status tracking
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS filled_at TIMESTAMPTZ;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS filled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Add notification tracking
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 4. Create payment history table for tracking all payments
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date TIMESTAMPTZ,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS on payment_history
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for payment_history
CREATE POLICY "Users can view their own payment history"
  ON public.payment_history FOR SELECT 
  USING (auth.uid() = student_id OR auth.uid() = business_id);

CREATE POLICY "Businesses can insert payment records"
  ON public.payment_history FOR INSERT 
  WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Businesses can update payment records"
  ON public.payment_history FOR UPDATE 
  USING (auth.uid() = business_id);

-- 7. Update applications RLS to allow payment updates
DROP POLICY IF EXISTS "Businesses can update application status" ON public.applications;
CREATE POLICY "Businesses can update application status and payment"
  ON public.applications FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT business_id FROM public.jobs WHERE id = job_id
    )
  );

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_history_application ON public.payment_history(application_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_student ON public.payment_history(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_business ON public.payment_history(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON public.payment_history(payment_status);

-- 9. Add function to automatically create notifications for application status changes
CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify student when application status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.student_id,
      'application_status',
      CASE NEW.status
        WHEN 'accepted' THEN 'Application Accepted! 🎉'
        WHEN 'rejected' THEN 'Application Update'
        ELSE 'Application Status Changed'
      END,
      CASE NEW.status
        WHEN 'accepted' THEN 'Your application has been accepted! Contact the business to arrange payment details.'
        WHEN 'rejected' THEN 'Your application was not selected for this position.'
        ELSE 'Your application status has been updated to ' || NEW.status
      END,
      '/profile.html'
    );
  END IF;
  
  -- Notify business when student withdraws
  IF OLD.withdrawn_at IS NULL AND NEW.withdrawn_at IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      (SELECT business_id FROM public.jobs WHERE id = NEW.job_id),
      'application_withdrawn',
      'Application Withdrawn',
      'A student has withdrawn their application.',
      '/profile.html'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for automatic notifications
DROP TRIGGER IF EXISTS on_application_status_change ON public.applications;
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_status_change();

-- 11. Create function to update job status when filled
CREATE OR REPLACE FUNCTION update_job_when_filled()
RETURNS TRIGGER AS $$
BEGIN
  -- When an application is accepted, update job status
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    UPDATE public.jobs 
    SET status = 'filled',
        filled_at = NOW(),
        filled_by = NEW.student_id
    WHERE id = NEW.job_id;
  END IF;
  
  -- If accepted application is rejected, reset job status
  IF NEW.status = 'rejected' AND OLD.status = 'accepted' THEN
    UPDATE public.jobs 
    SET status = 'active',
        filled_at = NULL,
        filled_by = NULL
    WHERE id = NEW.job_id 
      AND filled_by = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for job status updates
DROP TRIGGER IF EXISTS on_application_status_update_job ON public.applications;
CREATE TRIGGER on_application_status_update_job
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_when_filled();

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'applications'
  AND table_schema = 'public'
ORDER BY ordinal_position;
