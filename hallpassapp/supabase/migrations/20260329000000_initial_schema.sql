-- Hall Pass — initial schema (run in Supabase SQL editor or via CLI)
-- Requires: extensions pgcrypto (gen_random_uuid)

-- ---------------------------------------------------------------------------
-- Enums (implemented as CHECK constraints for portability)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  relationship_intent TEXT CHECK (relationship_intent IN ('single', 'cnm', 'browsing')),
  account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'banned', 'suspended')),
  red_flag_count INTEGER NOT NULL DEFAULT 0 CHECK (red_flag_count >= 0),
  verified_safe_at TIMESTAMPTZ,
  verified_lookalike_celebrity_id UUID,
  is_verified_celebrity BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Celebrities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.celebrities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  is_verified_public_figure BOOLEAN NOT NULL DEFAULT TRUE,
  added_by_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD CONSTRAINT fk_verified_lookalike
  FOREIGN KEY (verified_lookalike_celebrity_id)
  REFERENCES public.celebrities (id)
  ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- User hall pass picks (many-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_hall_pass (
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  celebrity_id UUID NOT NULL REFERENCES public.celebrities (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, celebrity_id)
);

-- ---------------------------------------------------------------------------
-- Matches
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'matched', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT matches_distinct_users CHECK (user_a_id <> user_b_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_ordered_pair ON public.matches (
  LEAST(user_a_id, user_b_id),
  GREATEST(user_a_id, user_b_id)
);

-- ---------------------------------------------------------------------------
-- Reports (3-strike system)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (
    category IN ('deception_infidelity', 'harassment', 'lookalike_fraud')
  ),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reports_no_self CHECK (reporter_id <> reported_user_id)
);

-- ---------------------------------------------------------------------------
-- 3-strike: increment red flags and ban at 3
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_report_strike()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    red_flag_count = red_flag_count + 1,
    account_status = CASE
      WHEN red_flag_count + 1 >= 3 THEN 'banned'
      ELSE account_status
    END,
    updated_at = now()
  WHERE id = NEW.reported_user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reports_strike ON public.reports;
CREATE TRIGGER trg_reports_strike
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE PROCEDURE public.apply_report_strike();

-- ---------------------------------------------------------------------------
-- Green flag: award after 30 days active with zero red flags (run daily via cron)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_green_flags()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.profiles
  SET
    verified_safe_at = now(),
    updated_at = now()
  WHERE
    account_status = 'active'
    AND red_flag_count = 0
    AND verified_safe_at IS NULL
    AND created_at <= (now() - interval '30 days');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at touch
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS (baseline — tighten for production)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebrities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hall_pass ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own row; authenticated read for discovery can be added later
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Celebrities: readable by authenticated users
CREATE POLICY "Authenticated read celebrities"
  ON public.celebrities FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated insert celebrities"
  ON public.celebrities FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- user_hall_pass
CREATE POLICY "Users manage own hall pass"
  ON public.user_hall_pass FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- matches — placeholder policies (expand when matching ships)
CREATE POLICY "Users see own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users create matches as participant"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- reports
CREATE POLICY "Users create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users view own filed reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- ---------------------------------------------------------------------------
-- Seed celebrities
-- ---------------------------------------------------------------------------
INSERT INTO public.celebrities (name, slug, is_verified_public_figure)
VALUES
  ('Ryan Gosling', 'ryan-gosling', TRUE),
  ('Brad Pitt', 'brad-pitt', TRUE),
  ('Scarlett Johansson', 'scarlett-johansson', TRUE),
  ('Margot Robbie', 'margot-robbie', TRUE),
  ('Timothée Chalamet', 'timothee-chalamet', TRUE),
  ('Zendaya', 'zendaya', TRUE)
ON CONFLICT (slug) DO NOTHING;
