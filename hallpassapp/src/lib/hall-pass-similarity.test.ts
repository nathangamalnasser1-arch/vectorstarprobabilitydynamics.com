import { describe, expect, it } from "vitest";
import { overlapCount, rankCandidatesBySharedHallPass } from "./hall-pass-similarity";

describe("hall-pass-similarity", () => {
  it("overlapCount counts intersection of viewer and candidate picks", () => {
    const viewer = new Set(["a", "b"]);
    expect(overlapCount(viewer, ["a", "c"])).toBe(1);
    expect(overlapCount(viewer, ["a", "b"])).toBe(2);
    expect(overlapCount(viewer, ["x"])).toBe(0);
  });

  it("rankCandidatesBySharedHallPass orders by descending shared picks", () => {
    const viewer = ["g1", "g2"];
    const ranked = rankCandidatesBySharedHallPass(viewer, [
      { id: "u1", celebrityIds: ["g1"] },
      { id: "u2", celebrityIds: ["g1", "g2", "x"] },
      { id: "u3", celebrityIds: ["z"] },
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["u2", "u1", "u3"]);
    expect(ranked.map((r) => r.overlapCount)).toEqual([2, 1, 0]);
  });

  it("uses stable id tie-break when overlap is equal", () => {
    const viewer = ["g1"];
    const ranked = rankCandidatesBySharedHallPass(viewer, [
      { id: "b", celebrityIds: ["g1"] },
      { id: "a", celebrityIds: ["g1"] },
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
