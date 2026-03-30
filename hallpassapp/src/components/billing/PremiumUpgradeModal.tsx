"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getPrimaryBackend, isAuthBackendConfigured } from "@/lib/data-backend";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SubscriptionTier } from "@/types/database";

type PremiumUpgradeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PremiumUpgradeModal({ open, onOpenChange }: PremiumUpgradeModalProps) {
  const titleId = useId();
  const supabase = getSupabaseBrowserClient();
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [loadingTier, setLoadingTier] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTier = useCallback(async () => {
    setLoadingTier(true);
    try {
      if (getPrimaryBackend() === "firebase") {
        const auth = getFirebaseAuth();
        const db = getFirebaseDb();
        const user = auth?.currentUser;
        if (!auth || !db || !user) {
          setTier(null);
          return;
        }
        const snap = await getDoc(doc(db, "profiles", user.uid));
        const t = snap.data()?.subscription_tier;
        setTier((t as SubscriptionTier) ?? "free");
        return;
      }

      if (!supabase) {
        setTier(null);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setTier(null);
        return;
      }
      const { data: row, error: qErr } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", sessionData.session.user.id)
        .single();
      if (qErr || !row) {
        setTier(null);
        return;
      }
      setTier((row.subscription_tier as SubscriptionTier) ?? "free");
    } finally {
      setLoadingTier(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!open) return;
    void refreshTier();
  }, [open, refreshTier]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const startCheckout = async () => {
    setError(null);
    let token: string | null = null;
    if (getPrimaryBackend() === "firebase") {
      const auth = getFirebaseAuth();
      token = (await auth?.currentUser?.getIdToken()) ?? null;
    } else {
      if (!supabase) {
        setError("Sign in is required to upgrade.");
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      token = sessionData.session?.access_token ?? null;
    }
    if (!token) {
      setError("Sign in to upgrade to Premium.");
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Checkout could not start.");
        return;
      }
      if (body.url) {
        window.location.href = body.url;
        return;
      }
      setError("No checkout URL returned.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!open) return null;

  const isPremium = tier === "premium";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--hp-border)] bg-[var(--hp-surface)] p-8 shadow-[var(--hp-shadow)]"
      >
        <button
          type="button"
          className="absolute right-4 top-4 rounded-full p-2 text-[var(--hp-ink-muted)] hover:bg-black/5 hover:text-[var(--hp-ink)] dark:hover:bg-white/10"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          ✕
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hp-rose)]">
          Hall Pass Premium
        </p>
        <h2
          id={titleId}
          className="mt-2 font-[family-name:var(--font-hp-display)] text-2xl font-semibold text-[var(--hp-ink)]"
        >
          Upgrade your discover experience
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--hp-ink-muted)]">
          Unlock blurred “who liked you,” advanced intent filters, shared vibe alerts, and more as we
          roll out Premium features.
        </p>

        {!isAuthBackendConfigured() && (
          <p className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            Connect Firebase or Supabase in <code className="font-mono text-xs">.env.local</code> to
            use live billing. API routes still validate configuration server-side.
          </p>
        )}

        {loadingTier ? (
          <p className="mt-6 text-sm text-[var(--hp-ink-muted)]">Checking your plan…</p>
        ) : isPremium ? (
          <p className="mt-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100">
            You&apos;re on <span className="font-semibold">Premium</span>. Enjoy the full Hall Pass.
          </p>
        ) : (
          <ul className="mt-6 space-y-3 text-sm text-[var(--hp-ink)]">
            <li className="flex gap-3">
              <span className="text-[var(--hp-rose)]" aria-hidden>
                ◆
              </span>
              <span>See who swiped on you (likes behind the blur)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--hp-rose)]" aria-hidden>
                ◆
              </span>
              <span>Filter discovery by relationship intent</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--hp-rose)]" aria-hidden>
                ◆
              </span>
              <span>Shared vibe highlights for matching Top 5 lists</span>
            </li>
          </ul>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-full border border-[var(--hp-border)] px-5 py-2.5 text-sm font-semibold text-[var(--hp-ink)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
            onClick={() => onOpenChange(false)}
          >
            {isPremium ? "Close" : "Not now"}
          </button>
          {!isPremium && (
            <button
              type="button"
              className="hp-btn-primary disabled:opacity-60"
              disabled={checkoutLoading || loadingTier}
              onClick={() => void startCheckout()}
            >
              {checkoutLoading ? "Redirecting…" : "Upgrade with Stripe"}
            </button>
          )}
        </div>
        <p className="mt-4 text-center text-[10px] text-[var(--hp-ink-muted)]">
          Secure checkout powered by Stripe. Cancel anytime from your customer portal when enabled.
        </p>
      </div>
    </div>
  );
}
