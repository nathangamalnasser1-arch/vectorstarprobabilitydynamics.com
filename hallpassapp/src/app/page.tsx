import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-8 sm:px-8">
        <span className="font-[family-name:var(--font-hp-display)] text-2xl font-semibold tracking-tight text-[var(--hp-ink)]">
          Hall Pass
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/try"
            className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-[var(--hp-ink-muted)] transition hover:text-[var(--hp-ink)]"
          >
            Try
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-[var(--hp-ink-muted)] transition hover:text-[var(--hp-ink)]"
          >
            Log in
          </Link>
          <Link
            href="/swipe"
            className="rounded-full border border-[var(--hp-border)] bg-[var(--hp-surface)] px-4 py-2 text-sm font-semibold text-[var(--hp-ink)] shadow-sm transition hover:border-[rgba(196,92,92,0.35)]"
          >
            Discover
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full border border-[var(--hp-border)] bg-[var(--hp-surface)] px-4 py-2 text-sm font-semibold text-[var(--hp-ink)] shadow-sm transition hover:border-[rgba(196,92,92,0.35)]"
          >
            Get started
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 pb-20 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--hp-ink-muted)]">
          Consent-first discovery
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-hp-display)] text-4xl font-semibold leading-tight text-[var(--hp-ink)] sm:text-5xl">
          Match with everyday people who look like your hall pass.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--hp-ink-muted)]">
          Relationship intent tags, AI-assisted verification, and a three-strike
          safety system keep the experience honest—so fantasy stays fun, not
          harmful.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/try"
            className="inline-flex items-center justify-center rounded-full border border-[var(--hp-border)] bg-[var(--hp-surface)] px-8 py-3 text-sm font-semibold text-[var(--hp-ink)] shadow-sm transition hover:border-[rgba(196,92,92,0.35)]"
          >
            Try without account
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-full bg-[var(--hp-rose)] px-8 py-3 text-sm font-semibold text-white shadow-[var(--hp-shadow)] transition hover:opacity-95"
          >
            Start onboarding
          </Link>
        </div>
      </main>
    </div>
  );
}
