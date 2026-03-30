import { describe, expect, it } from "vitest";
import {
  candidateMatchesSeeking,
  defaultSeekingFromLegacyGender,
  parseSeekingArray,
  toggleSeekingOption,
  validateSeeking,
} from "./discovery-match";

describe("candidateMatchesSeeking", () => {
  it("treats null, empty, or everyone as match-all", () => {
    const c = {
      account_kind: "single" as const,
      gender: "male" as const,
    };
    expect(candidateMatchesSeeking(null, c)).toBe(true);
    expect(candidateMatchesSeeking([], c)).toBe(true);
    expect(candidateMatchesSeeking(["everyone"], c)).toBe(true);
  });

  it("matches couples only when seeking includes couples", () => {
    const couple = { account_kind: "couple" as const, gender: "female" as const };
    expect(candidateMatchesSeeking(["couples"], couple)).toBe(true);
    expect(candidateMatchesSeeking(["women"], couple)).toBe(false);
    expect(candidateMatchesSeeking(["men", "women"], couple)).toBe(false);
  });

  it("matches single men when seeking includes men", () => {
    const m = { account_kind: "single" as const, gender: "male" as const };
    expect(candidateMatchesSeeking(["men"], m)).toBe(true);
    expect(candidateMatchesSeeking(["women"], m)).toBe(false);
  });

  it("matches single women when seeking includes women", () => {
    const f = { account_kind: "single" as const, gender: "female" as const };
    expect(candidateMatchesSeeking(["women"], f)).toBe(true);
    expect(candidateMatchesSeeking(["men"], f)).toBe(false);
  });

  it("maps non_binary and other genders to non_binary tag", () => {
    const nb = { account_kind: "single" as const, gender: "non_binary" as const };
    const o = { account_kind: "single" as const, gender: "other" as const };
    expect(candidateMatchesSeeking(["non_binary"], nb)).toBe(true);
    expect(candidateMatchesSeeking(["non_binary"], o)).toBe(true);
    expect(candidateMatchesSeeking(["men"], nb)).toBe(false);
  });
});

describe("toggleSeekingOption", () => {
  it("selecting everyone replaces other tags", () => {
    expect(toggleSeekingOption(["men"], "everyone")).toEqual(["everyone"]);
  });

  it("selecting a tag clears everyone", () => {
    expect(toggleSeekingOption(["everyone"], "women")).toEqual(["women"]);
  });
});

describe("parseSeekingArray", () => {
  it("filters invalid entries", () => {
    expect(parseSeekingArray(["men", "nope", "women"])).toEqual([
      "men",
      "women",
    ]);
  });
});

describe("defaultSeekingFromLegacyGender", () => {
  it("maps legacy preview defaults", () => {
    expect(defaultSeekingFromLegacyGender("male")).toEqual(["women"]);
    expect(defaultSeekingFromLegacyGender("female")).toEqual(["men"]);
    expect(defaultSeekingFromLegacyGender("non_binary")).toEqual(["everyone"]);
    expect(defaultSeekingFromLegacyGender(null)).toEqual(["everyone"]);
  });
});

describe("validateSeeking", () => {
  it("requires at least one tag", () => {
    expect(validateSeeking([])).toBe(false);
    expect(validateSeeking(["men"])).toBe(true);
  });
});
