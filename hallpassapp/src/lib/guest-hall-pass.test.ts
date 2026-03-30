import { afterEach, describe, expect, it } from "vitest";
import {
  loadGuestTryState,
  saveGuestTryState,
  type GuestPick,
} from "./guest-hall-pass";

describe("guest-hall-pass", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("saveGuestTryState persists picks and seeking", () => {
    const picks: GuestPick[] = [
      { id: "c-ryan", name: "Ryan Gosling" },
      { id: "local-x", name: "Custom Name" },
    ];
    saveGuestTryState({ picks, seeking: ["women"] });
    const s = loadGuestTryState();
    expect(s.picks).toEqual(picks);
    expect(s.seeking).toEqual(["women"]);
  });

  it("dedupes picks by id on save", () => {
    saveGuestTryState({
      picks: [
        { id: "a", name: "A" },
        { id: "a", name: "A" },
      ],
      seeking: null,
    });
    expect(loadGuestTryState().picks).toEqual([{ id: "a", name: "A" }]);
  });
});
