import { describe, expect, it } from "vitest";
import { campaignRowToSwipeCandidate } from "./campaign-card";
import { normalizeSwipeRow } from "./swipe-candidates";

describe("normalizeSwipeRow", () => {
  it("maps RPC row to SwipeCandidate", () => {
    const c = normalizeSwipeRow({
      id: "u1",
      display_name: "Alex",
      partner_display_name: "Jordan",
      account_kind: "couple",
      gender: "female",
      relationship_intent: "single",
      is_verified_celebrity: false,
      verified_lookalike_celebrity_id: null,
      overlap_count: 3,
      hall_pass: [{ id: "c1", name: "Ryan Gosling" }],
    });
    expect(c.kind).toBe("user");
    expect(c.gender).toBe("female");
    expect(c.account_kind).toBe("couple");
    expect(c.partner_display_name).toBe("Jordan");
    expect(c.overlap_count).toBe(3);
    expect(c.hall_pass).toEqual([{ id: "c1", name: "Ryan Gosling" }]);
    expect(c.relationship_intent).toBe("single");
  });

  it("defaults invalid hall_pass to empty array", () => {
    const c = normalizeSwipeRow({
      id: "u1",
      display_name: "Alex",
      partner_display_name: null,
      account_kind: null,
      gender: null,
      relationship_intent: null,
      is_verified_celebrity: false,
      verified_lookalike_celebrity_id: null,
      overlap_count: 0,
      hall_pass: null,
    });
    expect(c.hall_pass).toEqual([]);
  });
});

describe("campaignRowToSwipeCandidate", () => {
  it("maps celebrity campaign row to campaign swipe card", () => {
    const c = campaignRowToSwipeCandidate({
      id: "celeb-uuid",
      name: "Studio Star",
      image_url: "https://example.com/poster.jpg",
      campaign_video_url: "https://example.com/t.mp4",
      campaign_cta_link: "https://example.com/go",
      campaign_cta_text: "Watch trailer",
    });
    expect(c.kind).toBe("campaign");
    expect(c.celebrity_id).toBe("celeb-uuid");
    expect(c.display_name).toBe("Studio Star");
    expect(c.campaign_cta_text).toBe("Watch trailer");
  });
});
