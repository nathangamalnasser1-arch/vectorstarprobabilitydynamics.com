"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import type { AccountKind } from "@/types/database";
import { ACCOUNT_KIND_OPTIONS } from "@/lib/account-kind";
import { getPrimaryBackend } from "@/lib/data-backend";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export function LoginClient() {
  const [accountKind, setAccountKind] = useState<AccountKind>("single");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const backend = getPrimaryBackend();

    if (backend === "firebase") {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      if (!auth || !db) {
        setError("Firebase is not configured. Add Firebase keys to .env.local.");
        return;
      }
      setIsSubmitting(true);
      try {
        const cred = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        const profileSnap = await getDoc(doc(db, "profiles", cred.user.uid));
        const profile = profileSnap.data();
        if (!profile) {
          await auth.signOut();
          setError("Could not load your profile. Try again or contact support.");
          setIsSubmitting(false);
          return;
        }
        const stored = (profile.account_kind ?? "single") as AccountKind;
        if (stored !== accountKind) {
          await auth.signOut();
          const label = stored === "couple" ? "couple" : "single";
          const pick = stored === "couple" ? "Couple" : "Single";
          setError(
            `This email is registered as a ${label} account. Select “${pick}” above and try again.`
          );
          setIsSubmitting(false);
          return;
        }
        window.location.href = "/swipe";
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "code" in err
            ? String((err as { message?: string }).message ?? err)
            : "Sign-in failed.";
        setError(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError(
        "Supabase is not configured. Add keys to .env.local or use Firebase."
      );
      return;
    }

    setIsSubmitting(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signErr) {
      setError(signErr.message);
      setIsSubmitting(false);
      return;
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      setError("Could not load your session.");
      setIsSubmitting(false);
      return;
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("account_kind")
      .eq("id", userData.user.id)
      .single();

    if (profileErr || !profile) {
      await supabase.auth.signOut();
      setError("Could not load your profile. Try again or contact support.");
      setIsSubmitting(false);
      return;
    }

    const stored = (profile.account_kind ?? "single") as AccountKind;
    if (stored !== accountKind) {
      await supabase.auth.signOut();
      const label = stored === "couple" ? "couple" : "single";
      const pick = stored === "couple" ? "Couple" : "Single";
      setError(
        `This email is registered as a ${label} account. Select “${pick}” above and try again.`
      );
      setIsSubmitting(false);
      return;
    }

    window.location.href = "/swipe";
  };

  if (!isSupabaseConfigured() && getPrimaryBackend() !== "firebase") {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-amber-200/80 bg-amber-50 px-6 py-10 text-center text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="text-sm">
          Add Firebase or Supabase environment variables to enable login. You can
          still use Try without an account.
        </p>
        <Link
          href="/try"
          className="mt-4 inline-block text-sm font-semibold text-[var(--hp-rose)] underline"
        >
          Try Discover
        </Link>
      </div>
    );
  }

  return (
    <form
      className="mx-auto flex w-full max-w-md flex-col gap-5"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--hp-ink-muted)]">
          Sign in as
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
                name="loginAccountKind"
                value={opt.value}
                checked={selected}
                onChange={() => setAccountKind(opt.value)}
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

      <div className="space-y-1">
        <label
          htmlFor="login-email"
          className="text-sm font-medium text-[var(--hp-ink-muted)]"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="hp-input"
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="login-password"
          className="text-sm font-medium text-[var(--hp-ink-muted)]"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="hp-input"
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
        className="hp-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-[var(--hp-ink-muted)]">
        New here?{" "}
        <Link href="/onboarding" className="font-semibold text-[var(--hp-rose)]">
          Create an account
        </Link>
      </p>
    </form>
  );
}
