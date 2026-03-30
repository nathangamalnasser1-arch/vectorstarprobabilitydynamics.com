"use client";

import { useState } from "react";
import Link from "next/link";
import { PremiumUpgradeModal } from "./PremiumUpgradeModal";

export function SwipeDiscoverHeader() {
  const [premiumOpen, setPremiumOpen] = useState(false);

  return (
    <>
      <header className="mb-8 flex w-full max-w-2xl items-center justify-between gap-4">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--hp-ink-muted)] hover:text-[var(--hp-ink)]"
        >
          ← Home
        </Link>
        <h1 className="font-[family-name:var(--font-hp-display)] text-2xl font-semibold text-[var(--hp-ink)]">
          Discover
        </h1>
        <button
          type="button"
          onClick={() => setPremiumOpen(true)}
          className="rounded-full border border-[var(--hp-border)] bg-[var(--hp-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--hp-rose)] shadow-sm hover:bg-[var(--hp-rose)]/10"
        >
          Premium
        </button>
      </header>
      <PremiumUpgradeModal open={premiumOpen} onOpenChange={setPremiumOpen} />
    </>
  );
}
