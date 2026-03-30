import type { RelationshipIntent } from "@/types/database";

export const RELATIONSHIP_INTENTS: {
  value: RelationshipIntent;
  label: string;
  description: string;
}[] = [
  {
    value: "single",
    label: "Single",
    description:
      "You are dating openly on your own terms. Be clear and respectful with matches.",
  },
  {
    value: "cnm",
    label: "Consensually Non-Monogamous",
    description:
      "Open or poly dynamics with explicit consent from everyone involved.",
  },
  {
    value: "browsing",
    label: "Browsing for Fun",
    description:
      "Hypothetical exploration—great for couples keeping it playful and above board.",
  },
];

const ALLOWED = new Set<RelationshipIntent>(["single", "cnm", "browsing"]);

export function isRelationshipIntent(
  value: unknown
): value is RelationshipIntent {
  return typeof value === "string" && ALLOWED.has(value as RelationshipIntent);
}

export function parseRelationshipIntent(
  value: unknown
): RelationshipIntent | null {
  return isRelationshipIntent(value) ? value : null;
}
