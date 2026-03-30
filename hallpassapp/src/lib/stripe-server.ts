import Stripe from "stripe";

let stripe: Stripe | null = null;

/** Server-only Stripe client. Returns null when `STRIPE_SECRET_KEY` is unset. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}
