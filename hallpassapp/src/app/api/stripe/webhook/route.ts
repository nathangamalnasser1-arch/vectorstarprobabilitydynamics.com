import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe-server";
import { subscriptionTierFromStripeStatus } from "@/lib/subscription";

export const runtime = "nodejs";

async function syncSubscriptionToFirebase(
  db: Firestore,
  subscription: Stripe.Subscription
): Promise<void> {
  const tier = subscriptionTierFromStripeStatus(subscription.status);
  const metaUserId =
    subscription.metadata?.app_user_id ??
    subscription.metadata?.supabase_user_id ??
    null;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  let profileId: string | null =
    typeof metaUserId === "string" ? metaUserId : null;
  if (!profileId && customerId) {
    const snap = await db
      .collection("profiles")
      .where("stripe_customer_id", "==", customerId)
      .limit(1)
      .get();
    profileId = snap.docs[0]?.id ?? null;
  }
  if (!profileId) return;

  const patch: Record<string, unknown> = {
    subscription_tier: tier,
    updated_at: FieldValue.serverTimestamp(),
  };
  if (customerId) {
    patch.stripe_customer_id = customerId;
  }
  await db.collection("profiles").doc(profileId).update(patch);
}

async function syncSubscriptionToSupabase(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  subscription: Stripe.Subscription
): Promise<void> {
  const tier = subscriptionTierFromStripeStatus(subscription.status);
  const metaUserId =
    subscription.metadata?.app_user_id ??
    subscription.metadata?.supabase_user_id ??
    null;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  let profileId: string | null =
    typeof metaUserId === "string" ? metaUserId : null;
  if (!profileId && customerId) {
    const { data: row } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    profileId = row?.id ?? null;
  }
  if (!profileId) return;

  const patch: Record<string, string> = {
    subscription_tier: tier,
    updated_at: new Date().toISOString(),
  };
  if (customerId) {
    patch.stripe_customer_id = customerId;
  }
  await admin.from("profiles").update(patch).eq("id", profileId);
}

async function dispatchSubscriptionSync(sub: Stripe.Subscription): Promise<void> {
  const db = getFirebaseAdminDb();
  if (db) {
    await syncSubscriptionToFirebase(db, sub);
    return;
  }
  const admin = getSupabaseAdmin();
  if (admin) {
    await syncSubscriptionToSupabase(admin, sub);
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const hasBackend = getFirebaseAdminDb() || getSupabaseAdmin();

  if (!stripe || !webhookSecret || !hasBackend) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId =
          session.metadata?.app_user_id ??
          session.metadata?.supabase_user_id ??
          session.client_reference_id;
        if (!userId) break;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await dispatchSubscriptionSync(sub);
        } else {
          const db = getFirebaseAdminDb();
          if (db) {
            const patch: Record<string, unknown> = {
              subscription_tier: "premium",
              updated_at: FieldValue.serverTimestamp(),
            };
            if (customerId) {
              patch.stripe_customer_id = customerId;
            }
            await db.collection("profiles").doc(String(userId)).update(patch);
          } else {
            const admin = getSupabaseAdmin();
            if (admin) {
              await admin
                .from("profiles")
                .update({
                  subscription_tier: "premium",
                  stripe_customer_id: customerId ?? undefined,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", userId);
            }
          }
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await dispatchSubscriptionSync(sub);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Stripe webhook handler error", e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
