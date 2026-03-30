import type {
  AccountKind,
  ProfileGender,
  RelationshipIntent,
} from "@/types/database";

/** Standard discover card — real user / look-alike profile. */
export type SwipeCandidateUser = {
  kind: "user";
  id: string;
  display_name: string;
  partner_display_name: string | null;
  account_kind: AccountKind;
  gender: ProfileGender | null;
  relationship_intent: RelationshipIntent | null;
  is_verified_celebrity: boolean;
  verified_lookalike_celebrity_id: string | null;
  overlap_count: number;
  hall_pass: { id: string; name: string }[];
};

/** Studio / brand takeover — celebrity row with active campaign; not a matchable user profile. */
export type SwipeCandidateCampaign = {
  kind: "campaign";
  /** Same as `celebrity_id` — used for analytics keys and queue identity. */
  id: string;
  celebrity_id: string;
  display_name: string;
  image_url: string | null;
  campaign_video_url: string | null;
  campaign_cta_link: string | null;
  campaign_cta_text: string | null;
};

export type SwipeCandidate = SwipeCandidateUser | SwipeCandidateCampaign;
