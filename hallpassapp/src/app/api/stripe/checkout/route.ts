import { createClient } from "@supabase/supabase-js";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe-server";

function appBaseUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

type ResolvedUser = { id: string; email: string | null };

async function resolveUser(request: Request): Promise<ResolvedUser | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const fbAuth = getFirebaseAdminAuth();
  if (fbAuth) {
    try {
      const decoded = await fbAuth.verifyIdToken(token);
      return { id: decoded.uid, email: decoded.email ?? null };
    } catch {
      /* try Supabase */
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error,
    } = await userClient.auth.getUser();
    if (!error && user) {
      return { id: user.id, email: user.email ?? null };
    }
  }

  return null;
}

async function loadStripeCustomerId(
  userId: string,
  _email: string | null
): Promise<{ customerId: string | null; error: string | null }> {
  const adminDb = getFirebaseAdminDb();
  if (adminDb) {
    const snap = await adminDb.collection("profiles").doc(userId).get();
    if (!snap.exists) {
      return { customerId: null, error: "Profile not found" };
    }
    const d = snap.data();
    const cid = typeof d?.stripe_customer_id === "string" ? d.stripe_customer_id : null;
    return { customerId: cid, error: null };
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", userId)
      .single();
    if (profileErr || !profile) {
      return { customerId: null, error: "Profile not found" };
    }
    return {
      customerId: (profile.stripe_customer_id as string | null) ?? null,
      error: null,
    };
  }

  return { customerId: null, error: "Server cannot read billing records." };
}

async function saveStripeCustomerId(
  userId: string,
  customerId: string
): Promise<{ ok: boolean; error: string | null }> {
  const adminDb = getFirebaseAdminDb();
  if (adminDb) {
    await adminDb.collection("profiles").doc(userId).update({
      stripe_customer_id: customerId,
      updated_at: FieldValue.serverTimestamp(),
    });
    return { ok: true, error: null };
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  }

  return { ok: false, error: "Server cannot update billing records." };
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;

  if (!stripe || !priceId) {
    return NextResponse.json(
      { error: "Billing is not configured on the server." },
      { status: 503 }
    );
  }

  const user = await resolveUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerId: existingId, error: loadErr } = await loadStripeCustomerId(
    user.id,
    user.email
  );
  if (loadErr) {
    return NextResponse.json({ error: loadErr }, { status: 404 });
  }

  let customerId = existingId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { app_user_id: user.id },
    });
    customerId = customer.id;
    const saved = await saveStripeCustomerId(user.id, customerId);
    if (!saved.ok) {
      return NextResponse.json(
        { error: saved.error ?? "Could not save billing customer." },
        { status: 500 }
      );
    }
  }

  const base = appBaseUrl(request);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/swipe?checkout=success`,
    cancel_url: `${base}/swipe?checkout=cancel`,
    metadata: { app_user_id: user.id },
    subscription_data: {
      metadata: { app_user_id: user.id },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Could not start checkout session." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url });
}
