-- Fix: NULL or empty profiles.seeking was treated as "show everyone" in get_swipe_candidates,
-- so men who should see only women could see the full pool if seeking was missing.
-- Effective seeking now matches handle_new_user defaults when the column is unset/empty.

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
    SELECT
      COALESCE(
        CASE
          WHEN pr.seeking IS NOT NULL AND cardinality(pr.seeking) > 0 THEN pr.seeking
          ELSE NULL
        END,
        CASE
          WHEN pr.account_kind = 'couple' THEN ARRAY['men', 'women', 'non_binary', 'couples']::TEXT[]
          WHEN pr.gender = 'male' THEN ARRAY['women']::TEXT[]
          WHEN pr.gender = 'female' THEN ARRAY['men']::TEXT[]
          WHEN pr.gender IN ('non_binary', 'other') THEN ARRAY['men', 'women', 'non_binary', 'couples']::TEXT[]
          ELSE ARRAY['everyone']::TEXT[]
        END
      ) AS viewer_seeking
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
        'everyone' = ANY(v.viewer_seeking)
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
