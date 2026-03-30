"use client";

import type { RelationshipIntent } from "@/types/database";
import { RELATIONSHIP_INTENTS } from "@/lib/relationship-intent";

type RelationshipIntentStepProps = {
  value: RelationshipIntent | null;
  error: string | null;
  isSubmitting: boolean;
  onChange: (value: RelationshipIntent) => void;
  onSubmit: () => void;
};

export function RelationshipIntentStep({
  value,
  error,
  isSubmitting,
  onChange,
  onSubmit,
}: RelationshipIntentStepProps) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <p className="text-sm leading-relaxed text-[var(--hp-ink-muted)]">
        Honest intent keeps Hall Pass ethical. Pick the tag that matches how
        you are showing up—this is required before you can match.
      </p>
      <fieldset className="space-y-3">
        <legend className="sr-only">Relationship intent</legend>
        {RELATIONSHIP_INTENTS.map((item) => {
          const selected = value === item.value;
          return (
            <label
              key={item.value}
              className={`hp-intent-card ${selected ? "hp-intent-card--active" : ""}`}
            >
              <input
                type="radio"
                name="relationshipIntent"
                value={item.value}
                checked={selected}
                onChange={() => onChange(item.value)}
                className="sr-only"
              />
              <span className="flex flex-col gap-1">
                <span className="font-semibold text-[var(--hp-ink)]">
                  {item.label}
                </span>
                <span className="text-sm text-[var(--hp-ink-muted)]">
                  {item.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
        >
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={isSubmitting || value === null}
        onClick={onSubmit}
        className="hp-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving…" : "Finish onboarding"}
      </button>
    </div>
  );
}
