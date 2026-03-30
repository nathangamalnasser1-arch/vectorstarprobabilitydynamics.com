import { STATIC_CELEBRITY_ENTRIES } from "@/data/static-celebrities";
import { candidateMatchesSeeking } from "@/lib/discovery-match";
import { rankCandidatesBySharedHallPass } from "@/lib/hall-pass-similarity";
import type { AccountKind, ProfileGender, SeekingOption } from "@/types/database";
import type {
  SwipeCandidate,
  SwipeCandidateCampaign,
  SwipeCandidateUser,
} from "@/types/swipe";

/** Demo viewer shares Ryan + Brad — others vary so overlap ranking is visible offline. */
const VIEWER_CELEB_IDS = ["c-ryan", "c-brad"] as const;

/** Shown at the top of the guest/demo deck — mirrors live `is_active_campaign` injection. */
export const DEMO_CAMPAIGN_CARD: SwipeCandidateCampaign = {
  kind: "campaign",
  id: "demo-campaign-card",
  celebrity_id: "demo-campaign-card",
  display_name: "Midnight Premiere",
  image_url: null,
  campaign_video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  campaign_cta_link: "https://example.com/tickets",
  campaign_cta_text: "Get tickets",
};

const CELEB_NAMES: Record<string, string> = Object.fromEntries(
  STATIC_CELEBRITY_ENTRIES.map((e) => [e.id, e.name])
);

/** Static catalog for guest “try” mode (no Supabase) — full list in `src/data/static-celebrities.ts`. */
export const CELEBRITY_CATALOG: { id: string; name: string }[] = [
  ...STATIC_CELEBRITY_ENTRIES,
];

type PoolRow = {
  id: string;
  display_name: string;
  partner_display_name: string | null;
  account_kind: AccountKind;
  gender: ProfileGender;
  relationship_intent: SwipeCandidateUser["relationship_intent"];
  is_verified_celebrity: boolean;
  verified_lookalike_celebrity_id: string | null;
  celebrityIds: readonly string[];
};

const POOL: PoolRow[] = [
  {
    id: "demo-a",
    display_name: "Jordan",
    partner_display_name: null,
    account_kind: "single",
    gender: "female",
    relationship_intent: "single",
    is_verified_celebrity: false,
    verified_lookalike_celebrity_id: null,
    celebrityIds: ["c-ryan", "c-brad", "c-margot"],
  },
  {
    id: "demo-b",
    display_name: "Sam",
    partner_display_name: "Alex",
    account_kind: "couple",
    gender: "female",
    relationship_intent: "cnm",
    is_verified_celebrity: false,
    verified_lookalike_celebrity_id: "c-ryan",
    celebrityIds: ["c-ryan", "c-brad"],
  },
  {
    id: "demo-c",
    display_name: "Riley",
    partner_display_name: null,
    account_kind: "single",
    gender: "female",
    relationship_intent: "browsing",
    is_verified_celebrity: false,
    verified_lookalike_celebrity_id: null,
    celebrityIds: ["c-ryan"],
  },
  {
    id: "demo-d",
    display_name: "Taylor",
    partner_display_name: "Morgan",
    account_kind: "couple",
    gender: "female",
    relationship_intent: "single",
    is_verified_celebrity: true,
    verified_lookalike_celebrity_id: null,
    celebrityIds: ["c-scarlett", "c-zendaya"],
  },
  {
    id: "demo-e",
    display_name: "Chris",
    partner_display_name: null,
    account_kind: "single",
    gender: "male",
    relationship_intent: "single",
    is_verified_celebrity: false,
    verified_lookalike_celebrity_id: null,
    celebrityIds: ["c-ryan", "c-brad", "c-scarlett"],
  },
  {
    id: "demo-f",
    display_name: "Jamie",
    partner_display_name: null,
    account_kind: "single",
    gender: "male",
    relationship_intent: "cnm",
    is_verified_celebrity: false,
    verified_lookalike_celebrity_id: "c-margot",
    celebrityIds: ["c-margot", "c-zendaya"],
  },
  {
    id: "demo-g",
    display_name: "Quinn",
    partner_display_name: null,
    account_kind: "single",
    gender: "non_binary",
    relationship_intent: "browsing",
    is_verified_celebrity: false,
    verified_lookalike_celebrity_id: null,
    celebrityIds: ["c-ryan", "c-zendaya"],
  },
];

function filterPoolBySeeking(
  pool: readonly PoolRow[],
  seeking: SeekingOption[] | null | undefined
): PoolRow[] {
  const filtered = pool.filter((row) =>
    candidateMatchesSeeking(seeking, {
      account_kind: row.account_kind,
      gender: row.gender,
    })
  );
  return filtered.length > 0 ? filtered : [...pool];
}

function poolRowToSwipeCandidate(
  r: PoolRow & { overlapCount: number }
): SwipeCandidate {
  return {
    kind: "user",
    id: r.id,
    display_name: r.display_name,
    partner_display_name: r.partner_display_name,
    account_kind: r.account_kind,
    gender: r.gender,
    relationship_intent: r.relationship_intent,
    is_verified_celebrity: r.is_verified_celebrity,
    verified_lookalike_celebrity_id: r.verified_lookalike_celebrity_id,
    overlap_count: r.overlapCount,
    hall_pass: r.celebrityIds.map((cid) => ({
      id: cid,
      name: CELEB_NAMES[cid] ?? cid,
    })),
  };
}

/** Rank the demo deck by overlap; pool filtered by `seeking` (mirrors Discover RPC). */
export function getDemoSwipeCandidatesForViewer(
  celebrityIds: readonly string[],
  seeking?: SeekingOption[] | null
): SwipeCandidate[] {
  const ids =
    celebrityIds.length > 0 ? celebrityIds : [...VIEWER_CELEB_IDS];
  const pool = filterPoolBySeeking(POOL, seeking);
  const ranked = rankCandidatesBySharedHallPass(ids, pool);
  const users = ranked.map((r) => poolRowToSwipeCandidate(r));
  return [DEMO_CAMPAIGN_CARD, ...users];
}

export function getDemoSwipeCandidates(
  seeking?: SeekingOption[] | null
): SwipeCandidate[] {
  return getDemoSwipeCandidatesForViewer([...VIEWER_CELEB_IDS], seeking);
}
