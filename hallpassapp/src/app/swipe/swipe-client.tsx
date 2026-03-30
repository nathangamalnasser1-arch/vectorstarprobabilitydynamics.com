"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { getPrimaryBackend } from "@/lib/data-backend";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { recordUserSwipeFirebase } from "@/lib/firebase/record-user-swipe";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadSwipeCandidates } from "@/lib/swipe-candidates";
import type { SwipeCandidate } from "@/types/swipe";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";

export function SwipeClient() {
  const supabase = getSupabaseBrowserClient();
  const backend = getPrimaryBackend();
  const needsAuth = backend !== "none";
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let firebaseUid: string | null = null;

      if (backend === "firebase") {
        firebaseUid = getFirebaseAuth()?.currentUser?.uid ?? null;
        setViewerId(firebaseUid);
      } else if (backend === "supabase" && supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          setViewerId(null);
          setCandidates([]);
          setLoading(false);
          return;
        }
        setViewerId(sessionData.session.user.id);
      } else {
        setViewerId(null);
      }

      const list = await loadSwipeCandidates(supabase, firebaseUid);
      setCandidates(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load profiles");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [backend, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (backend !== "firebase") return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, () => {
      void load();
    });
    return unsub;
  }, [backend, load]);

  const onRecordUserSwipe =
    backend === "firebase"
      ? async (targetId: string, direction: "like" | "pass") => {
          const db = getFirebaseDb();
          const uid = getFirebaseAuth()?.currentUser?.uid;
          if (!db || !uid) return;
          await recordUserSwipeFirebase(db, uid, targetId, direction);
        }
      : undefined;

  if (needsAuth && backend === "supabase" && supabase) {
    if (!loading && !viewerId) {
      return (
        <div className="mx-auto max-w-md rounded-3xl border border-[var(--hp-border)] bg-[var(--hp-surface)] px-8 py-12 text-center shadow-[var(--hp-shadow)]">
          <p className="text-lg text-[var(--hp-ink)]">
            Sign in to see people ranked by shared Hall Pass picks.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex rounded-full bg-[var(--hp-rose)] px-6 py-3 text-sm font-semibold text-white"
          >
            Go to onboarding
          </Link>
        </div>
      );
    }
  }

  if (needsAuth && backend === "firebase") {
    if (!loading && !viewerId) {
      return (
        <div className="mx-auto max-w-md rounded-3xl border border-[var(--hp-border)] bg-[var(--hp-surface)] px-8 py-12 text-center shadow-[var(--hp-shadow)]">
          <p className="text-lg text-[var(--hp-ink)]">
            Sign in to see people ranked by shared Hall Pass picks.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-[var(--hp-rose)] px-6 py-3 text-sm font-semibold text-white"
          >
            Log in
          </Link>
        </div>
      );
    }
  }

  if (loading) {
    return (
      <p className="text-center text-[var(--hp-ink-muted)]">Loading deck…</p>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-[var(--hp-rose)] underline"
          onClick={() => void load()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <SwipeDeck
      initialCandidates={candidates}
      supabase={supabase}
      viewerId={viewerId}
      onRecordUserSwipe={onRecordUserSwipe}
    />
  );
}
