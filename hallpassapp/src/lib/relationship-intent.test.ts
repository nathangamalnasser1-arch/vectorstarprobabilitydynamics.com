import { describe, expect, it } from "vitest";
import {
  isRelationshipIntent,
  parseRelationshipIntent,
  RELATIONSHIP_INTENTS,
} from "./relationship-intent";

describe("relationship-intent", () => {
  it("lists exactly three mandatory intents with stable values", () => {
    expect(RELATIONSHIP_INTENTS).toHaveLength(3);
    expect(RELATIONSHIP_INTENTS.map((i) => i.value).sort()).toEqual([
      "browsing",
      "cnm",
      "single",
    ]);
  });

  it("isRelationshipIntent accepts only single, cnm, browsing", () => {
    expect(isRelationshipIntent("single")).toBe(true);
    expect(isRelationshipIntent("cnm")).toBe(true);
    expect(isRelationshipIntent("browsing")).toBe(true);
    expect(isRelationshipIntent("married")).toBe(false);
    expect(isRelationshipIntent("")).toBe(false);
    expect(isRelationshipIntent(null)).toBe(false);
  });

  it("parseRelationshipIntent returns the value or null", () => {
    expect(parseRelationshipIntent("cnm")).toBe("cnm");
    expect(parseRelationshipIntent("invalid")).toBeNull();
  });
});
