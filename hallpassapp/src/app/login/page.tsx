import Link from "next/link";
import { LoginClient } from "./login-client";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-14 sm:px-8">
      <header className="mb-8 flex w-full max-w-xl items-center justify-between gap-4">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--hp-ink-muted)] hover:text-[var(--hp-ink)]"
        >
          ← Home
        </Link>
        <h1 className="font-[family-name:var(--font-hp-display)] text-2xl font-semibold text-[var(--hp-ink)]">
          Log in
        </h1>
        <span className="w-12" aria-hidden />
      </header>
      <LoginClient />
    </div>
  );
}
