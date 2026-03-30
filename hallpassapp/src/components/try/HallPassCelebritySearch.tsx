"use client";

import { useCallback, useEffect, useState } from "react";
import type { GuestPick } from "@/lib/guest-hall-pass";
import { CELEBRITY_CATALOG } from "@/lib/swipe-demo-data";

type ApiCelebrity = { id: string; name: string; slug?: string };

type HallPassCelebritySearchProps = {
  selected: GuestPick[];
  onAdd: (pick: GuestPick) => void;
  onRemove: (id: string) => void;
};

export function HallPassCelebritySearch({
  selected,
  onAdd,
  onRemove,
}: HallPassCelebritySearchProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ApiCelebrity[]>([]);
  const [loading, setLoading] = useState(false);
  const [addName, setAddName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const selectedIds = new Set(selected.map((s) => s.id));

  const toggleCatalogPick = useCallback(
    (id: string, name: string, checked: boolean) => {
      if (checked) onAdd({ id, name });
      else onRemove(id);
    },
    [onAdd, onRemove]
  );

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/celebrities?q=${encodeURIComponent(q)}`
        );
        const json = (await res.json()) as { celebrities?: ApiCelebrity[] };
        setResults(json.celebrities ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => window.clearTimeout(handle);
  }, [q]);

  const handleAddNew = useCallback(async () => {
    setAddError(null);
    const name = addName.trim();
    if (name.length < 2) {
      setAddError("Enter at least 2 characters.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/celebrities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = (await res.json()) as {
        error?: string;
        celebrity?: { id: string; name: string };
      };
      if (!res.ok) {
        setAddError(json.error ?? "Could not add celebrity.");
        return;
      }
      if (json.celebrity) {
        onAdd({ id: json.celebrity.id, name: json.celebrity.name });
        setAddName("");
      }
    } catch {
      setAddError("Network error. Try again.");
    } finally {
      setAdding(false);
    }
  }, [addName, onAdd]);

  return (
    <div className="flex w-full flex-col gap-8">
      {/* 1 — Original-style list selection (kept; catalog is larger than “5 names” in data) */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--hp-ink)]">
            Select from the list
          </h3>
          <p className="mt-1 text-xs text-[var(--hp-ink-muted)]">
            Tap to add or remove. You can combine this with search and “add new”
            below.
          </p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {CELEBRITY_CATALOG.map((c) => {
            const checked = selectedIds.has(c.id);
            return (
              <li key={c.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    checked
                      ? "border-[rgba(196,92,92,0.45)] bg-rose-50/80 dark:bg-rose-950/25"
                      : "border-[var(--hp-border)] bg-[var(--hp-surface)] hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      toggleCatalogPick(c.id, c.name, e.target.checked)
                    }
                    className="h-4 w-4 rounded border-[var(--hp-border)]"
                  />
                  <span className="font-medium text-[var(--hp-ink)]">
                    {c.name}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 2 — Database search */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--hp-ink)]">
          Search the database
        </h3>
        <label className="sr-only" htmlFor="celeb-search">
          Search celebrities
        </label>
        <input
          id="celeb-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a name to search everyone in the database…"
          autoComplete="off"
          className="hp-input"
        />
        {loading ? (
          <p className="text-xs text-[var(--hp-ink-muted)]">Searching…</p>
        ) : null}

        <ul className="max-h-52 overflow-y-auto rounded-2xl border border-[var(--hp-border)] bg-[var(--hp-surface)] p-2 shadow-inner">
          {loading ? (
            <li className="px-3 py-6 text-center text-sm text-[var(--hp-ink-muted)]">
              Loading results…
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-[var(--hp-ink-muted)]">
              {q.trim()
                ? "No matches. Try another spelling or add a new name below."
                : "Could not load names. Check your connection or Supabase config."}
            </li>
          ) : (
            results.map((c) => {
              const already = selectedIds.has(c.id);
              return (
                <li
                  key={c.id}
                  className="border-b border-[var(--hp-border)] last:border-0"
                >
                  <button
                    type="button"
                    disabled={already}
                    onClick={() => onAdd({ id: c.id, name: c.name })}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--hp-ink)] transition hover:bg-zinc-100/80 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800/80"
                  >
                    <span>{c.name}</span>
                    {already ? (
                      <span className="text-xs text-[var(--hp-ink-muted)]">
                        In your list
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[var(--hp-rose)]">
                        Add to Hall Pass
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {/* 3 — Add new row to the database */}
      <section className="rounded-2xl border border-dashed border-[var(--hp-border)] bg-zinc-50/50 p-4 dark:bg-zinc-900/20">
        <h3 className="text-sm font-semibold text-[var(--hp-ink)]">
          Add a celebrity to the database
        </h3>
        <p className="mt-1 text-xs text-[var(--hp-ink-muted)]">
          Saves to the shared database when Supabase is configured (service role
          on the server). We verify the name is a real public figure—stricter if
          OpenAI is enabled.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <input
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Full name"
            className="hp-input flex-1"
          />
          <button
            type="button"
            disabled={adding}
            onClick={() => void handleAddNew()}
            className="rounded-full border border-[var(--hp-border)] bg-[var(--hp-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--hp-ink)] shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:hover:bg-zinc-800"
          >
            {adding ? "Saving…" : "Save to database"}
          </button>
        </div>
        {addError ? (
          <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
            {addError}
          </p>
        ) : null}
      </section>

      {/* 4 — Summary */}
      <section>
        <h3 className="text-sm font-medium text-[var(--hp-ink-muted)]">
          Your Hall Pass ({selected.length})
        </h3>
        {selected.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--hp-ink-muted)]">
            Pick from the list, search, or add someone new—then continue when you
            have at least one.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {selected.map((s) => (
              <li key={s.id}>
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--hp-border)] bg-[var(--hp-surface)] py-1 pl-3 pr-1 text-sm text-[var(--hp-ink)]">
                  {s.name}
                  <button
                    type="button"
                    className="rounded-full px-2 py-0.5 text-xs font-semibold text-[var(--hp-ink-muted)] hover:bg-zinc-200/80 hover:text-[var(--hp-ink)] dark:hover:bg-zinc-700"
                    onClick={() => onRemove(s.id)}
                    aria-label={`Remove ${s.name}`}
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
