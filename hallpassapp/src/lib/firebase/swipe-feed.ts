import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { AccountKind, ProfileGender, RelationshipIntent } from "@/types/database";
import { isAccountKind } from "@/lib/account-kind";
import { isProfileGender } from "@/lib/gender-discovery";
import { campaignRowToSwipeCandidate } from "@/lib/campaign-card";
import type { SwipeCandidate, SwipeCandidateUser } from "@/types/swipe";

function parseIntent(v: unknown): RelationshipIntent | null {
  if (v === "single" || v === "cnm" || v === "browsing") return v;
  return null;
}

function parseAccountKind(v: unknown): AccountKind {
  return isAccountKind(typeof v === "string" ? v : null) ? v as AccountKind : "single";
}

function parseGender(v: unknown): ProfileGender | null {
  return isProfileGender(typeof v === "string" ? v : null) ? (v as ProfileGender) : null;
}

function completedOnboarding(data: Record<string, unknown>): boolean {
  return data.onboarding_completed_at != null;
}

function overlapCount(a: readonly string[], b: readonly string[]): number {
  const setA = new Set(a);
  let n = 0;
  for (const x of b) {
    if (setA.has(x)) n += 1;
  }
  return n;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function celebrityNamesByIds(
  db: Firestore,
  ids: readonly string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(ids)].filter(Boolean);
  const chunkSize = 10;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const q = query(
      collection(db, "celebrities"),
      where(documentId(), "in", chunk)
    );
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const n = d.data().name;
      if (typeof n === "string") map.set(d.id, n);
    });
  }
  return map;
}

function hallPassFromProfile(
  data: Record<string, unknown>,
  nameLookup: Map<string, string>
): SwipeCandidateUser["hall_pass"] {
  const list = data.hall_pass_list;
  if (Array.isArray(list)) {
    const out: SwipeCandidateUser["hall_pass"] = [];
    for (const item of list) {
      if (
        item &&
        typeof item === "object" &&
        "id" in item &&
        "name" in item &&
        typeof (item as { id: unknown }).id === "string" &&
        typeof (item as { name: unknown }).name === "string"
      ) {
        out.push({ id: (item as { id: string }).id, name: (item as { name: string }).name });
      }
    }
    if (out.length > 0) return out;
  }
  const ids = data.hall_pass_ids;
  if (!Array.isArray(ids)) return [];
  return ids
    .filter((x): x is string => typeof x === "string")
    .map((id) => ({ id, name: nameLookup.get(id) ?? id }));
}

export async function loadSwipeCandidatesFirebase(
  db: Firestore,
  viewerUid: string
): Promise<SwipeCandidate[]> {
  const viewerRef = doc(db, "profiles", viewerUid);
  const viewerSnap = await getDoc(viewerRef);
  const viewerData = viewerSnap.exists() ? (viewerSnap.data() as Record<string, unknown>) : {};
  const viewerIds = Array.isArray(viewerData.hall_pass_ids)
    ? (viewerData.hall_pass_ids as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  const swipesQ = query(
    collection(db, "swipes"),
    where("swiper_id", "==", viewerUid)
  );
  const swipesSnap = await getDocs(swipesQ);
  const swipedTargets = new Set<string>();
  swipesSnap.forEach((d) => {
    const t = d.data().target_id;
    if (typeof t === "string") swipedTargets.add(t);
  });

  const profilesQ = query(
    collection(db, "profiles"),
    where("account_status", "==", "active"),
    limit(120)
  );
  const profilesSnap = await getDocs(profilesQ);

  const rawRows: { id: string; data: Record<string, unknown> }[] = [];
  profilesSnap.forEach((d) => {
    if (d.id === viewerUid) return;
    const data = d.data() as Record<string, unknown>;
    if (!completedOnboarding(data)) return;
    if (swipedTargets.has(d.id)) return;
    rawRows.push({ id: d.id, data });
  });

  const allIds = new Set<string>();
  viewerIds.forEach((id) => allIds.add(id));
  rawRows.forEach(({ data }) => {
    const ids = data.hall_pass_ids;
    if (Array.isArray(ids)) {
      ids.forEach((x) => {
        if (typeof x === "string") allIds.add(x);
      });
    }
  });
  const nameLookup = await celebrityNamesByIds(db, [...allIds]);

  const scored = rawRows.map(({ id, data }) => {
    const candIds = Array.isArray(data.hall_pass_ids)
      ? (data.hall_pass_ids as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    const oc = overlapCount(viewerIds, candIds);
    return { id, data, overlap: oc };
  });

  const sorted = [...scored].sort((a, b) => b.overlap - a.overlap);
  const groups = new Map<number, typeof sorted>();
  for (const row of sorted) {
    const g = groups.get(row.overlap) ?? [];
    g.push(row);
    groups.set(row.overlap, g);
  }
  const keys = [...groups.keys()].sort((a, b) => b - a);
  const ordered: typeof sorted = [];
  for (const k of keys) {
    ordered.push(...shuffle(groups.get(k) ?? []));
  }

  const top = ordered.slice(0, 25).map(({ id, data, overlap }) => {
    const hall_pass = hallPassFromProfile(data, nameLookup);
    const u: SwipeCandidateUser = {
      kind: "user",
      id,
      display_name: String(data.display_name ?? ""),
      partner_display_name:
        typeof data.partner_display_name === "string"
          ? data.partner_display_name
          : null,
      account_kind: parseAccountKind(data.account_kind),
      gender: parseGender(data.gender),
      relationship_intent: parseIntent(data.relationship_intent),
      is_verified_celebrity: Boolean(data.is_verified_celebrity),
      verified_lookalike_celebrity_id:
        typeof data.verified_lookalike_celebrity_id === "string"
          ? data.verified_lookalike_celebrity_id
          : null,
      overlap_count: overlap,
      hall_pass,
    };
    return u;
  });

  const campaignQ = query(
    collection(db, "celebrities"),
    where("is_active_campaign", "==", true),
    limit(1)
  );
  const campaignSnap = await getDocs(campaignQ);
  const campaignDoc = campaignSnap.docs[0];

  if (campaignDoc) {
    const c = campaignDoc.data();
    const row = {
      id: campaignDoc.id,
      name: String(c.name ?? "Featured"),
      image_url: typeof c.image_url === "string" ? c.image_url : null,
      campaign_video_url:
        typeof c.campaign_video_url === "string" ? c.campaign_video_url : null,
      campaign_cta_link:
        typeof c.campaign_cta_link === "string" ? c.campaign_cta_link : null,
      campaign_cta_text:
        typeof c.campaign_cta_text === "string" ? c.campaign_cta_text : null,
    };
    return [campaignRowToSwipeCandidate(row), ...top];
  }

  return top;
}
