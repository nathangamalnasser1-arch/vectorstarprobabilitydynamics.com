-- Who the viewer wants to see: men, women, non-binary singles, couples, or everyone.
-- Hall Pass overlap ranking unchanged; this filters the eligible pool.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seeking TEXT[];

COMMENT ON COLUMN public.profiles.seeking IS
  'Discovery targets: men, women, non_binary, couples, everyone (array). NULL uses legacy backfill rules.';

-- Defaults for existing rows (was implicit male↔female).
UPDATE public.profiles
SET seeking = ARRAY['women']::TEXT[]
WHERE seeking IS NULL AND gender = 'male';

UPDATE public.profiles
SET seeking = ARRAY['men']::TEXT[]
WHERE seeking IS NULL AND gender = 'female';

UPDATE public.profiles
SET seeking = ARRAY['men', 'women', 'non_binary', 'couples']::TEXT[]
WHERE seeking IS NULL AND gender IN ('non_binary', 'other');

UPDATE public.profiles
SET seeking = ARRAY['men', 'women', 'non_binary', 'couples']::TEXT[]
WHERE seeking IS NULL AND account_kind = 'couple';

UPDATE public.profiles
SET seeking = ARRAY['everyone']::TEXT[]
WHERE seeking IS NULL;

DROP FUNCTION IF EXISTS public.get_swipe_candidates(integer);

CREATE OR REPLACE FUNCTION public.get_swipe_candidates(p_limit integer DEFAULT 25)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  partner_display_name TEXT,
  account_kind TEXT,
  gender TEXT,
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
  WITH viewer_profile AS (
    SELECT pr.seeking AS viewer_seeking
    FROM public.profiles pr
    WHERE pr.id = auth.uid()
  ),
  viewer_celebs AS (
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
    CROSS JOIN viewer_profile v
    WHERE p.account_status = 'active'
      AND p.id <> auth.uid()
      AND p.onboarding_completed_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_swipes s
        WHERE s.swiper_id = auth.uid()
          AND s.target_id = p.id
      )
      AND (
        v.viewer_seeking IS NULL
        OR cardinality(v.viewer_seeking) = 0
        OR 'everyone' = ANY(v.viewer_seeking)
        OR (
          ('couples' = ANY(v.viewer_seeking) AND p.account_kind = 'couple')
          OR (
            'men' = ANY(v.viewer_seeking)
            AND p.account_kind = 'single'
            AND p.gender = 'male'
          )
          OR (
            'women' = ANY(v.viewer_seeking)
            AND p.account_kind = 'single'
            AND p.gender = 'female'
          )
          OR (
            'non_binary' = ANY(v.viewer_seeking)
            AND p.account_kind = 'single'
            AND p.gender IN ('non_binary', 'other')
          )
        )
      )
  )
  SELECT
    p.id,
    p.display_name,
    p.partner_display_name,
    p.account_kind,
    p.gender,
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
  g TEXT;
  seeking_arr TEXT[];
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

  g := CASE meta ->> 'gender'
    WHEN 'male' THEN 'male'
    WHEN 'female' THEN 'female'
    WHEN 'non_binary' THEN 'non_binary'
    WHEN 'other' THEN 'other'
    ELSE NULL
  END;

  IF meta ? 'seeking' AND jsonb_typeof(meta -> 'seeking') = 'array' THEN
    seeking_arr := ARRAY(
      SELECT jsonb_array_elements_text(meta -> 'seeking')
    );
  ELSE
    seeking_arr := CASE
      WHEN g = 'male' THEN ARRAY['women']::TEXT[]
      WHEN g = 'female' THEN ARRAY['men']::TEXT[]
      WHEN g IN ('non_binary', 'other') THEN ARRAY['men', 'women', 'non_binary', 'couples']::TEXT[]
      WHEN kind = 'couple' THEN ARRAY['men', 'women', 'non_binary', 'couples']::TEXT[]
      ELSE ARRAY['everyone']::TEXT[]
    END;
  END IF;

  INSERT INTO public.profiles (
    id,
    display_name,
    email,
    account_kind,
    partner_display_name,
    gender,
    seeking
  )
  VALUES (
    NEW.id,
    COALESCE(meta ->> 'display_name', ''),
    NEW.email,
    kind,
    CASE WHEN kind = 'couple' THEN partner ELSE NULL END,
    g,
    seeking_arr
  );
  RETURN NEW;
END;
$$;
