-- ================================================================
-- GIGGA – PAID REGISTRATION SYSTEM
-- Run this in Supabase SQL Editor to implement paid account creation
-- ================================================================

-- 1. Add payment tracking to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'suspended', 'cancelled'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_payment_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_amount DECIMAL(10,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_payment_date TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_payment_method TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

-- 2. Create registration payments table
CREATE TABLE IF NOT EXISTS public.registration_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  gateway TEXT,
  gateway_transaction_id TEXT,
  gateway_response JSONB,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on registration_payments
ALTER TABLE public.registration_payments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for registration_payments
CREATE POLICY "Users can view their own registration payments"
  ON public.registration_payments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own registration payments"
  ON public.registration_payments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all registration payments"
  ON public.registration_payments FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  ));

-- 5. Create pricing configuration table
CREATE TABLE IF NOT EXISTS public.pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('student', 'business')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free_trial', 'basic', 'premium')),
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  duration_days INTEGER,
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Insert default pricing
INSERT INTO public.pricing (role, plan_type, price, duration_days, features, is_active) VALUES
  ('student', 'free_trial', 0.00, 7, ARRAY['Apply for up to 5 jobs', 'Basic profile features', '7 days full access'], true),
  ('student', 'basic', 99.00, 30, ARRAY['Unlimited job applications', 'Full profile features', 'Priority support', '30 days access'], true),
  ('student', 'premium', 249.00, 90, ARRAY['Unlimited job applications', 'Premium profile features', 'Priority job matching', 'Dedicated support', '90 days access'], true),
  ('business', 'free_trial', 0.00, 7, ARRAY['Post up to 3 jobs', 'Basic applicant management', '7 days full access'], true),
  ('business', 'basic', 199.00, 30, ARRAY['Unlimited job postings', 'Full applicant management', 'Advanced search filters', '30 days access'], true),
  ('business', 'premium', 499.00, 90, ARRAY['Unlimited job postings', 'Premium applicant management', 'AI-powered matching', 'Dedicated account manager', '90 days access'], true)
ON CONFLICT DO NOTHING;

-- 7. Enable RLS on pricing
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for pricing (read-only for all users)
CREATE POLICY "All users can view pricing"
  ON public.pricing FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage pricing"
  ON public.pricing FOR ALL 
  USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  ));

-- 9. Create function to activate account after payment
CREATE OR REPLACE FUNCTION activate_account_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment is completed, activate the user's account
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    UPDATE public.profiles 
    SET 
      account_status = 'active',
      registration_fee_paid = true,
      registration_payment_id = NEW.id,
      registration_amount = NEW.amount,
      registration_payment_date = NEW.payment_date,
      registration_payment_method = NEW.payment_method
    WHERE id = NEW.profile_id;
    
    -- If it's a trial, set trial dates
    IF NEW.amount = 0 THEN
      UPDATE public.profiles 
      SET 
        trial_start_date = NOW(),
        trial_end_date = NOW() + INTERVAL '7 days'
      WHERE id = NEW.profile_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for account activation
DROP TRIGGER IF EXISTS on_registration_payment_completed ON public.registration_payments;
CREATE TRIGGER on_registration_payment_completed
  AFTER UPDATE ON public.registration_payments
  FOR EACH ROW
  EXECUTE FUNCTION activate_account_after_payment();

-- 11. Create function to check account status
CREATE OR REPLACE FUNCTION check_account_status(user_id UUID)
RETURNS TABLE (
  account_status TEXT,
  is_active BOOLEAN,
  is_trial BOOLEAN,
  trial_days_remaining INTEGER,
  subscription_days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.account_status,
    (p.account_status = 'active')::BOOLEAN as is_active,
    (p.trial_end_date > NOW())::BOOLEAN as is_trial,
    CASE 
      WHEN p.trial_end_date > NOW() THEN 
        EXTRACT(DAY FROM (p.trial_end_date - NOW()))
      ELSE 0 
    END as trial_days_remaining,
    CASE 
      WHEN p.registration_payment_date IS NOT NULL THEN
        EXTRACT(DAY FROM (p.registration_payment_date + INTERVAL '30 days' - NOW()))
      ELSE 0 
    END as subscription_days_remaining
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 12. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registration_payments_user ON public.registration_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_payments_status ON public.registration_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_registration_payments_gateway ON public.registration_payments(gateway);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_pricing_role_plan ON public.pricing(role, plan_type);

-- 13. Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
  AND column_name LIKE '%registration%'
ORDER BY column_name;
