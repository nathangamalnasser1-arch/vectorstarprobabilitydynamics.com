import Link from "next/link";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal-contact";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--hp-border)] bg-[var(--hp-surface)]/80 px-4 py-6 text-center text-xs text-[var(--hp-ink-muted)] sm:px-8">
      <p>
        © {new Date().getFullYear()} Hall Pass. All rights reserved.{" "}
        <Link
          href="/legal"
          className="font-medium text-[var(--hp-ink)] underline-offset-2 hover:underline"
        >
          Legal &amp; IP
        </Link>
        {" · "}
        <a
          href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=Hall%20Pass%20—%20IP%20inquiry`}
          className="font-medium text-[var(--hp-ink)] underline-offset-2 hover:underline"
        >
          {LEGAL_CONTACT_EMAIL}
        </a>
      </p>
    </footer>
  );
}
