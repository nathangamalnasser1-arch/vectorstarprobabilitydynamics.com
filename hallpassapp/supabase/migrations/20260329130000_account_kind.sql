-- Single vs couple accounts (one login per email; kind is stored on profile).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_kind TEXT NOT NULL DEFAULT 'single'
    CHECK (account_kind IN ('single', 'couple'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_display_name TEXT;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_partner_ok CHECK (
    account_kind = 'single'
    OR (
      account_kind = 'couple'
      AND partner_display_name IS NOT NULL
      AND length(trim(partner_display_name)) > 0
    )
  );

-- Recreate signup handler to persist account kind from auth metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::JSONB);
  kind TEXT;
  partner TEXT;
BEGIN
  kind := CASE
    WHEN meta ->> 'account_kind' = 'couple'
      AND length(trim(COALESCE(meta ->> 'partner_display_name', ''))) > 0
    THEN 'couple'
    ELSE 'single'
  END;

  partner := NULLIF(trim(COALESCE(meta ->> 'partner_display_name', '')), '');

  IF kind = 'single' THEN
    partner := NULL;
  END IF;

  INSERT INTO public.profiles (id, display_name, email, account_kind, partner_display_name)
  VALUES (
    NEW.id,
    COALESCE(meta ->> 'display_name', ''),
    NEW.email,
    kind,
    CASE WHEN kind = 'couple' THEN partner ELSE NULL END
  );
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.get_swipe_candidates(integer);

CREATE FUNCTION public.get_swipe_candidates(p_limit integer DEFAULT 25)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  partner_display_name TEXT,
  account_kind TEXT,
  relationship_intent TEXT,
  is_verified_celebrity BOOLEAN,
  verified_lookalike_celebrity_id UUID,
  overlap_count BIGINT,
  hall_pass JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH viewer_celebs AS (
    SELECT uhp.celebrity_id
    FROM public.user_hall_pass uhp
    WHERE uhp.user_id = auth.uid()
  ),
  overlap_scores AS (
    SELECT
      uhp.user_id AS candidate_id,
      COUNT(*)::BIGINT AS oc
    FROM public.user_hall_pass uhp
    INNER JOIN viewer_celebs vc ON vc.celebrity_id = uhp.celebrity_id
    WHERE uhp.user_id <> auth.uid()
    GROUP BY uhp.user_id
  ),
  eligible AS (
    SELECT p.id AS pid
    FROM public.profiles p
    WHERE p.account_status = 'active'
      AND p.id <> auth.uid()
      AND p.onboarding_completed_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_swipes s
        WHERE s.swiper_id = auth.uid()
          AND s.target_id = p.id
      )
  )
  SELECT
    p.id,
    p.display_name,
    p.partner_display_name,
    p.account_kind,
    p.relationship_intent,
    p.is_verified_celebrity,
    p.verified_lookalike_celebrity_id,
    COALESCE(o.oc, 0)::BIGINT,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('id', c.id, 'name', c.name)
          ORDER BY c.name
        )
        FROM public.user_hall_pass uhp2
        INNER JOIN public.celebrities c ON c.id = uhp2.celebrity_id
        WHERE uhp2.user_id = p.id
      ),
      '[]'::JSONB
    )
  FROM eligible e
  INNER JOIN public.profiles p ON p.id = e.pid
  LEFT JOIN overlap_scores o ON o.candidate_id = p.id
  ORDER BY COALESCE(o.oc, 0) DESC, random()
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_swipe_candidates(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_swipe_candidates(integer) TO authenticated;
