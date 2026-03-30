"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  AccountKind,
  ProfileGender,
  RelationshipIntent,
  SeekingOption,
} from "@/types/database";
import {
  validateAccountRegistration,
} from "@/lib/account-kind";
import {
  toggleSeekingOption,
  validateSeeking,
} from "@/lib/discovery-match";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getPrimaryBackend, isAuthBackendConfigured } from "@/lib/data-backend";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { RegisterStep } from "./RegisterStep";
import { RelationshipIntentStep } from "./RelationshipIntentStep";

const FALLBACK_KEY = "hallpass_onboarding_v1";

type FallbackDraft = {
  email: string;
  displayName: string;
  accountKind: AccountKind;
  gender: ProfileGender;
  seeking: SeekingOption[];
  partnerDisplayName: string;
  relationshipIntent: RelationshipIntent | null;
  completedAt: string | null;
};

function writeFallback(draft: FallbackDraft) {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(draft));
}

type Step = "register" | "intent" | "done";

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>("register");
  const [accountKind, setAccountKind] = useState<AccountKind>("single");
  const [gender, setGender] = useState<ProfileGender | null>(null);
  const [seeking, setSeeking] = useState<SeekingOption[]>([]);
  const [partnerDisplayName, setPartnerDisplayName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [intent, setIntent] = useState<RelationshipIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supabaseMissing, setSupabaseMissing] = useState(false);

  const handleRegister = useCallback(async () => {
    setError(null);
    const validation = validateAccountRegistration(
      accountKind,
      displayName,
      partnerDisplayName
    );
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    if (gender === null) {
      setError("Select how you identify so we can show the right people in Discover.");
      return;
    }
    if (!validateSeeking(seeking)) {
      setError("Choose who you want to see in Discover (at least one option).");
      return;
    }

    setIsSubmitting(true);
    const backend = getPrimaryBackend();

    if (backend === "firebase") {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      if (!auth || !db) {
        setError("Firebase is not configured.");
        setIsSubmitting(false);
        return;
      }
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await setDoc(doc(db, "profiles", cred.user.uid), {
          display_name: displayName.trim(),
          email: email.trim(),
          account_kind: accountKind,
          gender,
          seeking,
          partner_display_name:
            accountKind === "couple" ? partnerDisplayName.trim() : null,
          account_status: "active",
          red_flag_count: 0,
          subscription_tier: "free",
          stripe_customer_id: null,
          hall_pass_ids: [],
          is_verified_celebrity: false,
          verified_lookalike_celebrity_id: null,
          relationship_intent: null,
          onboarding_completed_at: null,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        setStep("intent");
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: string }).message)
            : "Could not create account.";
        setError(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSupabaseMissing(true);
      writeFallback({
        email: email.trim(),
        displayName: displayName.trim(),
        accountKind,
        gender,
        seeking,
        partnerDisplayName:
          accountKind === "couple" ? partnerDisplayName.trim() : "",
        relationshipIntent: null,
        completedAt: null,
      });
      setStep("intent");
      setIsSubmitting(false);
      return;
    }

    const meta = {
      display_name: displayName.trim(),
      account_kind: accountKind,
      gender,
      seeking,
      partner_display_name:
        accountKind === "couple" ? partnerDisplayName.trim() : "",
    };

    const { error: signErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: meta,
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/onboarding` : undefined,
      },
    });

    if (signErr) {
      setError(signErr.message);
      setIsSubmitting(false);
      return;
    }

    const { data: sessionData, error: sessionErr } =
      await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      setError(
        "Check your email to confirm your account, then return here to set your relationship intent."
      );
      setIsSubmitting(false);
      return;
    }

    const { error: profileUpdateErr } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        account_kind: accountKind,
        gender,
        seeking,
        partner_display_name:
          accountKind === "couple" ? partnerDisplayName.trim() : null,
      })
      .eq("id", sessionData.session.user.id);

    if (profileUpdateErr) {
      setError(
        `${profileUpdateErr.message} If this persists, your discovery preferences may not be saved—try again or contact support.`
      );
      setIsSubmitting(false);
      return;
    }

    setStep("intent");
    setIsSubmitting(false);
  }, [
    accountKind,
    displayName,
    email,
    gender,
    password,
    partnerDisplayName,
    seeking,
  ]);

  const handleIntent = useCallback(async () => {
    setIntentError(null);
    if (intent === null) {
      setIntentError("Select a relationship intent to continue.");
      return;
    }
    setIsSubmitting(true);
    const backend = getPrimaryBackend();
    const now = new Date().toISOString();

    if (backend === "firebase") {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      const user = auth?.currentUser;
      if (!auth || !db || !user) {
        setIntentError(
          "Your session expired. Sign in again and finish onboarding."
        );
        setIsSubmitting(false);
        return;
      }
      try {
        await updateDoc(doc(db, "profiles", user.uid), {
          relationship_intent: intent,
          onboarding_completed_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        setStep("done");
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: string }).message)
            : "Could not save.";
        setIntentError(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      writeFallback({
        email: email.trim(),
        displayName: displayName.trim(),
        accountKind,
        gender: gender ?? "other",
        seeking,
        partnerDisplayName:
          accountKind === "couple" ? partnerDisplayName.trim() : "",
        relationshipIntent: intent,
        completedAt: now,
      });
      setStep("done");
      setIsSubmitting(false);
      return;
    }

    const { data: sessionData, error: sessionErr } =
      await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      setIntentError(
        "Your session expired or email is not confirmed. Sign in and try again."
      );
      setIsSubmitting(false);
      return;
    }

    const userId = sessionData.session.user.id;
    const { error: upErr } = await supabase.from("profiles").update({
      relationship_intent: intent,
      onboarding_completed_at: now,
    }).eq("id", userId);

    if (upErr) {
      setIntentError(upErr.message);
      setIsSubmitting(false);
      return;
    }

    setStep("done");
    setIsSubmitting(false);
  }, [
    accountKind,
    displayName,
    email,
    gender,
    intent,
    partnerDisplayName,
    seeking,
  ]);

  const devBanner =
    !isAuthBackendConfigured() && step !== "done" ? (
      <p className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        No Firebase or Supabase env vars are set. You can still click through;
        choices save to this browser only.
      </p>
    ) : null;

  return (
    <div className="w-full max-w-xl">
      {devBanner}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hp-ink-muted)]">
            {step === "done"
              ? "Onboarding complete"
              : `Step ${step === "register" ? "1" : "2"} of 2`}
          </p>
          <h1 className="font-[family-name:var(--font-hp-display)] text-3xl font-semibold tracking-tight text-[var(--hp-ink)] sm:text-4xl">
            {step === "register" && "Create your account"}
            {step === "intent" && "Relationship intent"}
            {step === "done" && "You are in"}
          </h1>
        </div>
        {supabaseMissing ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            Local preview
          </span>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        {step === "register" ? (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <RegisterStep
              accountKind={accountKind}
              gender={gender}
              seeking={seeking}
              partnerDisplayName={partnerDisplayName}
              displayName={displayName}
              email={email}
              password={password}
              error={error}
              isSubmitting={isSubmitting}
              onAccountKindChange={(v) => {
                setAccountKind(v);
                if (v === "single") setPartnerDisplayName("");
              }}
              onGenderChange={setGender}
              onSeekingToggle={(opt) =>
                setSeeking((prev) => toggleSeekingOption(prev, opt))
              }
              onPartnerDisplayNameChange={setPartnerDisplayName}
              onDisplayNameChange={setDisplayName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleRegister}
            />
          </motion.div>
        ) : null}

        {step === "intent" ? (
          <motion.div
            key="intent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <RelationshipIntentStep
              value={intent}
              error={intentError}
              isSubmitting={isSubmitting}
              onChange={setIntent}
              onSubmit={handleIntent}
            />
          </motion.div>
        ) : null}

        {step === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 rounded-3xl border border-[var(--hp-border)] bg-[var(--hp-surface)] p-8 shadow-[var(--hp-shadow)]"
          >
            <p className="text-lg text-[var(--hp-ink)]">
              Onboarding is complete. Next up: build your Hall Pass list and run
              the look-alike radar.
            </p>
            <a
              href="/swipe"
              className="inline-flex items-center justify-center rounded-full bg-[var(--hp-rose)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Go to Discover
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
