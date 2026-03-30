-- Native advertising: campaign fields on celebrities + aggregate analytics per campaign.

ALTER TABLE public.celebrities
  ADD COLUMN IF NOT EXISTS is_active_campaign BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.celebrities
  ADD COLUMN IF NOT EXISTS campaign_video_url TEXT;

ALTER TABLE public.celebrities
  ADD COLUMN IF NOT EXISTS campaign_cta_link TEXT;

ALTER TABLE public.celebrities
  ADD COLUMN IF NOT EXISTS campaign_cta_text TEXT;

-- One analytics row per celebrity campaign (counters incremented by app / service role).
CREATE TABLE IF NOT EXISTS public.campaign_analytics (
  celebrity_id UUID PRIMARY KEY
    REFERENCES public.celebrities (id) ON DELETE CASCADE,
  impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  swipe_lefts INTEGER NOT NULL DEFAULT 0 CHECK (swipe_lefts >= 0),
  cta_clicks INTEGER NOT NULL DEFAULT 0 CHECK (cta_clicks >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.touch_campaign_analytics_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campaign_analytics_updated ON public.campaign_analytics;
CREATE TRIGGER trg_campaign_analytics_updated
  BEFORE UPDATE ON public.campaign_analytics
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_campaign_analytics_updated_at();

ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- No policies: authenticated clients cannot read/write; service role bypasses RLS for API routes.
