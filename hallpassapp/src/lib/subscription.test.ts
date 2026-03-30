import { describe, expect, it } from "vitest";
import { isPremiumTier, subscriptionTierFromStripeStatus } from "./subscription";

describe("subscriptionTierFromStripeStatus", () => {
  it("returns premium for active and trialing", () => {
    expect(subscriptionTierFromStripeStatus("active")).toBe("premium");
    expect(subscriptionTierFromStripeStatus("trialing")).toBe("premium");
  });

  it("returns premium for past_due (grace period)", () => {
    expect(subscriptionTierFromStripeStatus("past_due")).toBe("premium");
  });

  it("returns free for canceled, unpaid, and other terminal states", () => {
    expect(subscriptionTierFromStripeStatus("canceled")).toBe("free");
    expect(subscriptionTierFromStripeStatus("unpaid")).toBe("free");
    expect(subscriptionTierFromStripeStatus("incomplete")).toBe("free");
    expect(subscriptionTierFromStripeStatus("incomplete_expired")).toBe("free");
    expect(subscriptionTierFromStripeStatus("paused")).toBe("free");
  });
});

describe("isPremiumTier", () => {
  it("is true only for premium", () => {
    expect(isPremiumTier("premium")).toBe(true);
    expect(isPremiumTier("free")).toBe(false);
    expect(isPremiumTier(null)).toBe(false);
    expect(isPremiumTier(undefined)).toBe(false);
  });
});
