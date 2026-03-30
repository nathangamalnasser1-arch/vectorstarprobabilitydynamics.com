-- Swipe actions + candidates ranked by shared Hall Pass overlap.
-- Similar taste (shared celebrity picks) → higher in the deck; zero overlap still appears as filler.

CREATE TABLE IF NOT EXISTS public.user_swipes (
  swiper_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('like', 'pass')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (swiper_id, target_id),
  CONSTRAINT user_swipes_no_self CHECK (swiper_id <> target_id)
);

CREATE INDEX IF NOT EXISTS idx_user_swipes_swiper ON public.user_swipes (swiper_id);
CREATE INDEX IF NOT EXISTS idx_user_hall_pass_celebrity ON public.user_hall_pass (celebrity_id);

ALTER TABLE public.user_swipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users record own swipes"
  ON public.user_swipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = swiper_id);

CREATE POLICY "Users read own swipes"
  ON public.user_swipes FOR SELECT
  TO authenticated
  USING (auth.uid() = swiper_id);

-- Rank discovery: overlap_count = |viewer picks ∩ candidate picks|; order high → low, then random tie-break.
CREATE OR REPLACE FUNCTION public.get_swipe_candidates(p_limit integer DEFAULT 25)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
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
