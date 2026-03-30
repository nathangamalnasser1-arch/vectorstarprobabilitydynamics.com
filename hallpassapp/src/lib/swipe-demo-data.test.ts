import { describe, expect, it } from "vitest";
import {
  DEMO_CAMPAIGN_CARD,
  getDemoSwipeCandidates,
  getDemoSwipeCandidatesForViewer,
} from "./swipe-demo-data";
import type { SwipeCandidateUser } from "@/types/swipe";

function usersOnly(list: ReturnType<typeof getDemoSwipeCandidatesForViewer>) {
  return list.filter((c): c is SwipeCandidateUser => c.kind === "user");
}

describe("getDemoSwipeCandidatesForViewer", () => {
  it("injects demo campaign card at index 0", () => {
    const ranked = getDemoSwipeCandidatesForViewer(["c-scarlett", "c-zendaya"]);
    expect(ranked[0]).toEqual(DEMO_CAMPAIGN_CARD);
  });

  it("orders users by overlap with guest picks (Scarlett + Zendaya bumps Taylor first)", () => {
    const ranked = usersOnly(getDemoSwipeCandidatesForViewer(["c-scarlett", "c-zendaya"]));
    expect(ranked[0]?.id).toBe("demo-d");
    expect(ranked[0]?.overlap_count).toBe(2);
  });

  it("seeking women shows single women only (not couples—matches Discover RPC)", () => {
    const ranked = usersOnly(
      getDemoSwipeCandidatesForViewer(["c-ryan", "c-brad"], ["women"])
    );
    expect(ranked.length).toBeGreaterThan(0);
    expect(
      ranked.every(
        (c) => c.account_kind === "single" && c.gender === "female"
      )
    ).toBe(true);
  });

  it("seeking men shows single men only", () => {
    const ranked = usersOnly(
      getDemoSwipeCandidatesForViewer(["c-scarlett", "c-zendaya"], ["men"])
    );
    expect(
      ranked.every(
        (c) => c.account_kind === "single" && c.gender === "male"
      )
    ).toBe(true);
    expect(ranked[0]?.id).toBe("demo-e");
  });

  it("seeking couples shows only couple accounts", () => {
    const ranked = usersOnly(
      getDemoSwipeCandidatesForViewer(["c-ryan", "c-brad"], ["couples"])
    );
    expect(ranked.every((c) => c.account_kind === "couple")).toBe(true);
    expect(ranked.map((c) => c.id).sort()).toEqual(["demo-b", "demo-d"]);
  });

  it("matches default demo ordering when using same default viewer ids and no filter", () => {
    const a = usersOnly(getDemoSwipeCandidates());
    const b = usersOnly(getDemoSwipeCandidatesForViewer(["c-ryan", "c-brad"], null));
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });
});
