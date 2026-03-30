"use client";

import type { AccountKind, ProfileGender, SeekingOption } from "@/types/database";
import { ACCOUNT_KIND_OPTIONS } from "@/lib/account-kind";
import { SEEKING_OPTIONS } from "@/lib/discovery-match";
import { PROFILE_GENDER_OPTIONS } from "@/lib/gender-discovery";

type RegisterStepProps = {
  accountKind: AccountKind;
  gender: ProfileGender | null;
  seeking: SeekingOption[];
  partnerDisplayName: string;
  displayName: string;
  email: string;
  password: string;
  error: string | null;
  isSubmitting: boolean;
  onAccountKindChange: (value: AccountKind) => void;
  onGenderChange: (value: ProfileGender) => void;
  onSeekingToggle: (option: SeekingOption) => void;
  onPartnerDisplayNameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function RegisterStep({
  accountKind,
  gender,
  seeking,
  partnerDisplayName,
  displayName,
  email,
  password,
  error,
  isSubmitting,
  onAccountKindChange,
  onGenderChange,
  onSeekingToggle,
  onPartnerDisplayNameChange,
  onDisplayNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: RegisterStepProps) {
  return (
    <form
      className="flex w-full max-w-md flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--hp-ink-muted)]">
          Account type
        </legend>
        {ACCOUNT_KIND_OPTIONS.map((opt) => {
          const selected = accountKind === opt.value;
          return (
            <label
              key={opt.value}
              className={`hp-intent-card ${selected ? "hp-intent-card--active" : ""}`}
            >
              <input
                type="radio"
                name="accountKind"
                value={opt.value}
                checked={selected}
                onChange={() => onAccountKindChange(opt.value)}
                className="sr-only"
              />
              <span className="flex flex-col gap-1">
                <span className="font-semibold text-[var(--hp-ink)]">
                  {opt.label}
                </span>
                <span className="text-sm text-[var(--hp-ink-muted)]">
                  {opt.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--hp-ink-muted)]">
          How you identify
        </legend>
        <p className="text-xs text-[var(--hp-ink-muted)]">
          Shown on your profile and used with your “who to see” choices below.
        </p>
        {PROFILE_GENDER_OPTIONS.map((opt) => {
          const selected = gender === opt.value;
          return (
            <label
              key={opt.value}
              className={`hp-intent-card ${selected ? "hp-intent-card--active" : ""}`}
            >
              <input
                type="radio"
                name="profileGender"
                value={opt.value}
                checked={selected}
                onChange={() => onGenderChange(opt.value)}
                className="sr-only"
              />
              <span className="flex flex-col gap-1">
                <span className="font-semibold text-[var(--hp-ink)]">
                  {opt.label}
                </span>
                <span className="text-sm text-[var(--hp-ink-muted)]">
                  {opt.hint}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--hp-ink-muted)]">
          Who you want to see in Discover
        </legend>
        <p className="text-xs text-[var(--hp-ink-muted)]">
          Pick one or more. “Everyone” clears other filters. Similar Hall Pass
          taste still ranks people within this pool.
        </p>
        <div className="flex flex-col gap-2">
          {SEEKING_OPTIONS.map((opt) => {
            const selected =
              opt.value === "everyone"
                ? seeking.includes("everyone")
                : seeking.includes(opt.value) && !seeking.includes("everyone");
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSeekingToggle(opt.value)}
                className={`hp-intent-card text-left ${selected ? "hp-intent-card--active" : ""}`}
              >
                <span className="flex flex-col gap-1">
                  <span className="font-semibold text-[var(--hp-ink)]">
                    {opt.label}
                  </span>
                  <span className="text-sm text-[var(--hp-ink-muted)]">
                    {opt.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1">
        <label
          htmlFor="displayName"
          className="text-sm font-medium text-[var(--hp-ink-muted)]"
        >
          {accountKind === "couple" ? "Your name" : "Display name"}
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          className="hp-input"
          placeholder={
            accountKind === "couple" ? "First name or nickname" : "How you appear on Hall Pass"
          }
        />
      </div>

      {accountKind === "couple" ? (
        <div className="space-y-1">
          <label
            htmlFor="partnerDisplayName"
            className="text-sm font-medium text-[var(--hp-ink-muted)]"
          >
            Partner’s name
          </label>
          <input
            id="partnerDisplayName"
            name="partnerDisplayName"
            type="text"
            autoComplete="off"
            required
            value={partnerDisplayName}
            onChange={(e) => onPartnerDisplayNameChange(e.target.value)}
            className="hp-input"
            placeholder="Their first name or nickname"
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <label
          htmlFor="email"
          className="text-sm font-medium text-[var(--hp-ink-muted)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="hp-input"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="text-sm font-medium text-[var(--hp-ink-muted)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="hp-input"
          placeholder="At least 8 characters"
        />
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
        >
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="hp-btn-primary mt-1 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating account…" : "Continue"}
      </button>
    </form>
  );
}
