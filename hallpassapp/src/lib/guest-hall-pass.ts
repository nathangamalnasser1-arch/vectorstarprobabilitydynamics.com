import { staticCelebrityNameById } from "@/data/static-celebrities";
import {
  defaultSeekingFromLegacyGender,
  parseSeekingArray,
} from "@/lib/discovery-match";
import { isProfileGender } from "@/lib/gender-discovery";
import type { ProfileGender, SeekingOption } from "@/types/database";

export const GUEST_HALL_PASS_KEY = "hallpass_guest_try_v1";

export type GuestPick = { id: string; name: string };

/** Legacy shape (ids only). Migrated on read. */
type GuestHallPassStoredV1 = {
  celebrityIds: string[];
  updatedAt: string;
};

export type GuestHallPassStored = {
  picks: GuestPick[];
  seeking?: SeekingOption[] | null;
  /** Legacy preview field — migrated to `seeking` on read. */
  viewerGender?: ProfileGender | null;
  updatedAt: string;
};

function dedupePicks(picks: GuestPick[]): GuestPick[] {
  const seen = new Set<string>();
  const deduped: GuestPick[] = [];
  for (const p of picks) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    deduped.push({ id: p.id, name: p.name.trim() || p.id });
  }
  return deduped;
}

export function loadGuestTryState(): {
  picks: GuestPick[];
  seeking: SeekingOption[] | null;
} {
  if (typeof window === "undefined") {
    return { picks: [], seeking: null };
  }
  try {
    const raw = localStorage.getItem(GUEST_HALL_PASS_KEY);
    if (!raw) return { picks: [], seeking: null };
    const parsed = JSON.parse(raw) as unknown;

    let picks: GuestPick[] = [];
    let viewerGender: ProfileGender | null = null;
    let seeking: SeekingOption[] | null = null;
    let seekingKeyPresent = false;

    if (
      parsed &&
      typeof parsed === "object" &&
      "viewerGender" in parsed &&
      isProfileGender((parsed as { viewerGender: unknown }).viewerGender)
    ) {
      viewerGender = (parsed as { viewerGender: ProfileGender }).viewerGender;
    }

    if (parsed && typeof parsed === "object" && "seeking" in parsed) {
      seekingKeyPresent = true;
      seeking = parseSeekingArray((parsed as { seeking: unknown }).seeking);
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "picks" in parsed &&
      Array.isArray((parsed as { picks: unknown }).picks)
    ) {
      picks = (parsed as { picks: GuestPick[] }).picks.filter(
        (x): x is GuestPick =>
          Boolean(x) &&
          typeof x.id === "string" &&
          typeof x.name === "string"
      );
    } else if (
      parsed &&
      typeof parsed === "object" &&
      "celebrityIds" in parsed &&
      Array.isArray((parsed as GuestHallPassStoredV1).celebrityIds)
    ) {
      const ids = (parsed as GuestHallPassStoredV1).celebrityIds;
      picks = ids.map((id) => ({
        id,
        name: staticCelebrityNameById(id) ?? id,
      }));
      if (!seekingKeyPresent && seeking === null) {
        seeking = defaultSeekingFromLegacyGender(viewerGender);
      }
      saveGuestTryState({ picks, seeking: seeking ?? ["everyone"] });
    }

    if (!seekingKeyPresent && seeking === null && viewerGender !== null) {
      seeking = defaultSeekingFromLegacyGender(viewerGender);
    }

    return { picks, seeking };
  } catch {
    /* ignore */
  }
  return { picks: [], seeking: null };
}

export function saveGuestTryState(payload: {
  picks: GuestPick[];
  seeking: SeekingOption[] | null;
}): void {
  if (typeof window === "undefined") return;
  const out: GuestHallPassStored = {
    picks: dedupePicks(payload.picks),
    seeking: payload.seeking,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(GUEST_HALL_PASS_KEY, JSON.stringify(out));
}

export function loadGuestPicks(): GuestPick[] {
  return loadGuestTryState().picks;
}

export function saveGuestPicks(
  picks: GuestPick[],
  seeking?: SeekingOption[] | null
): void {
  const prev = loadGuestTryState();
  saveGuestTryState({
    picks,
    seeking: seeking !== undefined ? seeking : prev.seeking,
  });
}

/** @deprecated use loadGuestPicks */
export function loadGuestCelebrityIds(): string[] {
  return loadGuestPicks().map((p) => p.id);
}

/** @deprecated use saveGuestPicks */
export function saveGuestCelebrityIds(ids: string[]): void {
  const picks: GuestPick[] = ids.map((id) => ({
    id,
    name: staticCelebrityNameById(id) ?? id,
  }));
  saveGuestPicks(picks);
}
