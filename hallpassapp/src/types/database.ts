export type RelationshipIntent = "single" | "cnm" | "browsing";

/** One person vs two people on one login — see `account_kind` on profiles. */
export type AccountKind = "single" | "couple";

/** Discovery: men/women see opposite by default; non_binary/other = no gender gate. */
export type ProfileGender = "male" | "female" | "non_binary" | "other";

/** Who you want to see in Discover — mirrors `profiles.seeking` (text[] in DB). */
export type SeekingOption =
  | "everyone"
  | "men"
  | "women"
  | "non_binary"
  | "couples";

export type AccountStatus = "active" | "banned" | "suspended";

export type MatchStatus = "pending" | "matched" | "declined";

/** Billing — Hall Pass Premium vs free tier. */
export type SubscriptionTier = "free" | "premium";

export type ReportCategory =
  | "deception_infidelity"
  | "harassment"
  | "lookalike_fraud";

export type ProfileRow = {
  id: string;
  display_name: string;
  partner_display_name: string | null;
  account_kind: AccountKind;
  gender: ProfileGender | null;
  /** Who this profile wants to see; empty/null/`everyone` = no filter (see RPC). */
  seeking: SeekingOption[] | null;
  email: string | null;
  relationship_intent: RelationshipIntent | null;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  account_status: AccountStatus;
  red_flag_count: number;
  verified_safe_at: string | null;
  verified_lookalike_celebrity_id: string | null;
  is_verified_celebrity: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CelebrityRow = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_verified_public_figure: boolean;
  is_sponsored: boolean;
  sponsor_cta_text: string | null;
  sponsor_url: string | null;
  /** When true, this celebrity is injected at the top of the swipe stack as a native ad. */
  is_active_campaign: boolean;
  campaign_video_url: string | null;
  campaign_cta_link: string | null;
  campaign_cta_text: string | null;
  added_by_user_id: string | null;
  created_at: string;
};

/** Aggregate counters for a sponsored campaign (one row per `celebrity_id`). */
export type CampaignAnalyticsRow = {
  celebrity_id: string;
  impressions: number;
  swipe_lefts: number;
  cta_clicks: number;
  updated_at: string;
};

export type MatchRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: MatchStatus;
  created_at: string;
};

export type ReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  category: ReportCategory;
  notes: string | null;
  created_at: string;
};
