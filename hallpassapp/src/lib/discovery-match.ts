import type {
  AccountKind,
  ProfileGender,
  SeekingOption,
} from "@/types/database";

export const SEEKING_OPTIONS: {
  value: SeekingOption;
  label: string;
  description: string;
}[] = [
  {
    value: "everyone",
    label: "Everyone",
    description: "No filter on who you see—Hall Pass overlap still ranks the deck.",
  },
  {
    value: "men",
    label: "Men",
    description: "Single profiles marked as men.",
  },
  {
    value: "women",
    label: "Women",
    description: "Single profiles marked as women.",
  },
  {
    value: "non_binary",
    label: "Non-binary people",
    description: "Singles who use non-binary or prefer not to say for gender.",
  },
  {
    value: "couples",
    label: "Couples",
    description: "Shared couple accounts only.",
  },
];

export function isSeekingOption(value: unknown): value is SeekingOption {
  return (
    value === "everyone" ||
    value === "men" ||
    value === "women" ||
    value === "non_binary" ||
    value === "couples"
  );
}

export function parseSeekingArray(raw: unknown): SeekingOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isSeekingOption);
}

/** Map legacy gender-only demo defaults to seeking tags (guest storage migration). */
export function defaultSeekingFromLegacyGender(
  g: ProfileGender | null | undefined
): SeekingOption[] {
  if (g === "male") return ["women"];
  if (g === "female") return ["men"];
  return ["everyone"];
}

export function validateSeeking(seeking: SeekingOption[]): boolean {
  return seeking.length > 0;
}

/**
 * Mirrors SQL in get_swipe_candidates (after effective-seeking migration): who the viewer
 * wants to see vs candidate. Null/empty here means “no tag filter” for demo/offline only;
 * production RPC derives defaults from gender when seeking is unset.
 */
export function candidateMatchesSeeking(
  seeking: SeekingOption[] | null | undefined,
  candidate: {
    account_kind: AccountKind;
    gender: ProfileGender | null;
  }
): boolean {
  if (!seeking || seeking.length === 0) {
    return true;
  }
  if (seeking.includes("everyone")) {
    return true;
  }

  if (candidate.account_kind === "couple") {
    return seeking.includes("couples");
  }

  const g = candidate.gender;
  if (g === "male") return seeking.includes("men");
  if (g === "female") return seeking.includes("women");
  if (g === "non_binary" || g === "other") return seeking.includes("non_binary");

  return false;
}

export function toggleSeekingOption(
  current: SeekingOption[],
  option: SeekingOption
): SeekingOption[] {
  if (option === "everyone") {
    return current.includes("everyone") ? [] : ["everyone"];
  }
  const rest = current.filter((x) => x !== "everyone");
  if (rest.includes(option)) {
    return rest.filter((x) => x !== option);
  }
  return [...rest, option];
}
