import type Stripe from "stripe";
import type { SubscriptionTier } from "@/types/database";

/** Map Stripe Subscription status to app tier (Premium vs free). */
export function subscriptionTierFromStripeStatus(
  status: Stripe.Subscription.Status
): SubscriptionTier {
  if (
    status === "active" ||
    status === "trialing" ||
    status === "past_due"
  ) {
    return "premium";
  }
  return "free";
}

export function isPremiumTier(tier: SubscriptionTier | string | null | undefined): boolean {
  return tier === "premium";
}
