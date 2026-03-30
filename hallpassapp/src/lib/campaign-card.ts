import type { SwipeCandidateCampaign } from "@/types/swipe";

export type CampaignCelebrityRow = {
  id: string;
  name: string;
  image_url: string | null;
  campaign_video_url: string | null;
  campaign_cta_link: string | null;
  campaign_cta_text: string | null;
};

/** Maps a DB celebrity row with an active campaign to a swipe card (index 0 injection). */
export function campaignRowToSwipeCandidate(row: CampaignCelebrityRow): SwipeCandidateCampaign {
  return {
    kind: "campaign",
    id: row.id,
    celebrity_id: row.id,
    display_name: row.name,
    image_url: row.image_url,
    campaign_video_url: row.campaign_video_url,
    campaign_cta_link: row.campaign_cta_link,
    campaign_cta_text: row.campaign_cta_text,
  };
}
