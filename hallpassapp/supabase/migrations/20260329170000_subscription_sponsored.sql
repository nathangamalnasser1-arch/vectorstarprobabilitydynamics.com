-- Hall Pass Premium: subscription tier, Stripe customer id, sponsored celebrities.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

ALTER TABLE public.celebrities
  ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.celebrities
  ADD COLUMN IF NOT EXISTS sponsor_cta_text TEXT;

ALTER TABLE public.celebrities
  ADD COLUMN IF NOT EXISTS sponsor_url TEXT;

-- Only billing (service role) may change subscription tier or Stripe customer id.
CREATE OR REPLACE FUNCTION public.enforce_billing_only_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_claim TEXT;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  role_claim := auth.jwt() ->> 'role';

  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    IF role_claim IS DISTINCT FROM 'service_role' THEN
      RAISE EXCEPTION 'subscription_tier can only be changed via billing';
    END IF;
  END IF;

  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
    IF role_claim IS DISTINCT FROM 'service_role' THEN
      RAISE EXCEPTION 'stripe_customer_id can only be set via billing';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_billing_fields ON public.profiles;
CREATE TRIGGER trg_profiles_billing_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_billing_only_profile_fields();
