"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { HallPassCelebritySearch } from "@/components/try/HallPassCelebritySearch";
import {
  SEEKING_OPTIONS,
  toggleSeekingOption,
} from "@/lib/discovery-match";
import {
  loadGuestTryState,
  saveGuestTryState,
  type GuestPick,
} from "@/lib/guest-hall-pass";
import { getDemoSwipeCandidatesForViewer } from "@/lib/swipe-demo-data";
import type { SeekingOption } from "@/types/database";
import type { SwipeCandidate } from "@/types/swipe";

type Phase = "pick" | "swipe";

export function TryClient() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [selection, setSelection] = useState<GuestPick[]>([]);
  const [seeking, setSeeking] = useState<SeekingOption[]>(["everyone"]);
  const [candidates, setCandidates] = useState<SwipeCandidate[]>([]);
  const [likeToast, setLikeToast] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const { picks, seeking: s } = loadGuestTryState();
    setSelection(picks);
    setSeeking(s ?? ["everyone"]);
    if (picks.length >= 1) {
      setCandidates(
        getDemoSwipeCandidatesForViewer(picks.map((p) => p.id), s ?? ["everyone"])
      );
      setPhase("swipe");
    }
    setHydrated(true);
  }, []);

  const selectionCount = selection.length;
  const canContinue = selectionCount >= 1;

  const onAdd = useCallback(
    (pick: GuestPick) => {
      setSelection((prev) => {
        if (prev.some((p) => p.id === pick.id)) return prev;
        const next = [...prev, pick];
        saveGuestTryState({ picks: next, seeking });
        return next;
      });
    },
    [seeking]
  );

  const onRemove = useCallback(
    (id: string) => {
      setSelection((prev) => {
        const next = prev.filter((p) => p.id !== id);
        saveGuestTryState({ picks: next, seeking });
        return next;
      });
    },
    [seeking]
  );

  const onSeekingToggle = useCallback(
    (opt: SeekingOption) => {
      setSeeking((prev) => {
        const next = toggleSeekingOption(prev, opt);
        saveGuestTryState({ picks: selection, seeking: next });
        return next;
      });
    },
    [selection]
  );

  const goToSwipe = useCallback(() => {
    if (selection.length < 1) return;
    saveGuestTryState({ picks: selection, seeking });
    setCandidates(
      getDemoSwipeCandidatesForViewer(
        selection.map((p) => p.id),
        seeking
      )
    );
    setPhase("swipe");
  }, [selection, seeking]);

  const onGuestLike = useCallback(() => {
    setLikeToast(true);
    window.setTimeout(() => setLikeToast(false), 4200);
  }, []);

  const headline = useMemo(() => {
    if (phase === "pick") return "Build your Hall Pass list";
    return "Preview Discover";
  }, [phase]);

  if (!hydrated) {
    return (
      <p className="text-center text-[var(--hp-ink-muted)]">Loading…</p>
    );
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6">
      <div className="w-full rounded-2xl border border-[var(--hp-border)] bg-[var(--hp-surface)] px-4 py-4 shadow-sm sm:px-5">
        <p className="text-center text-sm leading-relaxed text-[var(--hp-ink-muted)]">
          <span className="font-semibold text-[var(--hp-ink)]">Try without an account:</span>{" "}
          pick from the list, search the database, or add new celebrities—then
          swipe a preview deck ranked by shared taste.{" "}
          <span className="text-[var(--hp-rose-deep)]">
            Choose who you want to see below (men, women, couples, everyone,
            etc.)—same idea as full Discover—with Hall Pass overlap sorting the
            deck.
          </span>{" "}
          Likes never become matches until you create a profile.
        </p>
      </div>

      <div className="w-full text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hp-ink-muted)]">
          {phase === "pick" ? "Step 1 of 2" : "Step 2 of 2"}
        </p>
        <h2 className="font-[family-name:var(--font-hp-display)] text-2xl font-semibold text-[var(--hp-ink)]">
          {headline}
        </h2>
      </div>

      {phase === "pick" ? (
        <>
          <section className="w-full space-y-2 rounded-2xl border border-[var(--hp-border)] bg-zinc-50/40 p-4 dark:bg-zinc-900/30">
            <p className="text-sm font-semibold text-[var(--hp-ink)]">
              Who you want to see (preview)
            </p>
            <p className="text-xs text-[var(--hp-ink-muted)]">
              Tap to toggle. “Everyone” clears other filters. This mirrors the
              logged-in Discover preferences.
            </p>
            <div className="flex flex-col gap-2">
              {SEEKING_OPTIONS.map((opt) => {
                const selected =
                  opt.value === "everyone"
                    ? seeking.includes("everyone")
                    : seeking.includes(opt.value) &&
                      !seeking.includes("everyone");
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSeekingToggle(opt.value)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selected
                        ? "border-[rgba(196,92,92,0.5)] bg-rose-50 font-semibold text-[var(--hp-rose-deep)] dark:bg-rose-950/40"
                        : "border-[var(--hp-border)] bg-[var(--hp-surface)] text-[var(--hp-ink-muted)] hover:border-zinc-300"
                    }`}
                  >
                    <span className="block text-[var(--hp-ink)]">{opt.label}</span>
                    <span className="text-xs font-normal text-[var(--hp-ink-muted)]">
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <HallPassCelebritySearch
            selected={selection}
            onAdd={onAdd}
            onRemove={onRemove}
          />
          <p className="text-center text-sm text-[var(--hp-ink-muted)]">
            Choose at least one Hall Pass pick, then continue. Ranking uses your
            picks and who you want to see (above).
          </p>
          <button
            type="button"
            disabled={!canContinue}
            onClick={goToSwipe}
            className="hp-btn-primary w-full max-w-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to swipe
          </button>
        </>
      ) : (
        <>
          <div className="flex w-full flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="text-sm font-semibold text-[var(--hp-rose)] underline"
              onClick={() => setPhase("pick")}
            >
              Edit my Hall Pass list
            </button>
            <Link
              href="/onboarding"
              className="rounded-full border border-[var(--hp-border)] px-4 py-2 text-sm font-semibold text-[var(--hp-ink)]"
            >
              Create account to match
            </Link>
          </div>
          <SwipeDeck
            initialCandidates={candidates}
            supabase={null}
            viewerId={null}
            swipeMode="guest"
            onGuestLike={onGuestLike}
          />
        </>
      )}

      {likeToast ? (
        <div
          role="status"
          className="fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-[var(--hp-border)] bg-[var(--hp-surface)] px-4 py-3 text-center text-sm text-[var(--hp-ink)] shadow-[var(--hp-shadow)]"
        >
          Like saved in preview only.{" "}
          <Link href="/onboarding" className="font-semibold text-[var(--hp-rose)]">
            Create an account
          </Link>{" "}
          to turn likes into real matches.
        </div>
      ) : null}
    </div>
  );
}
