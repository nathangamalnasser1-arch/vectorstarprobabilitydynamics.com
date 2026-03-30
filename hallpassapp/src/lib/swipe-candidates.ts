import type { SupabaseClient } from "@supabase/supabase-js";
import type { SwipeCandidate, SwipeCandidateCampaign, SwipeCandidateUser } from "@/types/swipe";
import type { AccountKind, ProfileGender, RelationshipIntent } from "@/types/database";
import {
  campaignRowToSwipeCandidate,
  type CampaignCelebrityRow,
} from "@/lib/campaign-card";
import { getPrimaryBackend } from "@/lib/data-backend";
import { getFirebaseDb } from "@/lib/firebase/client";
import { loadSwipeCandidatesFirebase } from "@/lib/firebase/swipe-feed";
import { isAccountKind } from "@/lib/account-kind";
import { isProfileGender } from "@/lib/gender-discovery";
import { getDemoSwipeCandidates } from "@/lib/swipe-demo-data";

type RpcSwipeRow = {
  id: string;
  display_name: string;
  partner_display_name: string | null;
  account_kind: string | null;
  gender: string | null;
  relationship_intent: string | null;
  is_verified_celebrity: boolean;
  verified_lookalike_celebrity_id: string | null;
  overlap_count: number;
  hall_pass: unknown;
};

function parseIntent(v: string | null): RelationshipIntent | null {
  if (v === "single" || v === "cnm" || v === "browsing") return v;
  return null;
}

function parseAccountKind(v: string | null | undefined): AccountKind {
  return isAccountKind(v) ? v : "single";
}

function parseGender(v: string | null | undefined): ProfileGender | null {
  return isProfileGender(v) ? v : null;
}

export function normalizeHallPass(raw: unknown): SwipeCandidateUser["hall_pass"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x): x is { id: string; name: string } =>
        x !== null &&
        typeof x === "object" &&
        "id" in x &&
        "name" in x &&
        typeof (x as { id: unknown }).id === "string" &&
        typeof (x as { name: unknown }).name === "string"
    )
    .map((x) => ({ id: x.id, name: x.name }));
}

export function normalizeSwipeRow(row: RpcSwipeRow): SwipeCandidateUser {
  return {
    kind: "user",
    id: row.id,
    display_name: row.display_name,
    partner_display_name: row.partner_display_name ?? null,
    account_kind: parseAccountKind(row.account_kind),
    gender: parseGender(row.gender),
    relationship_intent: parseIntent(row.relationship_intent),
    is_verified_celebrity: row.is_verified_celebrity,
    verified_lookalike_celebrity_id: row.verified_lookalike_celebrity_id,
    overlap_count: Number(row.overlap_count),
    hall_pass: normalizeHallPass(row.hall_pass),
  };
}

async function fetchActiveCampaignCelebrity(
  supabase: SupabaseClient
): Promise<SwipeCandidateCampaign | null> {
  const { data, error } = await supabase
    .from("celebrities")
    .select(
      "id, name, image_url, campaign_video_url, campaign_cta_link, campaign_cta_text"
    )
    .eq("is_active_campaign", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return campaignRowToSwipeCandidate(data as CampaignCelebrityRow);
}

export async function loadSwipeCandidates(
  supabase: SupabaseClient | null,
  firebaseUid?: string | null
): Promise<SwipeCandidate[]> {
  if (getPrimaryBackend() === "firebase") {
    const db = getFirebaseDb();
    if (db && firebaseUid) {
      return loadSwipeCandidatesFirebase(db, firebaseUid);
    }
    return getDemoSwipeCandidates();
  }

  if (!supabase) {
    return getDemoSwipeCandidates();
  }

  const { data, error } = await supabase.rpc("get_swipe_candidates", {
    p_limit: 25,
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as RpcSwipeRow[];
  const users = rows.map(normalizeSwipeRow);

  const campaign = await fetchActiveCampaignCelebrity(supabase);
  if (campaign) {
    return [campaign, ...users];
  }

  return users;
}
