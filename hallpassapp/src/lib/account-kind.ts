import type { AccountKind } from "@/types/database";

export type { AccountKind };

export const ACCOUNT_KIND_OPTIONS: {
  value: AccountKind;
  label: string;
  description: string;
}[] = [
  {
    value: "single",
    label: "Single",
    description: "Just you on this account.",
  },
  {
    value: "couple",
    label: "Couple",
    description: "You and a partner share one account and one Hall Pass list.",
  },
];

export function isAccountKind(value: unknown): value is AccountKind {
  return value === "single" || value === "couple";
}

/** Card / header copy: couples show both first names. */
export function formatAccountDisplayName(
  accountKind: AccountKind,
  displayName: string,
  partnerDisplayName: string | null
): string {
  const primary = displayName.trim();
  if (accountKind === "couple" && partnerDisplayName?.trim()) {
    return `${primary} & ${partnerDisplayName.trim()}`;
  }
  return primary || "Member";
}

/** Registration validation before sign-up. */
export function validateAccountRegistration(
  accountKind: AccountKind,
  displayName: string,
  partnerDisplayName: string
): { ok: true } | { ok: false; message: string } {
  const name = displayName.trim();
  if (!name) {
    return { ok: false, message: "Enter your display name." };
  }
  if (accountKind === "couple") {
    const partner = partnerDisplayName.trim();
    if (!partner) {
      return { ok: false, message: "Add your partner’s name for a couple account." };
    }
  }
  return { ok: true };
}
