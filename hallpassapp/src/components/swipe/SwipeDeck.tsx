"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import type { SwipeCandidate, SwipeCandidateUser } from "@/types/swipe";
import type { ProfileGender } from "@/types/database";
import { formatAccountDisplayName } from "@/lib/account-kind";
import { RELATIONSHIP_INTENTS } from "@/lib/relationship-intent";

function intentLabel(intent: SwipeCandidateUser["relationship_intent"]) {
  if (!intent) return "—";
  return RELATIONSHIP_INTENTS.find((i) => i.value === intent)?.label ?? intent;
}

function genderLabel(g: ProfileGender | null) {
  if (!g) return null;
  const map: Record<ProfileGender, string> = {
    male: "Man",
    female: "Woman",
    non_binary: "Non-binary",
    other: "—",
  };
  return map[g];
}

type SwipeDeckProps = {
  initialCandidates: SwipeCandidate[];
  supabase: SupabaseClient | null;
  viewerId: string | null;
  /** When set (e.g. Firebase), persists swipes without Supabase `user_swipes`. */
  onRecordUserSwipe?: (
    targetId: string,
    direction: "like" | "pass"
  ) => Promise<void>;
  /** Guest try mode: no DB swipes; likes cannot become matches until signup. */
  swipeMode?: "member" | "guest";
  /** Fires after each like in guest mode (e.g. upsell to create an account). */
  onGuestLike?: () => void;
};

export function SwipeDeck({
  initialCandidates,
  supabase,
  viewerId,
  onRecordUserSwipe,
  swipeMode = "member",
  onGuestLike,
}: SwipeDeckProps) {
  const [queue, setQueue] = useState(initialCandidates);

  useEffect(() => {
    setQueue(initialCandidates);
  }, [initialCandidates]);

  const top = queue[0];
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);

  useEffect(() => {
    x.set(0);
  }, [top?.id, x]);

  const recordSwipe = useCallback(
    async (target: SwipeCandidate, direction: "like" | "pass") => {
      if (target.kind === "campaign") return;
      if (swipeMode === "guest") return;
      if (onRecordUserSwipe) {
        await onRecordUserSwipe(target.id, direction);
        return;
      }
      if (supabase && viewerId) {
        const { error } = await supabase.from("user_swipes").insert({
          swiper_id: viewerId,
          target_id: target.id,
          direction,
        });
        if (error) {
          console.error(error);
        }
      }
    },
    [supabase, viewerId, swipeMode, onRecordUserSwipe]
  );

  const finishSwipe = useCallback(
    async (target: SwipeCandidate, direction: "like" | "pass") => {
      if (direction === "like" && swipeMode === "guest") {
        onGuestLike?.();
      }
      await recordSwipe(target, direction);
      setQueue((q) => q.slice(1));
    },
    [recordSwipe, swipeMode, onGuestLike]
  );

  const onDragEnd = useCallback(
    (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
      if (!top) return;
      const threshold = 100;
      if (info.offset.x < -threshold) {
        void finishSwipe(top, "like");
      } else if (info.offset.x > threshold) {
        void finishSwipe(top, "pass");
      }
    },
    [finishSwipe, top]
  );

  if (!top) {
    if (swipeMode === "guest") {
      return (
        <div className="rounded-3xl border border-[var(--hp-border)] bg-[var(--hp-surface)] px-8 py-16 text-center shadow-[var(--hp-shadow)]">
          <p className="font-[family-name:var(--font-hp-display)] text-2xl text-[var(--hp-ink)]">
            End of the preview deck
          </p>
          <p className="mt-2 text-sm text-[var(--hp-ink-muted)]">
            Create a free account to get real matches and keep swiping—not a
            subscription wall, just a real profile.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex rounded-full bg-[var(--hp-rose)] px-6 py-3 text-sm font-semibold text-white"
          >
            Create account
          </Link>
        </div>
      );
    }
    return (
      <div className="rounded-3xl border border-[var(--hp-border)] bg-[var(--hp-surface)] px-8 py-16 text-center shadow-[var(--hp-shadow)]">
        <p className="font-[family-name:var(--font-hp-display)] text-2xl text-[var(--hp-ink)]">
          You are caught up
        </p>
        <p className="mt-2 text-sm text-[var(--hp-ink-muted)]">
          Check back later for new people—or widen your Hall Pass picks.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <p className="text-center text-xs text-[var(--hp-ink-muted)]">
        Swipe <span className="font-semibold text-[var(--hp-ink)]">left</span>{" "}
        to like · Swipe{" "}
        <span className="font-semibold text-[var(--hp-ink)]">right</span> to pass
      </p>
      {swipeMode === "guest" ? (
        <p className="text-center text-xs font-medium text-amber-900/90 dark:text-amber-200/90">
          Likes in preview mode never create matches—sign up to connect for real.
        </p>
      ) : null}

      <div className="relative h-[420px] w-full">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-0 flex w-1/4 items-center justify-start pl-3 text-xs font-semibold uppercase tracking-widest text-emerald-700/90 dark:text-emerald-300/90"
          aria-hidden
        >
          Like
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-0 flex w-1/4 items-center justify-end pr-3 text-xs font-semibold uppercase tracking-widest text-zinc-500"
          aria-hidden
        >
          Pass
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={top.id}
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: -220, right: 220 }}
            dragElastic={0.85}
            onDragEnd={onDragEnd}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="absolute inset-x-0 top-0 z-10 cursor-grab active:cursor-grabbing"
          >
            {top.kind === "campaign" ? (
              <article className="overflow-hidden rounded-3xl border-2 border-amber-400/90 bg-[var(--hp-surface)] shadow-[0_0_36px_rgba(251,191,36,0.42),var(--hp-shadow)] ring-2 ring-amber-300/50 dark:border-amber-500/70 dark:ring-amber-500/35">
                <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-amber-100/90 to-zinc-200/70 dark:from-amber-950/50 dark:to-zinc-900/80">
                  <span className="absolute right-3 top-3 z-20 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-md">
                    Sponsored
                  </span>
                  {top.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={top.image_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-[family-name:var(--font-hp-display)] text-5xl font-semibold text-amber-800/90 dark:text-amber-200/90">
                      {top.display_name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <h2 className="font-[family-name:var(--font-hp-display)] text-2xl font-semibold text-[var(--hp-ink)]">
                    {top.display_name}
                  </h2>
                  <p className="text-sm leading-relaxed text-[var(--hp-ink-muted)]">
                    Promoted profile — swipe left to like and open this campaign
                    (trailers &amp; offers).
                  </p>
                  {top.campaign_cta_text ? (
                    <p className="text-xs font-medium text-[var(--hp-ink-muted)]">
                      CTA:{" "}
                      <span className="text-[var(--hp-ink)]">{top.campaign_cta_text}</span>
                    </p>
                  ) : null}
                </div>
              </article>
            ) : (
              <article className="overflow-hidden rounded-3xl border border-[var(--hp-border)] bg-[var(--hp-surface)] shadow-[var(--hp-shadow)]">
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-rose-100/80 to-zinc-200/60 dark:from-rose-950/40 dark:to-zinc-900/80">
                  <span className="font-[family-name:var(--font-hp-display)] text-5xl font-semibold text-[var(--hp-rose-deep)]">
                    {formatAccountDisplayName(
                      top.account_kind,
                      top.display_name,
                      top.partner_display_name
                    )
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-[family-name:var(--font-hp-display)] text-2xl font-semibold text-[var(--hp-ink)]">
                      {formatAccountDisplayName(
                        top.account_kind,
                        top.display_name,
                        top.partner_display_name
                      )}
                    </h2>
                    {genderLabel(top.gender) ? (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900 dark:bg-sky-900/40 dark:text-sky-100">
                        {genderLabel(top.gender)}
                      </span>
                    ) : null}
                    {top.account_kind === "couple" ? (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900 dark:bg-violet-900/40 dark:text-violet-100">
                        Couple
                      </span>
                    ) : null}
                    {top.is_verified_celebrity ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                        Verified celebrity
                      </span>
                    ) : null}
                    {top.verified_lookalike_celebrity_id ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
                        Verified look-alike
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-[var(--hp-ink-muted)]">
                    <span className="font-medium text-[var(--hp-ink)]">Intent:</span>{" "}
                    {intentLabel(top.relationship_intent)}
                  </p>
                  {top.overlap_count > 0 ? (
                    <p className="rounded-xl bg-rose-50/90 px-3 py-2 text-sm text-[var(--hp-rose-deep)] dark:bg-rose-950/30 dark:text-rose-100">
                      {top.overlap_count} shared Hall Pass pick
                      {top.overlap_count === 1 ? "" : "s"} — similar taste bumps
                      them up your deck.
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--hp-ink-muted)]">
                      No overlap with your list yet—still worth a look.
                    </p>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--hp-ink-muted)]">
                      Their Hall Pass
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {top.hall_pass.length === 0 ? (
                        <li className="text-sm text-[var(--hp-ink-muted)]">
                          No picks yet
                        </li>
                      ) : (
                        top.hall_pass.map((c) => (
                          <li
                            key={c.id}
                            className="rounded-full border border-[var(--hp-border)] bg-white/60 px-3 py-1 text-xs font-medium text-[var(--hp-ink)] dark:bg-zinc-900/60"
                          >
                            {c.name}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </article>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex w-full max-w-sm justify-between gap-4">
        <button
          type="button"
          className="hp-btn-primary flex-1 rounded-full"
          onClick={() => void finishSwipe(top, "like")}
        >
          Like ←
        </button>
        <button
          type="button"
          className="flex-1 rounded-full border border-[var(--hp-border)] bg-[var(--hp-surface)] px-4 py-3 text-sm font-semibold text-[var(--hp-ink)] shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
          onClick={() => void finishSwipe(top, "pass")}
        >
          Pass →
        </button>
      </div>
    </div>
  );
}
