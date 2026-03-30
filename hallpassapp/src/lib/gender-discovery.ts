import type { ProfileGender } from "@/types/database";

export const PROFILE_GENDER_OPTIONS: {
  value: ProfileGender;
  label: string;
  hint: string;
}[] = [
  {
    value: "male",
    label: "Man",
    hint: "Defaults who you see in Discover; you can pick men, women, couples, and more next.",
  },
  {
    value: "female",
    label: "Woman",
    hint: "Defaults who you see in Discover; you choose the full mix on the next step.",
  },
  {
    value: "non_binary",
    label: "Non-binary",
    hint: "You choose who you want to see; overlap still ranks your deck.",
  },
  {
    value: "other",
    label: "Prefer to self-describe later",
    hint: "You choose who you want to see; you can refine gender on your profile later.",
  },
];

/**
 * Default discovery: men see women, women see men (similar Hall Pass overlap within that pool).
 * Non-binary / other / unknown → show full pool (no gender gate).
 */
export function shouldIncludeCandidateForViewer(
  viewerGender: ProfileGender | null | undefined,
  candidateGender: ProfileGender | null | undefined
): boolean {
  if (
    viewerGender == null ||
    viewerGender === "non_binary" ||
    viewerGender === "other"
  ) {
    return true;
  }
  if (viewerGender === "male") {
    return candidateGender === "female";
  }
  if (viewerGender === "female") {
    return candidateGender === "male";
  }
  return true;
}

export function isProfileGender(value: unknown): value is ProfileGender {
  return (
    value === "male" ||
    value === "female" ||
    value === "non_binary" ||
    value === "other"
  );
}
